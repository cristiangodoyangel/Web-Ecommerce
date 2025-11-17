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
        if self.action in ['crear_orden_invitado', 'preparar_pago_invitado']:
            return []  
        elif self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]  
        else:
            return [permissions.IsAuthenticated()]  

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Orden.objects.filter(usuario=self.request.user)
        return Orden.objects.none()

    @action(detail=False, methods=['get'])
    def historial(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        ordenes = self.get_queryset().order_by('-fecha')  
        serializer = self.get_serializer(ordenes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def verificar_orden_pendiente(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        orden_pendiente = Orden.objects.filter(
            usuario=request.user,
            estado='pendiente'
        ).order_by('-fecha').first()
        
        if orden_pendiente:
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
            orden = Orden.objects.get(
                id=orden_id,
                usuario=request.user,
                estado='pendiente'
            )
            
            for item in orden.productos.all():
                from productos.models import Producto
                try:
                    producto = Producto.objects.get(id=item.producto_id)
                    producto.stock += item.cantidad
                    producto.save()
                except Producto.DoesNotExist:
                    pass
            
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
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        ordenes_pendientes = Orden.objects.filter(
            usuario=request.user,
            estado='pendiente'
        )
        
        if ordenes_pendientes.exists():
            for orden_pendiente in ordenes_pendientes:
                orden_pendiente.estado = 'cancelado'
                orden_pendiente.save()

        carrito_items = list(Carrito.objects.filter(usuario=request.user).select_related('producto'))
        
        if not carrito_items:
            return Response(
                {'error': 'El carrito está vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in carrito_items:
            if item.cantidad > item.producto.stock:
                return Response(
                    {'error': f'Stock insuficiente para {item.producto.nombre}. Stock disponible: {item.producto.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            metodo_entrega = request.data.get('metodo_entrega', 'delivery')
            if metodo_entrega not in ['delivery', 'retiro']:
                metodo_entrega = 'delivery'
            
            total_productos = 0
            now = timezone.now()
            
            for item in carrito_items:
                producto = item.producto
                precio_unitario = producto.precio
                
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
                    pass  
                
                subtotal = precio_unitario * item.cantidad
                total_productos += subtotal
            
            envio_gratis_desbloqueado = total_productos >= 50000
            costo_envio = 3500 if metodo_entrega == 'delivery' else 0
            if envio_gratis_desbloqueado and metodo_entrega == 'delivery':
                costo_envio = 0
            
            orden = Orden.objects.create(
                usuario=request.user,
                metodo_entrega=metodo_entrega,
                costo_envio=costo_envio,
                estado='pendiente'
            )

            total = 0  
            
            for item in carrito_items:
                producto = item.producto
                precio_unitario = producto.precio
                
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
                    pass  
                
                subtotal = precio_unitario * item.cantidad
                total += subtotal

                OrdenProducto.objects.create(
                    orden=orden,
                    producto_id=producto.id,
                    nombre_producto=producto.nombre,
                    precio_producto=precio_unitario,  
                    cantidad=item.cantidad,
                    subtotal=subtotal
                )

            total += costo_envio

            orden.total = total
            orden.save()

            pago = Pago.objects.create(
                orden=orden,
                monto=total,
                estado='pendiente'
            )

            Carrito.objects.filter(usuario=request.user).delete()
            
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
        
        serializer = OrdenInvitadoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_key = request.session.session_key
        
        if not session_key:
            return Response(
                {'error': 'No hay sesión activa'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        carrito_items = Carrito.objects.filter(session_key=session_key)
        
        if not carrito_items.exists():
            return Response(
                {'error': 'El carrito está vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            for item in carrito_items:
                if item.cantidad > item.producto.stock:
                    return Response(
                        {'error': f'Stock insuficiente para {item.producto.nombre}. Stock disponible: {item.producto.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            metodo_entrega = serializer.validated_data.get('metodo_entrega', 'delivery')
            if metodo_entrega not in ['delivery', 'retiro']:
                metodo_entrega = 'delivery'
                
            costo_envio = 3500 if metodo_entrega == 'delivery' else 0
            
            total_productos = 0
            now = timezone.now()
            
            for item in carrito_items:
                producto = item.producto
                precio_unitario = producto.precio
                
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
                    pass  
                
                subtotal = precio_unitario * item.cantidad
                total_productos += subtotal

            envio_gratis_desbloqueado = total_productos >= 50000
            if envio_gratis_desbloqueado and metodo_entrega == 'delivery':
                costo_envio = 0
            
            total_final = total_productos + costo_envio
            
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
            
            return Response({
                'session_key': session_key,  
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