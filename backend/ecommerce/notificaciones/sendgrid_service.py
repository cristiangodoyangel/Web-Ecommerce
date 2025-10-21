"""
Servicio especializado para SendGrid - Sin necesidad de DNS
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class SendGridService:
    """Servicio para envío de correos con SendGrid"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'contacto@lifesexshop.cl')
        self.client = None
        
        if self.api_key:
            self.client = SendGridAPIClient(api_key=self.api_key)
    
    def enviar_correo(self, destinatario, asunto, template_name, contexto=None):
        """
        Envía correo usando SendGrid
        
        Args:
            destinatario: Email del destinatario
            asunto: Asunto del correo
            template_name: Nombre del template HTML
            contexto: Datos para el template
        
        Returns:
            dict: Resultado del envío
        """
        if not self.client:
            return {
                'success': False,
                'error': 'SendGrid no configurado - falta API Key'
            }
        
        try:
            # Renderizar contenido HTML
            if contexto is None:
                contexto = {}
                
            # Agregar datos globales al contexto
            contexto.update({
                'site_name': 'Life Sex Shop',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:8000'),
                'year': timezone.now().year,
            })
            
            html_content = render_to_string(f'emails/{template_name}', contexto)
            
            # Crear mensaje
            message = Mail(
                from_email=Email(self.from_email, "Life Sex Shop"),
                to_emails=To(destinatario),
                subject=asunto,
                html_content=Content("text/html", html_content)
            )
            
            # Enviar
            response = self.client.send(message)
            
            logger.info(f"Correo enviado a {destinatario}: {response.status_code}")
            
            return {
                'success': True,
                'status_code': response.status_code,
                'message_id': response.headers.get('X-Message-Id'),
                'destinatario': destinatario,
                'asunto': asunto
            }
            
        except Exception as e:
            logger.error(f"Error enviando correo a {destinatario}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'destinatario': destinatario,
                'asunto': asunto
            }
    
    def enviar_bienvenida(self, usuario):
        """Envía correo de bienvenida"""
        contexto = {
            'usuario': usuario,
            'nombre': usuario.first_name or usuario.username,
        }
        
        return self.enviar_correo(
            destinatario=usuario.email,
            asunto=f"¡Bienvenido/a a Life Sex Shop, {contexto['nombre']}! 🎉",
            template_name='bienvenida.html',
            contexto=contexto
        )
    
    def enviar_orden_confirmada(self, orden):
        """Envía correo de orden confirmada"""
        contexto = {
            'orden': orden,
            'usuario': orden.usuario,
        }
        
        return self.enviar_correo(
            destinatario=orden.usuario.email if orden.usuario else orden.email_invitado,
            asunto=f"Tu orden #{orden.id} ha sido confirmada ✅",
            template_name='orden_confirmada.html',
            contexto=contexto
        )
    
    def test_conexion(self):
        """Prueba la conexión con SendGrid"""
        if not self.client:
            return {
                'success': False,
                'error': 'Cliente SendGrid no inicializado'
            }
        
        try:
            # Prueba básica enviando a un email de testing
            test_email = getattr(settings, 'EMAIL_TESTING', 'test@example.com')
            
            result = self.enviar_correo(
                destinatario=test_email,
                asunto="🧪 Test de Conexión SendGrid - Life Sex Shop",
                template_name='base.html',
                contexto={
                    'titulo': 'Test de Conexión',
                    'mensaje': 'Si recibes este correo, SendGrid está funcionando correctamente.'
                }
            )
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Error en test de conexión: {str(e)}"
            }