from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
import logging

# Importaciones tardías para evitar problemas de importación circular
def get_models():
    try:
        from ordenes.models import Orden
        from pagos.models import Pago
        return Orden, Pago
    except ImportError:
        return None, None

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def usuario_creado_handler(sender, instance, created, **kwargs):
    """Signal que se ejecuta cuando se crea un nuevo usuario"""
    if created:
        print(f"\n{'='*60}")
        print(f"🔔 [SIGNAL] Usuario creado - disparando email de bienvenida")
        print(f"{'='*60}")
        print(f"👤 Usuario: {instance.username}")
        print(f"📧 Email: {instance.email}")
        
        try:
            # Crear configuración de notificaciones por defecto
            from .models import ConfiguracionNotificacion
            print(f"⚙️ [SIGNAL] Creando configuración de notificaciones...")
            ConfiguracionNotificacion.objects.get_or_create(usuario=instance)
            print(f"✅ [SIGNAL] Configuración creada")
            
            # Enviar correo de bienvenida
            from .services import NotificacionService
            print(f"📧 [SIGNAL] Iniciando servicio de notificaciones...")
            service = NotificacionService()
            print(f"📤 [SIGNAL] Enviando correo de bienvenida...")
            service.enviar_bienvenida(instance)
            
            print(f"✅ [SIGNAL] Correo de bienvenida enviado exitosamente")
            print(f"{'='*60}\n")
            logger.info(f"Correo de bienvenida enviado a {instance.email}")
            
        except Exception as e:
            print(f"❌ [SIGNAL] ERROR enviando correo de bienvenida")
            print(f"   Error: {str(e)}")
            print(f"   Tipo: {type(e).__name__}")
            print(f"{'='*60}\n")
            logger.error(f"Error enviando correo de bienvenida a {instance.email}: {str(e)}")

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_configuracion_notificaciones(sender, instance, created, **kwargs):
    """Asegura que cada usuario tenga configuración de notificaciones"""
    if created:
        try:
            from .models import ConfiguracionNotificacion
            ConfiguracionNotificacion.objects.get_or_create(usuario=instance)
        except Exception as e:
            logger.error(f"Error creando configuración de notificaciones para {instance.email}: {str(e)}")

# Signal para órdenes
def orden_actualizada_handler(sender, instance, created, **kwargs):
    """Signal que se ejecuta cuando se actualiza una orden"""
    print(f"\n{'='*60}")
    print(f"🔔 [SIGNAL-ORDEN] Signal de orden disparado")
    print(f"{'='*60}")
    print(f"🆔 Orden ID: {instance.id}")
    print(f"📊 Estado: {instance.estado}")
    print(f"🆕 Nueva orden: {'Sí' if created else 'No'}")
    print(f"👤 Usuario: {instance.usuario.email if instance.usuario else 'Invitado'}")
    print(f"📧 Email invitado: {instance.email_invitado if hasattr(instance, 'email_invitado') else 'N/A'}")
    
    try:
        from .services import NotificacionService
        service = NotificacionService()
        
        if created:
            # Nueva orden creada - enviar confirmación
            print(f"📤 [SIGNAL-ORDEN] Enviando correo de orden confirmada...")
            
            # Determinar usuario y email
            if instance.usuario:
                print(f"   Usuario autenticado: {instance.usuario.email}")
                service.enviar_orden_confirmada(instance.usuario, instance)
            elif hasattr(instance, 'email_invitado') and instance.email_invitado:
                print(f"   Usuario invitado: {instance.email_invitado}")
                # Crear usuario temporal para invitado
                from django.contrib.auth import get_user_model
                User = get_user_model()
                usuario_temp = User(email=instance.email_invitado, username=instance.email_invitado)
                service.enviar_orden_confirmada(usuario_temp, instance)
            else:
                print(f"⚠️ [SIGNAL-ORDEN] No se puede enviar email: sin usuario ni email_invitado")
                
            print(f"✅ [SIGNAL-ORDEN] Correo de orden confirmada enviado")
            logger.info(f"Correo de orden confirmada enviado para orden #{instance.id}")
            
        elif instance.estado == 'enviado':
            # Orden enviada
            print(f"📤 [SIGNAL-ORDEN] Enviando correo de orden enviada...")
            
            if instance.usuario:
                service.enviar_orden_enviada(instance.usuario, instance)
                print(f"✅ [SIGNAL-ORDEN] Correo de orden enviada enviado")
            else:
                print(f"⚠️ [SIGNAL-ORDEN] No se puede enviar email: sin usuario")
                
            logger.info(f"Correo de orden enviada enviado para orden #{instance.id}")
        
        print(f"{'='*60}\n")
            
    except Exception as e:
        print(f"❌ [SIGNAL-ORDEN] ERROR enviando notificación")
        print(f"   Error: {str(e)}")
        print(f"   Tipo: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        print(f"{'='*60}\n")
        logger.error(f"Error enviando notificación de orden {instance.id}: {str(e)}")

# Signal para pagos
def pago_exitoso_handler(sender, instance, created, **kwargs):
    """Signal que se ejecuta cuando se confirma un pago"""
    print(f"\n{'='*60}")
    print(f"🔔 [SIGNAL-PAGO] Signal de pago disparado")
    print(f"{'='*60}")
    print(f"🆔 Pago ID: {instance.id}")
    print(f"📊 Estado: {instance.estado}")
    print(f"🆕 Nuevo pago: {'Sí' if created else 'No'}")
    print(f"💰 Monto: ${instance.monto}")
    
    if created and instance.estado == 'completado':
        print(f"✅ [SIGNAL-PAGO] Pago completado - enviando email...")
        
        try:
            from .services import NotificacionService
            service = NotificacionService()
            
            if hasattr(instance, 'orden'):
                print(f"🔗 [SIGNAL-PAGO] Orden asociada: #{instance.orden.id}")
                print(f"👤 [SIGNAL-PAGO] Usuario: {instance.orden.usuario.email if instance.orden.usuario else 'Invitado'}")
                
                if instance.orden.usuario:
                    print(f"📤 [SIGNAL-PAGO] Enviando correo de pago exitoso...")
                    service.enviar_pago_exitoso(instance.orden.usuario, instance.orden, instance)
                    print(f"✅ [SIGNAL-PAGO] Correo de pago exitoso enviado")
                    logger.info(f"Correo de pago exitoso enviado para orden #{instance.orden.id}")
                elif hasattr(instance.orden, 'email_invitado') and instance.orden.email_invitado:
                    print(f"📤 [SIGNAL-PAGO] Enviando correo a invitado: {instance.orden.email_invitado}")
                    # Crear usuario temporal
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    usuario_temp = User(email=instance.orden.email_invitado, username=instance.orden.email_invitado)
                    service.enviar_pago_exitoso(usuario_temp, instance.orden, instance)
                    print(f"✅ [SIGNAL-PAGO] Correo de pago exitoso enviado a invitado")
                else:
                    print(f"⚠️ [SIGNAL-PAGO] No se puede enviar email: sin usuario ni email_invitado")
            else:
                print(f"⚠️ [SIGNAL-PAGO] No hay orden asociada al pago")
                
            print(f"{'='*60}\n")
                
        except Exception as e:
            print(f"❌ [SIGNAL-PAGO] ERROR enviando notificación")
            print(f"   Error: {str(e)}")
            print(f"   Tipo: {type(e).__name__}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
            print(f"{'='*60}\n")
            logger.error(f"Error enviando notificación de pago {instance.id}: {str(e)}")
    else:
        print(f"ℹ️ [SIGNAL-PAGO] No se envía email (created={created}, estado={instance.estado})")
        print(f"{'='*60}\n")

def conectar_signals():
    """Conecta los signals de otras aplicaciones si están disponibles"""
    print(f"\n{'='*60}")
    print(f"🔌 [SIGNALS] Conectando signals de notificaciones")
    print(f"{'='*60}")
    
    Orden, Pago = get_models()
    
    if Orden:
        print(f"🔗 [SIGNALS] Conectando signal para modelo Orden...")
        post_save.connect(orden_actualizada_handler, sender=Orden)
        print(f"✅ [SIGNALS] Signal de órdenes conectado")
        logger.info("Signal de órdenes conectado")
    else:
        print(f"⚠️ [SIGNALS] Modelo Orden no disponible")
    
    if Pago:
        print(f"🔗 [SIGNALS] Conectando signal para modelo Pago...")
        post_save.connect(pago_exitoso_handler, sender=Pago)
        print(f"✅ [SIGNALS] Signal de pagos conectado")
        logger.info("Signal de pagos conectado")
    else:
        print(f"⚠️ [SIGNALS] Modelo Pago no disponible")
    
    print(f"{'='*60}\n")