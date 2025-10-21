from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Pago
from .serializers import PagoSerializer
from ordenes.models import Orden
import mercadopago
import logging

logger = logging.getLogger(__name__)

class PagoViewSet(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Pago.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['post'], url_path='crear-preferencia', permission_classes=[])
    def crear_preferencia(self, request):
        """
        Crear preferencia de pago - Compatible con usuarios autenticados (orden_id) e invitados (session_key)
        """
        print(f"\n{'='*60}")
        print(f"💳 [MP-PREFERENCIA] Iniciando creación de preferencia MercadoPago")
        print(f"{'='*60}")
        
        try:
            # Detectar si es usuario autenticado (orden_id) o invitado (session_key)
            orden_id = request.data.get('orden_id')
            session_key = request.data.get('session_key')
            
            print(f"🔑 [MP-PREFERENCIA] Orden ID recibido: {orden_id}")
            print(f"🔑 [MP-PREFERENCIA] Session Key recibido: {session_key}")
            
            if orden_id:
                # FLUJO PARA USUARIOS AUTENTICADOS (con orden creada)
                return self._crear_preferencia_usuario_autenticado(request, orden_id)
            elif session_key:
                # FLUJO PARA USUARIOS INVITADOS (desde carrito)
                return self._crear_preferencia_invitado(request, session_key)
            else:
                print(f"❌ [MP-PREFERENCIA] No se recibió ni orden_id ni session_key")
                return Response({
                    'error': 'Se requiere orden_id (usuarios autenticados) o session_key (invitados)'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"💥 [MP-PREFERENCIA] Excepción: {str(e)}")
            logger.error(f"Error al crear preferencia: {str(e)}")
            return Response({
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _crear_preferencia_usuario_autenticado(self, request, orden_id):
        """
        Crear preferencia para usuario autenticado con orden ya creada
        """
        try:
            # Obtener la orden (tanto para usuarios autenticados como invitados)
            print(f"🔍 [MP-PREFERENCIA] Buscando orden #{orden_id}...")
            try:
                if request.user.is_authenticated:
                    orden = Orden.objects.get(id=orden_id, usuario=request.user)
                    print(f"✅ [MP-PREFERENCIA] Orden encontrada de usuario autenticado: {request.user.username}")
                else:
                    orden = Orden.objects.get(id=orden_id, usuario__isnull=True)
                    print(f"👤 [MP-PREFERENCIA] Orden encontrada de invitado")
                    
                print(f"   ID: {orden.id}")
                print(f"   Estado: {orden.estado}")
                print(f"   Total: ${orden.total}")
                
            except Orden.DoesNotExist:
                print(f"❌ [MP-PREFERENCIA] Orden no encontrada")
                return Response({
                    'error': 'Orden no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)

            # Inicializar SDK de MercadoPago
            print(f"🔧 [MP-PREFERENCIA] Inicializando SDK de MercadoPago...")
            sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
            print(f"✅ [MP-PREFERENCIA] SDK inicializado correctamente")

            # Crear los items de la preferencia desde la orden
            items = []
            print(f"\n📦 CREANDO PREFERENCIA DESDE ORDEN #{orden_id}")
            
            productos_orden = orden.productos.all()
            print(f"📊 Total de productos en orden: {productos_orden.count()}")
            
            for item in productos_orden:
                precio = float(item.precio_producto)
                print(f"\n📦 Producto: {item.nombre_producto}")
                print(f"   💵 Precio: ${precio}")
                print(f"   🔢 Cantidad: {item.cantidad}")
                print(f"   💰 Subtotal: ${precio * item.cantidad}")
                
                items.append({
                    "title": item.nombre_producto,
                    "quantity": item.cantidad,
                    "unit_price": precio,
                    "currency_id": "CLP",
                    "description": item.nombre_producto[:255]
                })
                print(f"   ✅ Item agregado a MercadoPago")

            # Agregar costo de envío si existe
            if orden.costo_envio and orden.costo_envio > 0:
                costo_envio = float(orden.costo_envio)
                metodo_display = orden.get_metodo_entrega_display()
                
                print(f"\n🚚 Método de entrega: {metodo_display}")
                print(f"   💵 Costo de envío: ${costo_envio}")
                
                items.append({
                    "title": f"Envío - {metodo_display}",
                    "quantity": 1,
                    "unit_price": costo_envio,
                    "currency_id": "CLP",
                    "description": f"Costo de envío por {metodo_display.lower()}"
                })
                print(f"   ✅ Costo de envío agregado a MercadoPago")
            else:
                print(f"\n🆓 Envío gratuito o retiro en tienda")

            # Verificar total calculado
            total_items = sum(item["unit_price"] * item["quantity"] for item in items)
            print(f"\n💰 VERIFICACIÓN DE TOTALES:")
            print(f"   💳 Total en orden: ${orden.total}")
            print(f"   🧮 Total calculado de items: ${total_items}")
            print(f"   ✅ Coinciden: {'SÍ' if abs(float(orden.total) - total_items) < 0.01 else 'NO'}")

            # Configurar información del pagador
            print(f"\n👤 [MP-PREFERENCIA] Configurando información del pagador...")
            if request.user.is_authenticated:
                payer_email = request.user.email
                payer_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
                print(f"   Email: {payer_email}")
                print(f"   Nombre: {payer_name}")
            else:
                payer_email = orden.email_invitado
                payer_name = orden.nombre_invitado
                print(f"   Email (invitado): {payer_email}")
                print(f"   Nombre (invitado): {payer_name}")

            # Configurar la preferencia
            print(f"\n📋 [MP-PREFERENCIA] Configurando preferencia...")
            preference_data = {
                "items": items,
                "payer": {
                    "email": payer_email,
                    "name": payer_name
                },
                "back_urls": {
                    "success": settings.MERCADOPAGO_SUCCESS_URL,
                    "failure": settings.MERCADOPAGO_FAILURE_URL,
                    "pending": settings.MERCADOPAGO_PENDING_URL
                },
                "external_reference": str(orden.id),
                "notification_url": settings.MERCADOPAGO_WEBHOOK_URL,
                "statement_descriptor": "LIFESEXSHOP",
                "payment_methods": {
                    "excluded_payment_types": [],
                    "excluded_payment_methods": [],
                    "installments": 12
                }
            }

            # Crear la preferencia
            preference_response = sdk.preference().create(preference_data)
            preference = preference_response["response"]

            if preference_response["status"] == 201:
                print(f"✅ [MP-PREFERENCIA] Preferencia creada exitosamente")
                print(f"   Preference ID: {preference['id']}")
                print(f"   Init Point: {preference['init_point']}")
                
                return Response({
                    'preference_id': preference['id'],
                    'init_point': preference['init_point'],
                    'sandbox_init_point': preference.get('sandbox_init_point'),
                    'orden_id': orden.id,
                    'total': float(orden.total),
                    'message': 'Preferencia creada exitosamente'
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ [MP-PREFERENCIA] Error al crear preferencia:")
                print(f"   Status: {preference_response['status']}")
                return Response({
                    'error': 'Error al crear la preferencia de pago'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"💥 [MP-PREFERENCIA-AUTH] Excepción: {str(e)}")
            return Response({
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _crear_preferencia_invitado(self, request, session_key):
        """
        Crear preferencia para usuario invitado desde carrito
        """
        try:
            # Obtener datos del carrito e invitado desde la sesión
            print(f"🔍 [MP-PREFERENCIA] Buscando carrito y datos de sesión...")
            
            # Recrear sesión para acceder a los datos
            from django.contrib.sessions.models import Session
            try:
                session_obj = Session.objects.get(session_key=session_key)
                session_data = session_obj.get_decoded()
                datos_invitado = session_data.get('datos_invitado')
                
                if not datos_invitado:
                    return Response({
                        'error': 'No se encontraron datos de invitado en la sesión'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Session.DoesNotExist:
                return Response({
                    'error': 'Sesión no encontrada'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Obtener items del carrito
            from carrito.models import Carrito
            carrito_items = Carrito.objects.filter(session_key=session_key)
            
            if not carrito_items.exists():
                return Response({
                    'error': 'El carrito está vacío'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Inicializar SDK de MercadoPago
            print(f"🔧 [MP-PREFERENCIA] Inicializando SDK de MercadoPago...")
            sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
            print(f"✅ [MP-PREFERENCIA] SDK inicializado correctamente")

            # Crear los items de la preferencia desde el carrito
            items = []
            print(f"\n{'='*60}")
            print(f"🛒 CREANDO PREFERENCIA DESDE CARRITO - Session #{session_key}")
            print(f"{'='*60}")
            
            print(f"📊 Total de productos en carrito: {carrito_items.count()}")
            
            for item in carrito_items:
                # Calcular precio actual considerando ofertas
                from django.utils import timezone
                now = timezone.now()
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
                
                precio = float(precio_unitario)
                print(f"\n📦 Producto: {producto.nombre}")
                print(f"   💵 Precio actual: ${precio}")
                print(f"   🔢 Cantidad: {item.cantidad}")
                print(f"   💰 Total línea: ${precio * item.cantidad}")
                
                items.append({
                    "title": producto.nombre,
                    "quantity": item.cantidad,
                    "unit_price": precio,
                    "currency_id": "CLP",
                    "description": producto.nombre[:255]
                })
                print(f"   ✅ Item agregado a MercadoPago")

            # Agregar costo de envío si existe
            costo_envio = datos_invitado.get('costo_envio', 0)
            if costo_envio and costo_envio > 0:
                metodo_entrega = datos_invitado.get('metodo_entrega', 'delivery')
                metodo_display = 'Delivery a Domicilio' if metodo_entrega == 'delivery' else 'Retiro en Tienda'
                
                print(f"\n🚚 Método de entrega: {metodo_display}")
                print(f"   💵 Costo de envío: ${costo_envio}")
                
                items.append({
                    "title": f"Envío - {metodo_display}",
                    "quantity": 1,
                    "unit_price": float(costo_envio),
                    "currency_id": "CLP",
                    "description": f"Costo de envío por {metodo_display.lower()}"
                })
                print(f"   ✅ Costo de envío agregado a MercadoPago")
            else:
                print(f"\n🆓 Envío gratuito o retiro en tienda - no se agrega costo")

            # Verificar total calculado
            total_items = sum(item["unit_price"] * item["quantity"] for item in items)
            total_esperado = datos_invitado.get('total', 0)
            print(f"\n💰 VERIFICACIÓN DE TOTALES:")
            print(f"   💳 Total esperado: ${total_esperado}")
            print(f"   🧮 Total calculado de items MP: ${total_items}")
            print(f"   ✅ Coinciden: {'SÍ' if abs(float(total_esperado) - total_items) < 0.01 else 'NO'}")

            # Configurar información del pagador (payer)
            print(f"\n👤 [MP-PREFERENCIA] Configurando información del pagador...")
            payer_email = datos_invitado.get('email')
            payer_name = datos_invitado.get('nombre')
            print(f"   Email (invitado): {payer_email}")
            print(f"   Nombre (invitado): {payer_name}")

            # Configurar la preferencia según la documentación oficial
            print(f"\n📋 [MP-PREFERENCIA] Configurando preferencia...")
            print(f"   Success URL: {settings.MERCADOPAGO_SUCCESS_URL}")
            print(f"   Failure URL: {settings.MERCADOPAGO_FAILURE_URL}")
            print(f"   Pending URL: {settings.MERCADOPAGO_PENDING_URL}")
            print(f"   Webhook URL: {settings.MERCADOPAGO_WEBHOOK_URL}")
            
            preference_data = {
                "items": items,
                "payer": {
                    "email": payer_email,
                    "name": payer_name
                },
                "back_urls": {
                    "success": settings.MERCADOPAGO_SUCCESS_URL,
                    "failure": settings.MERCADOPAGO_FAILURE_URL,
                    "pending": settings.MERCADOPAGO_PENDING_URL
                },
                "external_reference": session_key,  # Usar session_key en lugar de orden_id
                "notification_url": settings.MERCADOPAGO_WEBHOOK_URL,
                "statement_descriptor": "LIFESEXSHOP",
                "payment_methods": {
                    "excluded_payment_types": [],
                    "excluded_payment_methods": [],
                    "installments": 12
                }
            }

            # Crear la preferencia
            preference_response = sdk.preference().create(preference_data)
            preference = preference_response["response"]

            if preference_response["status"] == 201:
                print(f"✅ [MP-PREFERENCIA] Preferencia creada exitosamente")
                print(f"   Preference ID: {preference['id']}")
                print(f"   Init Point: {preference['init_point']}")
                
                return Response({
                    'preference_id': preference['id'],
                    'init_point': preference['init_point'],
                    'session_key': session_key,
                    'total': total_esperado,
                    'message': 'Preferencia creada exitosamente'
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ [MP-PREFERENCIA] Error al crear preferencia:")
                print(f"   Status: {preference_response['status']}")
                print(f"   Response: {preference_response}")
                return Response({
                    'error': 'Error al crear la preferencia de pago'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"💥 [MP-PREFERENCIA] Excepción: {str(e)}")
            logger.error(f"Error al crear preferencia: {str(e)}")
            return Response({
                'error': f'Error interno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='webhook', permission_classes=[])
    def webhook(self, request):
        """
        Webhook para recibir notificaciones de MercadoPago
        AQUÍ es donde se CREA LA ORDEN cuando el pago es confirmado exitoso
        """
        try:
            from ordenes.models import OrdenProducto, Orden
            from productos.models import Producto
            from carrito.models import Carrito
            from django.contrib.sessions.models import Session
            from django.utils import timezone
            
            data = request.data
            logger.info(f"Webhook recibido: {data}")

            # Obtener tipo de notificación
            topic = data.get('topic') or data.get('type')
            
            if topic == 'payment':
                # Inicializar SDK
                sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
                
                # Obtener el ID del pago
                payment_id = data.get('data', {}).get('id')
                
                if not payment_id:
                    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                
                # Consultar el estado real del pago directamente a MercadoPago
                payment_info = sdk.payment().get(payment_id)
                payment = payment_info['response']
                
                payment_status = payment.get('status')
                external_reference = payment.get('external_reference')
                
                if not external_reference:
                    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                
                # Detectar si external_reference es orden_id (numérico) o session_key (string)
                try:
                    orden_id = int(external_reference)
                    # Es una orden existente - flujo para usuarios autenticados
                    logger.info(f"💳 [WEBHOOK] Procesando pago para orden existente #{orden_id}")
                    return self._procesar_pago_orden_existente(payment_status, orden_id, payment_id, payment)
                except ValueError:
                    # Es un session_key - flujo para usuarios invitados
                    logger.info(f"💳 [WEBHOOK] Procesando pago para session_key: {external_reference}")
                    return self._procesar_pago_invitado(payment_status, external_reference, payment_id, payment)
                    logger.info(f"💳 [WEBHOOK] Pago aprobado para session_key: {external_reference}")
                    
                    # Verificar si ya existe una orden pagada para esta sesión (evitar duplicados)
                    orden_existente = Orden.objects.filter(
                        session_key=external_reference,
                        estado='pagado'
                    ).first()
                    
                    if orden_existente:
                        logger.info(f"⚠️ [WEBHOOK] Orden ya procesada: {orden_existente.id}")
                        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                    
                    # Obtener datos de la sesión
                    try:
                        session_obj = Session.objects.get(session_key=external_reference)
                        session_data = session_obj.get_decoded()
                        datos_invitado = session_data.get('datos_invitado')
                        
                        if not datos_invitado:
                            logger.error(f"❌ [WEBHOOK] No se encontraron datos de invitado en sesión")
                            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                            
                    except Session.DoesNotExist:
                        logger.error(f"❌ [WEBHOOK] Sesión no encontrada: {external_reference}")
                        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                    
                    # Obtener items del carrito
                    carrito_items = Carrito.objects.filter(session_key=external_reference)
                    
                    if not carrito_items.exists():
                        logger.error(f"❌ [WEBHOOK] Carrito vacío para sesión: {external_reference}")
                        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                    
                    # AQUÍ ES DONDE CREAMOS LA ORDEN (cuando el pago está confirmado)
                    logger.info(f"🛒 [WEBHOOK] Creando orden confirmada...")
                    
                    orden = Orden.objects.create(
                        session_key=external_reference,
                        email_invitado=datos_invitado['email'],
                        nombre_invitado=datos_invitado['nombre'],
                        telefono_invitado=datos_invitado['telefono'],
                        direccion_invitado=datos_invitado['direccion'],
                        metodo_entrega=datos_invitado['metodo_entrega'],
                        costo_envio=datos_invitado['costo_envio'],
                        total=datos_invitado['total'],
                        estado='pagado'  # Directamente como pagado
                    )
                    
                    logger.info(f"✅ [WEBHOOK] Orden creada: #{orden.id}")
                    
                    # Crear productos de la orden Y descontar stock
                    now = timezone.now()
                    for item in carrito_items:
                        # Verificar stock disponible
                        if item.cantidad > item.producto.stock:
                            logger.error(f"❌ [WEBHOOK] Stock insuficiente para {item.producto.nombre}")
                            # Continuar con otros productos aunque uno falle
                            continue
                        
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
                        
                        # Crear producto de la orden
                        OrdenProducto.objects.create(
                            orden=orden,
                            producto_id=producto.id,
                            nombre_producto=producto.nombre,
                            precio_producto=precio_unitario,
                            cantidad=item.cantidad,
                            subtotal=subtotal
                        )
                        
                        # DESCONTAR STOCK (solo cuando pago confirmado)
                        producto.stock -= item.cantidad
                        producto.save()
                        
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"💥 [WEBHOOK] Error: {str(e)}")
            return Response({
                'error': 'Error procesando webhook'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _procesar_pago_orden_existente(self, payment_status, orden_id, payment_id, payment):
        """
        Procesar pago para orden existente (usuarios autenticados)
        """
        try:
            # Obtener la orden existente
            orden = Orden.objects.get(id=orden_id)
        except Orden.DoesNotExist:
            logger.error(f"Orden no encontrada: {orden_id}")
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
        
        if payment_status == 'approved':
            # Solo procesar si la orden está pendiente (evitar duplicados)
            if orden.estado == 'pendiente':
                from ordenes.models import OrdenProducto
                from productos.models import Producto
                
                # DESCONTAR STOCK
                productos_orden = OrdenProducto.objects.filter(orden=orden)
                for item in productos_orden:
                    try:
                        producto = Producto.objects.get(id=item.producto_id)
                        producto.stock -= item.cantidad
                        producto.save()
                    except Producto.DoesNotExist:
                        logger.error(f"Producto no encontrado al descontar stock: {item.producto_id}")
                
                # Actualizar estado de la orden
                orden.estado = 'pagado'
                orden.save()
                
                # Actualizar estado del pago
                from .models import Pago
                pago = Pago.objects.filter(orden=orden).first()
                if pago:
                    pago.estado = 'completado'
                    pago.payment_id = payment_id
                    pago.payment_method = payment.get('payment_method_id')
                    pago.payment_type = payment.get('payment_type_id')
                    pago.save()

        elif payment_status in ['rejected', 'cancelled']:
            # Marcar orden como cancelada
            if orden.estado == 'pendiente':
                orden.estado = 'cancelado'
                orden.save()
                
                # Actualizar pago
                from .models import Pago
                pago = Pago.objects.filter(orden=orden).first()
                if pago:
                    pago.estado = 'rechazado'
                    pago.payment_id = payment_id
                    pago.save()

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

    def _procesar_pago_invitado(self, payment_status, session_key, payment_id, payment):
        """
        Procesar pago para usuario invitado (crear orden cuando pago exitoso)
        """
        if payment_status == 'approved':
            logger.info(f"💳 [WEBHOOK] Pago aprobado para session_key: {session_key}")
            
            # Verificar si ya existe una orden pagada para esta sesión (evitar duplicados)
            from ordenes.models import Orden
            orden_existente = Orden.objects.filter(
                session_key=session_key,
                estado='pagado'
            ).first()
            
            if orden_existente:
                logger.info(f"⚠️ [WEBHOOK] Orden ya procesada: {orden_existente.id}")
                return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
            # Obtener datos de la sesión
            from django.contrib.sessions.models import Session
            try:
                session_obj = Session.objects.get(session_key=session_key)
                session_data = session_obj.get_decoded()
                datos_invitado = session_data.get('datos_invitado')
                
                if not datos_invitado:
                    logger.error(f"❌ [WEBHOOK] No se encontraron datos de invitado en sesión")
                    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
                    
            except Session.DoesNotExist:
                logger.error(f"❌ [WEBHOOK] Sesión no encontrada: {session_key}")
                return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
            # Obtener items del carrito
            from carrito.models import Carrito
            carrito_items = Carrito.objects.filter(session_key=session_key)
            
            if not carrito_items.exists():
                logger.error(f"❌ [WEBHOOK] Carrito vacío para sesión: {session_key}")
                return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
            # AQUÍ ES DONDE CREAMOS LA ORDEN (cuando el pago está confirmado)
            logger.info(f"🛒 [WEBHOOK] Creando orden confirmada...")
            
            from ordenes.models import Orden, OrdenProducto
            orden = Orden.objects.create(
                session_key=session_key,
                email_invitado=datos_invitado['email'],
                nombre_invitado=datos_invitado['nombre'],
                telefono_invitado=datos_invitado['telefono'],
                direccion_invitado=datos_invitado['direccion'],
                metodo_entrega=datos_invitado['metodo_entrega'],
                costo_envio=datos_invitado['costo_envio'],
                total=datos_invitado['total'],
                estado='pagado'  # Directamente como pagado
            )
            
            logger.info(f"✅ [WEBHOOK] Orden creada: #{orden.id}")
            
            # Crear productos de la orden Y descontar stock
            from django.utils import timezone
            from django.db import models
            now = timezone.now()
            for item in carrito_items:
                # Verificar stock disponible
                if item.cantidad > item.producto.stock:
                    logger.error(f"❌ [WEBHOOK] Stock insuficiente para {item.producto.nombre}")
                    continue
                
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
                
                # Crear producto de la orden
                OrdenProducto.objects.create(
                    orden=orden,
                    producto_id=producto.id,
                    nombre_producto=producto.nombre,
                    precio_producto=precio_unitario,
                    cantidad=item.cantidad,
                    subtotal=subtotal
                )
                
                # DESCONTAR STOCK (solo cuando pago confirmado)
                producto.stock -= item.cantidad
                producto.save()
                
                logger.info(f"✅ [WEBHOOK] Producto procesado: {producto.nombre} (stock: {producto.stock})")
            
            # Crear registro de pago
            from .models import Pago
            pago = Pago.objects.create(
                orden=orden,
                monto=orden.total,
                estado='completado',
                payment_id=payment_id,
                payment_method=payment.get('payment_method_id'),
                payment_type=payment.get('payment_type_id')
            )
            
            # LIMPIAR CARRITO (solo cuando todo está confirmado)
            carrito_items.delete()
            logger.info(f"🧹 [WEBHOOK] Carrito limpiado")
            
            logger.info(f"🎉 [WEBHOOK] Proceso completado exitosamente - Orden #{orden.id}")
        
        elif payment_status in ['rejected', 'cancelled']:
            logger.info(f"❌ [WEBHOOK] Pago rechazado/cancelado para session: {session_key}")
            # NO crear orden, NO descontar stock, NO limpiar carrito
            # El carrito queda intacto para que el usuario pueda intentar de nuevo
        
        elif payment_status == 'pending':
            logger.info(f"⏳ [WEBHOOK] Pago pendiente para session: {session_key}")
            # No hacer nada, mantener carrito intacto
        
        else:
            logger.warning(f"❓ [WEBHOOK] Estado de pago desconocido: {payment_status}")

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
