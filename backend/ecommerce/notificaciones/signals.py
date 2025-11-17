from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
import logging

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
    if created:
        try:
            from .models import ConfiguracionNotificacion
            ConfiguracionNotificacion.objects.get_or_create(usuario=instance)
            from .services import NotificacionService
            service = NotificacionService()
            service.enviar_bienvenida(instance)
            logger.info(f"Correo de bienvenida enviado a {instance.email}")
        except Exception as e:
            logger.error(f"Error enviando correo de bienvenida a {instance.email}: {str(e)}")

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_configuracion_notificaciones(sender, instance, created, **kwargs):
    if created:
        try:
            from .models import ConfiguracionNotificacion
            ConfiguracionNotificacion.objects.get_or_create(usuario=instance)
        except Exception as e:
            logger.error(f"Error creando configuración de notificaciones para {instance.email}: {str(e)}")

def orden_actualizada_handler(sender, instance, created, **kwargs):
    try:
        from .services import NotificacionService
        service = NotificacionService()
        
        if created:
            if instance.usuario:
                service.enviar_orden_confirmada(instance.usuario, instance)
            elif hasattr(instance, 'email_invitado') and instance.email_invitado:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                usuario_temp = User(email=instance.email_invitado, username=instance.email_invitado)
                service.enviar_orden_confirmada(usuario_temp, instance)
            else:
                pass
            
            logger.info(f"Correo de orden confirmada enviado para orden #{instance.id}")
            
        elif instance.estado == 'enviado':
            
            if instance.usuario:
                service.enviar_orden_enviada(instance.usuario, instance)
            else:
                pass
                
            logger.info(f"Correo de orden enviada enviado para orden #{instance.id}")
        
    except Exception as e:
        logger.error(f"Error enviando notificación de orden {instance.id}: {str(e)}")

def pago_exitoso_handler(sender, instance, created, **kwargs):
    
    if created and instance.estado == 'completado':
        
        try:
            from .services import NotificacionService
            service = NotificacionService()
            
            if hasattr(instance, 'orden'):
                
                if instance.orden.usuario:
                    service.enviar_pago_exitoso(instance.orden.usuario, instance.orden, instance)
                    logger.info(f"Correo de pago exitoso enviado para orden #{instance.orden.id}")
                elif hasattr(instance.orden, 'email_invitado') and instance.orden.email_invitado:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    usuario_temp = User(email=instance.orden.email_invitado, username=instance.orden.email_invitado)
                    service.enviar_pago_exitoso(usuario_temp, instance.orden, instance)
                else:
                    pass
            else:
                pass
                
        except Exception as e:
            logger.error(f"Error enviando notificación de pago {instance.id}: {str(e)}")
    else:
        pass

def conectar_signals():
    
    Orden, Pago = get_models()
    
    if Orden:
        post_save.connect(orden_actualizada_handler, sender=Orden)
        logger.info("Signal de órdenes conectado")
    else:
        pass
    
    if Pago:
        post_save.connect(pago_exitoso_handler, sender=Pago)
        logger.info("Signal de pagos conectado")
    else:
        pass