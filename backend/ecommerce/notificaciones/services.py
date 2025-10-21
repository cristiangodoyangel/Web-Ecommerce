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
    """Servicio principal para el envío de notificaciones por correo"""
    
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
        """
        Envía una notificación por correo electrónico
        
        Args:
            usuario: Usuario destinatario
            tipo_notificacion: Tipo de notificación (debe estar en TipoNotificacion)
            datos_contexto: Datos adicionales para el template
            email_destinatario: Email específico (usa usuario.email si no se proporciona)
            programar_envio: Fecha para programar el envío
            
        Returns:
            NotificacionCorreo: Instancia de la notificación creada
        """
        print(f"\n{'='*60}")
        print(f"📧 [NOTIF-SERVICE] Enviar notificación solicitada")
        print(f"{'='*60}")
        print(f"📋 Tipo: {tipo_notificacion}")
        print(f"👤 Usuario: {usuario.email if hasattr(usuario, 'email') else 'Sin email'}")
        print(f"📮 Email destinatario: {email_destinatario}")
        print(f"📦 Contexto: {datos_contexto}")
        print(f"⏰ Programada: {programar_envio}")
        
        if not email_destinatario:
            email_destinatario = usuario.email if hasattr(usuario, 'email') else None
            print(f"📧 [NOTIF-SERVICE] Email destinatario tomado del usuario: {email_destinatario}")
        
        if not email_destinatario:
            print(f"❌ [NOTIF-SERVICE] ERROR: No hay email destinatario")
            print(f"{'='*60}\n")
            return None
        
        datos_contexto = datos_contexto or {}
        
        # Verificar si el usuario puede recibir este tipo de notificación
        print(f"🔍 [NOTIF-SERVICE] Verificando permisos de notificación...")
        puede_recibir = self._puede_recibir_notificacion(usuario, tipo_notificacion)
        print(f"{'✅' if puede_recibir else '❌'} [NOTIF-SERVICE] Puede recibir: {puede_recibir}")
        
        if not puede_recibir:
            logger.info(f"Usuario {email_destinatario} no permite notificaciones de tipo {tipo_notificacion}")
            print(f"⚠️ [NOTIF-SERVICE] Usuario no permite este tipo de notificaciones")
            print(f"{'='*60}\n")
            return None
        
        # Crear el registro de notificación
        print(f"💾 [NOTIF-SERVICE] Creando registro de notificación en BD...")
        try:
            notificacion = NotificacionCorreo.objects.create(
                usuario=usuario if hasattr(usuario, 'id') else None,
                tipo=tipo_notificacion,
                email_destinatario=email_destinatario,
                asunto="",  # Se llenará después
                contenido="",  # Se llenará después
                fecha_programada=programar_envio,
                estado=EstadoNotificacion.PROGRAMADA if programar_envio else EstadoNotificacion.PENDIENTE,
                orden_id=datos_contexto.get('orden_id'),
                producto_id=datos_contexto.get('producto_id'),
                datos_adicionales=datos_contexto
            )
            print(f"✅ [NOTIF-SERVICE] Notificación creada con ID: {notificacion.id}")
        except Exception as e:
            print(f"❌ [NOTIF-SERVICE] ERROR creando notificación en BD")
            print(f"   Error: {str(e)}")
            print(f"   Tipo: {type(e).__name__}")
            print(f"{'='*60}\n")
            raise
        
        # Si no está programado, enviar inmediatamente
        if not programar_envio:
            print(f"📤 [NOTIF-SERVICE] Enviando inmediatamente...")
            self._procesar_notificacion(notificacion, datos_contexto)
        else:
            print(f"⏰ [NOTIF-SERVICE] Notificación programada para: {programar_envio}")
        
        print(f"{'='*60}\n")
        return notificacion
    
    def _puede_recibir_notificacion(self, usuario, tipo_notificacion: str) -> bool:
        """Verifica si el usuario puede recibir el tipo de notificación"""
        print(f"   🔍 [PERMISOS] Verificando permisos para tipo: {tipo_notificacion}")
        print(f"   👤 [PERMISOS] Usuario: {usuario.email if hasattr(usuario, 'email') else 'Sin email'}")
        
        if not hasattr(usuario, 'id'):
            print(f"   ⚠️ [PERMISOS] Usuario sin ID, asumiendo puede recibir (guest)")
            return True
        
        try:
            config = ConfiguracionNotificacion.objects.get(usuario=usuario)
            puede_recibir = config.puede_recibir_notificacion(tipo_notificacion)
            print(f"   ✅ [PERMISOS] Config encontrada - Puede recibir: {puede_recibir}")
            return puede_recibir
        except ConfiguracionNotificacion.DoesNotExist:
            # Si no tiene configuración, crear una por defecto
            print(f"   ⚠️ [PERMISOS] No existe config, creando por defecto...")
            ConfiguracionNotificacion.objects.create(usuario=usuario)
            print(f"   ✅ [PERMISOS] Config creada, permitiendo notificación")
            return True  # Por defecto permitir notificaciones importantes
        except Exception as e:
            print(f"   ❌ [PERMISOS] ERROR verificando permisos: {str(e)}")
            return True  # En caso de error, permitir el envío
    
    def _procesar_notificacion(self, notificacion: NotificacionCorreo, datos_contexto: Dict[str, Any]):
        """Procesa y envía la notificación"""
        print(f"\n{'='*60}")
        print(f"📧 [EMAIL-SERVICE] Procesando notificación")
        print(f"{'='*60}")
        print(f"🆔 ID Notificación: {notificacion.id}")
        print(f"📋 Tipo: {notificacion.tipo}")
        print(f"👤 Usuario: {notificacion.usuario.email if notificacion.usuario else 'Sin usuario'}")
        print(f"📮 Destinatario: {notificacion.email_destinatario}")
        print(f"📦 Contexto: {datos_contexto}")
        
        try:
            # Obtener o crear template
            print(f"📄 [EMAIL-SERVICE] Obteniendo template para tipo: {notificacion.tipo}")
            template = self._obtener_template(notificacion.tipo)
            print(f"✅ [EMAIL-SERVICE] Template obtenido: {template.nombre}")
            
            # Preparar contexto
            print(f"🔧 [EMAIL-SERVICE] Preparando contexto...")
            contexto = self._preparar_contexto(notificacion, datos_contexto)
            print(f"✅ [EMAIL-SERVICE] Contexto preparado con {len(contexto)} variables")
            
            # Renderizar contenido
            print(f"🎨 [EMAIL-SERVICE] Renderizando contenido...")
            asunto = self._renderizar_asunto(template.asunto, contexto)
            print(f"✅ [EMAIL-SERVICE] Asunto: {asunto}")
            
            contenido_html = self._renderizar_template_html(notificacion.tipo, contexto)
            print(f"✅ [EMAIL-SERVICE] HTML renderizado ({len(contenido_html)} caracteres)")
            
            contenido_texto = template.contenido_texto or ""
            
            # Actualizar notificación con contenido
            print(f"💾 [EMAIL-SERVICE] Guardando contenido en BD...")
            notificacion.asunto = asunto
            notificacion.contenido = contenido_html
            notificacion.save(update_fields=['asunto', 'contenido'])
            print(f"✅ [EMAIL-SERVICE] Contenido guardado")
            
            # Enviar correo
            print(f"📤 [EMAIL-SERVICE] Enviando correo...")
            print(f"   Destinatario: {notificacion.email_destinatario}")
            print(f"   Asunto: {asunto}")
            self._enviar_correo(
                destinatario=notificacion.email_destinatario,
                asunto=asunto,
                contenido_html=contenido_html,
                contenido_texto=contenido_texto
            )
            print(f"✅ [EMAIL-SERVICE] Correo enviado exitosamente")
            
            # Marcar como enviada
            notificacion.marcar_como_enviada()
            print(f"✅ [EMAIL-SERVICE] Notificación marcada como enviada")
            print(f"{'='*60}\n")
            
            logger.info(f"Notificación {notificacion.tipo} enviada exitosamente a {notificacion.email_destinatario}")
            
        except Exception as e:
            error_msg = f"Error enviando notificación: {str(e)}"
            print(f"❌ [EMAIL-SERVICE] ERROR: {error_msg}")
            print(f"❌ [EMAIL-SERVICE] Tipo error: {type(e).__name__}")
            print(f"{'='*60}\n")
            logger.error(error_msg)
            notificacion.marcar_como_fallida(error_msg)
            raise
    
    def _obtener_template(self, tipo_notificacion: str) -> TemplateCorreo:
        """Obtiene o crea el template para el tipo de notificación"""
        try:
            return TemplateCorreo.objects.get(tipo=tipo_notificacion, activo=True)
        except TemplateCorreo.DoesNotExist:
            # Crear template por defecto
            return self._crear_template_por_defecto(tipo_notificacion)
    
    def _crear_template_por_defecto(self, tipo_notificacion: str) -> TemplateCorreo:
        """Crea un template por defecto para el tipo de notificación"""
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
        """Prepara el contexto para renderizar el template"""
        contexto = {
            'usuario': notificacion.usuario,
            'email_destinatario': notificacion.email_destinatario,
            'site_url': self.site_url,
            'unsubscribe_url': f"{self.site_url}/notificaciones/unsubscribe/{notificacion.usuario.id}/",
            'fecha_actual': timezone.now(),
        }
        
        # Agregar datos específicos del contexto
        contexto.update(datos_contexto)
        
        return contexto
    
    def _renderizar_asunto(self, template_asunto: str, contexto: Dict[str, Any]) -> str:
        """Renderiza el asunto del correo"""
        from django.template import Context, Template
        template = Template(template_asunto)
        return template.render(Context(contexto))
    
    def _renderizar_template_html(self, tipo_notificacion: str, contexto: Dict[str, Any]) -> str:
        """Renderiza el template HTML del correo"""
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
            # Fallback a template básico
            return render_to_string('emails/base.html', contexto)
    
    def _enviar_correo(self, destinatario: str, asunto: str, contenido_html: str, contenido_texto: str = ""):
        """Envía el correo electrónico"""
        print(f"\n📨 [EMAIL-SEND] Preparando envío de correo")
        print(f"   From: {self.from_email}")
        print(f"   To: {destinatario}")
        print(f"   Subject: {asunto}")
        print(f"   HTML length: {len(contenido_html)} caracteres")
        print(f"   Text length: {len(contenido_texto)} caracteres")
        
        # Verificar configuración de email
        print(f"\n⚙️ [EMAIL-CONFIG] Verificando configuración...")
        print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"   EMAIL_HOST_PASSWORD: {'✅ Configurado' if settings.EMAIL_HOST_PASSWORD else '❌ NO configurado'}")
        print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        try:
            print(f"\n🔨 [EMAIL-SEND] Creando mensaje...")
            msg = EmailMultiAlternatives(
                subject=asunto,
                body=contenido_texto or "Este correo requiere un cliente que soporte HTML.",
                from_email=self.from_email,
                to=[destinatario]
            )
            print(f"✅ [EMAIL-SEND] Mensaje creado")
            
            if contenido_html:
                print(f"📎 [EMAIL-SEND] Adjuntando versión HTML...")
                msg.attach_alternative(contenido_html, "text/html")
                print(f"✅ [EMAIL-SEND] HTML adjuntado")
            
            print(f"📤 [EMAIL-SEND] Enviando mensaje al servidor SMTP...")
            resultado = msg.send()
            print(f"✅ [EMAIL-SEND] ¡Mensaje enviado exitosamente!")
            print(f"   Resultado: {resultado}")
            
        except Exception as e:
            print(f"❌ [EMAIL-SEND] ERROR al enviar correo")
            print(f"   Error: {str(e)}")
            print(f"   Tipo: {type(e).__name__}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
            logger.error(f"Error enviando correo a {destinatario}: {str(e)}")
            raise
    
    def procesar_notificaciones_programadas(self):
        """Procesa las notificaciones programadas que deben enviarse"""
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
        """Reenvía una notificación fallida"""
        if notificacion.intentos_envio >= 3:
            logger.warning(f"Notificación {notificacion.id} excedió límite de intentos")
            return
        
        notificacion.estado = EstadoNotificacion.PENDIENTE
        notificacion.mensaje_error = None
        notificacion.save(update_fields=['estado', 'mensaje_error'])
        
        self._procesar_notificacion(notificacion, notificacion.datos_adicionales)
    
    # Métodos de conveniencia para tipos específicos de notificaciones
    
    def enviar_bienvenida(self, usuario):
        """Envía correo de bienvenida a un nuevo usuario"""
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.BIENVENIDA,
            datos_contexto={'usuario': usuario.username}
        )
    
    def enviar_orden_confirmada(self, usuario, orden):
        """Envía confirmación de orden"""
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
        """Envía notificación de orden enviada"""
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
        """Envía confirmación de pago exitoso"""
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
        """Envía correo para resetear contraseña"""
        return self.enviar_notificacion(
            usuario=usuario,
            tipo_notificacion=TipoNotificacion.RESETEO_PASSWORD,
            datos_contexto={
                'reset_link': reset_link,
                'ip_address': ip_address,
                'fecha_solicitud': timezone.now(),
            }
        )