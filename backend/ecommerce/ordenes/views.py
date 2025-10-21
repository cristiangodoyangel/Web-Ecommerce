from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Orden, OrdenProducto
from .serializers import OrdenSerializer, OrdenInvitadoSerializer
from carrito.models import Carrito
from pagos.models import Pago

@method_decorator(csrf_exempt, name='dispatch')
class OrdenViewSet(viewsets.ModelViewSet):
    serializer_class = OrdenSerializer

    def get_permissions(self):
        """
        Permitir crear órdenes sin autenticación SOLO para invitados en endpoints específicos
        """
        # Solo aplicar permisos especiales para endpoints de API específicos
        if self.action in ['crear_orden_invitado', 'preparar_pago_invitado']:
            return []  # Sin autenticación requerida
        elif self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]  # Requiere autenticación para CRUD estándar
        else:
            return [permissions.IsAuthenticated()]  # Por defecto requiere autenticación

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Orden.objects.filter(usuario=self.request.user)
        return Orden.objects.none()

    @action(detail=False, methods=['get'])
    def historial(self, request):
        """
        Obtener historial de órdenes del usuario autenticado
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        ordenes = self.get_queryset().order_by('-fecha')  # Cambié fecha_creacion por fecha
        serializer = self.get_serializer(ordenes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def verificar_orden_pendiente(self, request):
        """
        Verificar si el usuario tiene una orden pendiente
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Buscar orden pendiente más reciente
        orden_pendiente = Orden.objects.filter(
            usuario=request.user,
            estado='pendiente'
        ).order_by('-fecha').first()
        
        if orden_pendiente:
            # Obtener productos de la orden
            productos = []
            for item in orden_pendiente.productos.all():
                productos.append({
                    'nombre': item.nombre_producto,
                    'cantidad': item.cantidad,
                    'precio': float(item.precio_producto),
                    'subtotal': float(item.subtotal)
                })
            
            return Response({
                'tiene_pendiente': True,
                'orden': {
                    'id': orden_pendiente.id,
                    'total': float(orden_pendiente.total),
                    'fecha': orden_pendiente.fecha,
                    'productos': productos
                }
            })
        else:
            return Response({
                'tiene_pendiente': False
            })

    @action(detail=False, methods=['post'])
    def cancelar_orden_pendiente(self, request):
        """
        Cancelar orden pendiente y restaurar stock
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        orden_id = request.data.get('orden_id')
        
        if not orden_id:
            return Response(
                {'error': 'Se requiere orden_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar la orden
            orden = Orden.objects.get(
                id=orden_id,
                usuario=request.user,
                estado='pendiente'
            )
            
            # Restaurar stock de cada producto
            for item in orden.productos.all():
                from productos.models import Producto
                try:
                    producto = Producto.objects.get(id=item.producto_id)
                    producto.stock += item.cantidad
                    producto.save()
                except Producto.DoesNotExist:
                    pass
            
            # Cambiar estado a cancelado
            orden.estado = 'cancelado'
            orden.save()
            
            return Response({
                'message': 'Orden cancelada exitosamente',
                'orden_id': orden.id
            })
            
        except Orden.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada o ya procesada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def crear_orden_usuario(self, request):
        """
        Crear orden para usuario autenticado con reducción de stock
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # CANCELAR ÓRDENES PENDIENTES ANTERIORES (sin restaurar stock porque nunca se descontó)
        ordenes_pendientes = Orden.objects.filter(
            usuario=request.user,
            estado='pendiente'
        )
        
        if ordenes_pendientes.exists():
            for orden_pendiente in ordenes_pendientes:
                # Marcar como cancelada en lugar de eliminar (para mantener historial)
                orden_pendiente.estado = 'cancelado'
                orden_pendiente.save()

        # Obtener items del carrito del usuario autenticado
        carrito_items = list(Carrito.objects.filter(usuario=request.user).select_related('producto'))
        
        if not carrito_items:
            return Response(
                {'error': 'El carrito está vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock ANTES de cualquier transacción
        for item in carrito_items:
            if item.cantidad > item.producto.stock:
                return Response(
                    {'error': f'Stock insuficiente para {item.producto.nombre}. Stock disponible: {item.producto.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            # Obtener método de entrega desde la request (por defecto delivery)
            metodo_entrega = request.data.get('metodo_entrega', 'delivery')
            if metodo_entrega not in ['delivery', 'retiro']:
                metodo_entrega = 'delivery'
            
            # Calcular total de productos primero para evaluar envío gratis
            total_productos = 0
            now = timezone.now()
            
            for item in carrito_items:
                # Calcular precio considerando ofertas activas
                producto = item.producto
                precio_unitario = producto.precio
                
                # Buscar oferta activa
                try:
                    oferta_activa = producto.ofertas.filter(
                        activo=True,
                        fecha_inicio__lte=now
                    ).filter(
                        models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
                    ).first()
                    
                    if oferta_activa:
                        precio_unitario = oferta_activa.precio_con_descuento
                except Exception:
                    pass  # Usar precio base si falla
                
                subtotal = precio_unitario * item.cantidad
                total_productos += subtotal
            
            # APLICAR ENVÍO GRATIS SI COMPRA ES SUPERIOR A $50.000
            envio_gratis_desbloqueado = total_productos >= 50000
            costo_envio = 3500 if metodo_entrega == 'delivery' else 0
            if envio_gratis_desbloqueado and metodo_entrega == 'delivery':
                costo_envio = 0
                print(f"🎉 [USUARIO-AUTH] ¡ENVÍO GRATIS DESBLOQUEADO! Total productos: ${total_productos}")
            
            # Crear la orden
            orden = Orden.objects.create(
                usuario=request.user,
                metodo_entrega=metodo_entrega,
                costo_envio=costo_envio,
                estado='pendiente'
            )

            total = total_productos  # Reiniciar para calcular productos de orden
            
            # Crear productos de la orden y reducir stock
            for item in carrito_items:
                # Calcular precio considerando ofertas activas
                producto = item.producto
                precio_unitario = producto.precio
                
                # Buscar oferta activa
                try:
                    oferta_activa = producto.ofertas.filter(
                        activo=True,
                        fecha_inicio__lte=now
                    ).filter(
                        models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
                    ).first()
                    
                    if oferta_activa:
                        precio_unitario = oferta_activa.precio_con_descuento
                except Exception:
                    pass  # Usar precio base si falla
                
                subtotal = precio_unitario * item.cantidad
                total += subtotal

                OrdenProducto.objects.create(
                    orden=orden,
                    producto_id=producto.id,
                    nombre_producto=producto.nombre,
                    precio_producto=precio_unitario,  # Guardar precio con descuento
                    cantidad=item.cantidad,
                    subtotal=subtotal
                )

                # ⚠️ Stock NO se descuenta aquí - se descuenta cuando se confirma el pago en el webhook

            # Agregar costo de envío al total
            total += costo_envio

            # Actualizar total de la orden
            orden.total = total
            orden.save()

            # Crear pago pendiente
            pago = Pago.objects.create(
                orden=orden,
                monto=total,
                estado='pendiente'
            )

            # Limpiar carrito
            Carrito.objects.filter(usuario=request.user).delete()
            
            # Respuesta compatible con el frontend
            return Response({
                'orden_id': orden.id,
                'total': float(total),
                'total_productos': float(total_productos),
                'metodo_entrega': metodo_entrega,
                'costo_envio': float(costo_envio),
                'envio_gratis_desbloqueado': envio_gratis_desbloqueado,
                'message': 'Orden creada exitosamente'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # En caso de error, intentar limpiar la orden creada
            try:
                if 'orden' in locals():
                    orden.delete()
            except Exception:
                pass
            
            return Response(
                {'error': f'Error al procesar la orden: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def preparar_pago_invitado(self, request):
        """
        Preparar datos para pago de usuario invitado (NO crear orden todavía)
        La orden se creará solo cuando el pago se confirme en el webhook
        """
        print(f"\n🛒 [PREPARAR-PAGO] Datos recibidos: {request.data}")
        
        serializer = OrdenInvitadoSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"❌ [PREPARAR-PAGO] Errores de validación: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_key = request.session.session_key
        
        if not session_key:
            return Response(
                {'error': 'No hay sesión activa'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener items del carrito
        carrito_items = Carrito.objects.filter(session_key=session_key)
        
        if not carrito_items.exists():
            return Response(
                {'error': 'El carrito está vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verificar stock disponible ANTES de proceder al pago
            for item in carrito_items:
                if item.cantidad > item.producto.stock:
                    return Response(
                        {'error': f'Stock insuficiente para {item.producto.nombre}. Stock disponible: {item.producto.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Obtener método de entrega y calcular costo de envío
            metodo_entrega = serializer.validated_data.get('metodo_entrega', 'delivery')
            if metodo_entrega not in ['delivery', 'retiro']:
                metodo_entrega = 'delivery'
                
            # Calcular costo de envío
            costo_envio = 3500 if metodo_entrega == 'delivery' else 0
            
            print(f"🚚 [PREPARAR-PAGO] Método de entrega: {metodo_entrega}")
            print(f"💰 [PREPARAR-PAGO] Costo de envío inicial: ${costo_envio}")
            
            # Calcular total de productos sin envío primero
            total_productos = 0
            now = timezone.now()
            
            for item in carrito_items:
                # Calcular precio considerando ofertas activas
                producto = item.producto
                precio_unitario = producto.precio
                
                # Buscar oferta activa
                try:
                    oferta_activa = producto.ofertas.filter(
                        activo=True,
                        fecha_inicio__lte=now
                    ).filter(
                        models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
                    ).first()
                    
                    if oferta_activa:
                        precio_unitario = oferta_activa.precio_con_descuento
                except Exception:
                    pass  # Usar precio base si falla
                
                subtotal = precio_unitario * item.cantidad
                total_productos += subtotal

            # APLICAR ENVÍO GRATIS SI COMPRA ES SUPERIOR A $50.000
            envio_gratis_desbloqueado = total_productos >= 50000
            if envio_gratis_desbloqueado and metodo_entrega == 'delivery':
                costo_envio = 0
                print(f"🎉 [PREPARAR-PAGO] ¡ENVÍO GRATIS DESBLOQUEADO! Total productos: ${total_productos}")
            
            # Agregar costo de envío al total
            total_final = total_productos + costo_envio
            
            # Guardar datos del invitado en la sesión para el webhook
            request.session['datos_invitado'] = {
                'email': serializer.validated_data['email'],
                'nombre': serializer.validated_data['nombre'],
                'telefono': serializer.validated_data['telefono'],
                'direccion': serializer.validated_data['direccion'],
                'metodo_entrega': metodo_entrega,
                'costo_envio': costo_envio,
                'total_productos': float(total_productos),
                'envio_gratis_desbloqueado': envio_gratis_desbloqueado,
                'total': float(total_final)
            }
            request.session.save()
            
            print(f"✅ [PREPARAR-PAGO] Datos guardados en sesión para el webhook")
            print(f"💰 [PREPARAR-PAGO] Total calculado: ${total_final}")

            # NO crear orden, NO limpiar carrito - esto se hace en el webhook
            return Response({
                'session_key': session_key,  # Para usar como external_reference
                'total': total_final,
                'total_productos': total_productos,
                'metodo_entrega': metodo_entrega,
                'costo_envio': costo_envio,
                'envio_gratis_desbloqueado': envio_gratis_desbloqueado,
                'message': 'Datos preparados para el pago'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )