import logging
from typing import Optional, Dict, Any
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import (
    NotificacionCorreo, TemplateCorreo, ConfiguracionNotificacion,
    TipoNotificacion, EstadoNotificacion
)

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificacionService:
    
    def __init__(self):
        self.from_email = settings.EMAIL_FROM
        self.site_url = settings.SITE_URL
    
    def enviar_notificacion(
        self,
        usuario,
        tipo_notificacion: str,
        datos_contexto: Optional[Dict[str, Any]] = None,
        email_destinatario: Optional[str] = None,
        programar_envio: Optional[timezone.datetime] = None
    ):

        if not email_destinatario:
            email_destinatario = usuario.email if hasattr(usuario, 'email') else None
        
        if not email_destinatario:
            return None
        
        datos_contexto = datos_contexto or {}
        
        puede_recibir = self._puede_recibir_notificacion(usuario, tipo_notificacion)
        
        if not puede_recibir:
            logger.info(f"Usuario {email_destinatario} no permite notificaciones de tipo {tipo_notificacion}")
            return None
        
        try:
            notificacion = NotificacionCorreo.objects.create(
                usuario=usuario if hasattr(usuario, 'id') else None,
                tipo=tipo_notificacion,
                email_destinatario=email_destinatario,
                asunto="",
                contenido="",
                fecha_programada=programar_envio,
                estado=EstadoNotificacion.PROGRAMADA if programar_envio else EstadoNotificacion.PENDIENTE,
                orden_id=datos_contexto.get('orden_id'),
                producto_id=datos_contexto.get('producto_id'),
                datos_adicionales=datos_contexto
            )
        except Exception as e:
            raise
        
        if not programar_envio:
            self._procesar_notificacion(notificacion, datos_contexto)
        else:
            pass
        
        return notificacion
    
    def _puede_recibir_notificacion(self, usuario, tipo_notificacion: str) -> bool:
        
        if not hasattr(usuario, 'id'):
            return True
        
        try:
            config = ConfiguracionNotificacion.objects.get(usuario=usuario)
            puede_recibir = config.puede_recibir_notificacion(tipo_notificacion)
            return puede_recibir
        except ConfiguracionNotificacion.DoesNotExist:
            ConfiguracionNotificacion.objects.create(usuario=usuario)
            return True
        except Exception as e:
            return True
    
    def _procesar_notificacion(self, notificacion: NotificacionCorreo, datos_contexto: Dict[str, Any]):
        
        try:
            template = self._obtener_template(notificacion.tipo)
            contexto = self._preparar_contexto(notificacion, datos_contexto)
            asunto = self._renderizar_asunto(template.asunto, contexto)
            contenido_html = self._renderizar_template_html(notificacion.tipo, contexto)
            contenido_texto = template.contenido_texto or ""
            
            notificacion.asunto = asunto
            notificacion.contenido = contenido_html
            notificacion.save(update_fields=['asunto', 'contenido'])
            
            self._enviar_correo(
                destinatario=notificacion.email_destinatario,
                asunto=asunto,
                contenido_html=contenido_html,
                contenido_texto=contenido_texto
            )
            
            notificacion.marcar_como_enviada()
            
            logger.info(f"Notificación {notificacion.tipo} enviada exitosamente a {notificacion.email_destinatario}")
            
        except Exception as e:
            error_msg = f"Error enviando notificación: {str(e)}"
            logger.error(error_msg)
            notificacion.marcar_como_fallida(error_msg)
            raise
    
    def _obtener_template(self, tipo_notificacion: str) -> TemplateCorreo:
        try:
            return TemplateCorreo.objects.get(tipo=tipo_notificacion, activo=True)
        except TemplateCorreo.DoesNotExist:
            return self._crear_template_por_defecto(tipo_notificacion)
    
    def _crear_template_por_defecto(self, tipo_notificacion: str) -> TemplateCorreo:
        templates_por_defecto = {
            TipoNotificacion.BIENVENIDA: {
                'nombre': 'Bienvenida',
                'asunto': '¡Bienvenido/a a Life Sex Shop!',
            },
            TipoNotificacion.ORDEN_CONFIRMADA: {
                'nombre': 'Orden Confirmada',
                'asunto': 'Tu orden #{{ orden.id }} ha sido confirmada',
            },
            TipoNotificacion.ORDEN_ENVIADA: {
                'nombre': 'Orden Enviada',
                'asunto': '¡Tu orden #{{ orden.id }} está en camino!',
            },
            TipoNotificacion.PAGO_EXITOSO: {
                'nombre': 'Pago Exitoso',
                'asunto': 'Pago confirmado - Orden #{{ orden.id }}',
            },
            TipoNotificacion.RESETEO_PASSWORD: {
                'nombre': 'Reseteo de Contraseña',
                'asunto': 'Restablecer tu contraseña - Life Sex Shop',
            },
        }
        
        template_info = templates_por_defecto.get(tipo_notificacion, {
            'nombre': f'Template {tipo_notificacion}',
            'asunto': f'Notificación de Life Sex Shop',
        })
        
        return TemplateCorreo.objects.create(
            tipo=tipo_notificacion,
            nombre=template_info['nombre'],
            asunto=template_info['asunto'],
            contenido_html='<p>Template por defecto</p>',
            activo=True
        )
    
    def _preparar_contexto(self, notificacion: NotificacionCorreo, datos_contexto: Dict[str, Any]) -> Dict[str, Any]:
        contexto = {
            'usuario': notificacion.usuario,
            'email_destinatario': notificacion.email_destinatario,
            'site_url': self.site_url,
            'unsubscribe_url': f"{self.site_url}/notificaciones/unsubscribe/{notificacion.usuario.id}/",
            'fecha_actual': timezone.now(),
        }
        
        contexto.update(datos_contexto)
        
        return contexto
    
    def _renderizar_asunto(self, template_asunto: str, contexto: Dict[str, Any]) -> str:
        from django.template import Context, Template
        template = Template(template_asunto)
        return template.render(Context(contexto))
    
    def _renderizar_template_html(self, tipo_notificacion: str, contexto: Dict[str, Any]) -> str:
        template_mapping = {
            TipoNotificacion.BIENVENIDA: 'emails/bienvenida.html',
            TipoNotificacion.ORDEN_CONFIRMADA: 'emails/orden_confirmada.html',
            TipoNotificacion.ORDEN_ENVIADA: 'emails/orden_enviada.html',
            TipoNotificacion.PAGO_EXITOSO: 'emails/pago_exitoso.html',
            TipoNotificacion.RESETEO_PASSWORD: 'emails/reseteo_password.html',
        }
        
        template_path = template_mapping.get(tipo_notificacion, 'emails/base.html')
        
        try:
            return render_to_string(template_path, contexto)
        except Exception as e:
            logger.error(f"Error renderizando template {template_path}: {str(e)}")
            return render_to_string('emails/base.html', contexto)
    
    def _enviar_correo(self, destinatario: str, asunto: str, contenido_html: str, contenido_texto: str = ""):
        
        try:
            msg = EmailMultiAlternatives(
                subject=asunto,
                body=contenido_texto or "Este correo requiere un cliente que soporte HTML.",
                from_email=self.from_email,
                to=[destinatario]
            )
            
            if contenido_html:
                msg.attach_alternative(contenido_html, "text/html")
            
            resultado = msg.send()
            
        except Exception as e:
            logger.error(f"Error enviando correo a {destinatario}: {str(e)}")
            raise
    
    def procesar_notificaciones_programadas(self):
        ahora = timezone.now()
        notificaciones_pendientes = NotificacionCorreo.objects.filter(
            estado=EstadoNotificacion.PROGRAMADA,
            fecha_programada__lte=ahora
        )
        
        for notificacion in notificaciones_pendientes:
            try:
                self._procesar_notificacion(notificacion, notificacion.datos_adicionales)
            except Exception as e:
                logger.error(f"Error procesando notificación programada {notificacion.id}: {str(e)}")
                continue
    
    def reenviar_notificacion(self, notificacion: NotificacionCorreo):
        if notificacion.intentos_envio >= 3:
            logger.warning(f"Notificación {notificacion.id} excedió límite de intentos")
            return
        
        notificacion.estado = EstadoNotificacion.PENDIENTE
        notificacion.mensaje_error = None
        notificacion.save(update_fields=['estado', 'mensaje_error'])
        
        self._procesar_notificacion(notificacion, notificacion.datos_adicionales)
    
    def enviar_bienvenida(self, usuario):
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.BIENVENIDA,
            datos_contexto={'usuario': usuario.username}
        )
    
    def enviar_orden_confirmada(self, usuario, orden):
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.ORDEN_CONFIRMADA,
            datos_contexto={
                'orden_id': orden.id,
                'orden_total': str(orden.total),
                'orden_estado': orden.estado,
            }
        )
    
    def enviar_orden_enviada(self, usuario, orden, tracking_number=None, courier=None):
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.ORDEN_ENVIADA,
            datos_contexto={
                'orden_id': orden.id,
                'orden_total': str(orden.total),
                'orden_estado': orden.estado,
                'tracking_number': tracking_number,
                'courier': courier,
                'tracking_url': f"https://tracking.example.com/{tracking_number}" if tracking_number else None,
            }
        )
    
    def enviar_pago_exitoso(self, usuario, orden, pago):
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.PAGO_EXITOSO,
            datos_contexto={
                'orden_id': orden.id,
                'orden_total': str(orden.total),
                'orden_estado': orden.estado,
                'pago_id': pago.id,
                'pago_monto': str(pago.monto),
                'pago_estado': pago.estado,
            }
        )
    
    def enviar_reseteo_password(self, usuario, reset_link: str, ip_address: str = None):
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.RESETEO_PASSWORD,
            datos_contexto={
                'reset_link': reset_link,
                'ip_address': ip_address,
                'fecha_solicitud': timezone.now(),
            }
        )