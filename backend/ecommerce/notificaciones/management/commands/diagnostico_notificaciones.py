from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from notificaciones.models import TemplateCorreo, ConfiguracionNotificacion, NotificacionCorreo
from notificaciones.services import NotificacionService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Ejecuta un diagnóstico completo del sistema de notificaciones'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-email',
            type=str,
            help='Email para enviar correo de prueba',
        )
        parser.add_argument(
            '--full-test',
            action='store_true',
            help='Ejecuta todas las pruebas incluyendo envío real de correo',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('=== DIAGNÓSTICO DEL SISTEMA DE NOTIFICACIONES ===\n')
        )
        
        # 1. Verificar configuración de correo
        self._verificar_configuracion_email()
        
        # 2. Verificar modelos y base de datos
        self._verificar_modelos()
        
        # 3. Verificar templates
        self._verificar_templates()
        
        # 4. Verificar servicios
        self._verificar_servicios()
        
        # 5. Prueba de envío real (opcional)
        if options['full_test'] and options['test_email']:
            self._prueba_envio_real(options['test_email'])
        
        self.stdout.write(
            self.style.SUCCESS('\n=== DIAGNÓSTICO COMPLETADO ===')
        )
    
    def _verificar_configuracion_email(self):
        self.stdout.write('1. 📧 Verificando configuración de email...')
        
        # Verificar settings
        configs = {
            'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', None),
            'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', None),
            'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', None),
            'EMAIL_HOST_USER': getattr(settings, 'EMAIL_HOST_USER', None),
            'EMAIL_HOST_PASSWORD': '***' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else None,
            'DEFAULT_FROM_EMAIL': getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        }
        
        for key, value in configs.items():
            status = '✓' if value else '✗'
            self.stdout.write(f'   {status} {key}: {value}')
        
        # Verificar variables de entorno
        resend_key = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        email_from = getattr(settings, 'EMAIL_FROM', None)
        
        if resend_key:
            self.stdout.write('   ✓ RESEND_API_KEY configurado')
        else:
            self.stdout.write('   ✗ RESEND_API_KEY no configurado')
        
        if email_from:
            self.stdout.write(f'   ✓ EMAIL_FROM: {email_from}')
        else:
            self.stdout.write('   ✗ EMAIL_FROM no configurado')
    
    def _verificar_modelos(self):
        self.stdout.write('\n2. 🗄️ Verificando modelos y base de datos...')
        
        # Verificar templates
        templates_count = TemplateCorreo.objects.count()
        self.stdout.write(f'   ✓ Templates de correo: {templates_count}')
        
        if templates_count == 0:
            self.stdout.write('   ⚠️ No hay templates. Ejecuta: python manage.py crear_templates')
        
        # Verificar configuraciones
        configs_count = ConfiguracionNotificacion.objects.count()
        self.stdout.write(f'   ✓ Configuraciones de usuario: {configs_count}')
        
        # Verificar notificaciones
        notifs_count = NotificacionCorreo.objects.count()
        self.stdout.write(f'   ✓ Notificaciones registradas: {notifs_count}')
        
        # Verificar usuarios
        users_count = User.objects.count()
        self.stdout.write(f'   ✓ Usuarios en el sistema: {users_count}')
    
    def _verificar_templates(self):
        self.stdout.write('\n3. 📄 Verificando templates...')
        
        templates = TemplateCorreo.objects.all()
        
        if not templates.exists():
            self.stdout.write('   ✗ No hay templates creados')
            return
        
        for template in templates:
            status = '✓' if template.activo else '✗'
            self.stdout.write(f'   {status} {template.get_tipo_display()}: {template.nombre}')
        
        # Verificar archivos de template
        import os
        template_dir = os.path.join(settings.BASE_DIR, 'notificaciones', 'templates', 'emails')
        
        if os.path.exists(template_dir):
            files = os.listdir(template_dir)
            self.stdout.write(f'   ✓ Archivos HTML encontrados: {len(files)}')
            for file in files:
                if file.endswith('.html'):
                    self.stdout.write(f'     - {file}')
        else:
            self.stdout.write('   ✗ Directorio de templates no encontrado')
    
    def _verificar_servicios(self):
        self.stdout.write('\n4. ⚙️ Verificando servicios...')
        
        try:
            service = NotificacionService()
            self.stdout.write('   ✓ NotificacionService inicializado correctamente')
            
            # Verificar métodos principales
            methods = [
                'enviar_notificacion',
                'enviar_bienvenida',
                'enviar_orden_confirmada',
                'enviar_orden_enviada',
                'enviar_pago_exitoso',
                '_puede_recibir_notificacion',
                '_obtener_template',
                '_preparar_contexto',
                '_enviar_correo'
            ]
            
            for method in methods:
                if hasattr(service, method):
                    self.stdout.write(f'   ✓ Método {method} disponible')
                else:
                    self.stdout.write(f'   ✗ Método {method} no encontrado')
                    
        except Exception as e:
            self.stdout.write(f'   ✗ Error inicializando servicio: {str(e)}')
    
    def _prueba_envio_real(self, email):
        self.stdout.write(f'\n5. 🚀 Prueba de envío real a {email}...')
        
        try:
            # Crear o obtener usuario de prueba
            usuario, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': 'Usuario',
                    'last_name': 'Prueba',
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'   ✓ Usuario de prueba creado: {email}')
            else:
                self.stdout.write(f'   ✓ Usuario de prueba encontrado: {email}')
            
            # Crear configuración si no existe
            config, created = ConfiguracionNotificacion.objects.get_or_create(
                usuario=usuario
            )
            
            # Enviar correo de bienvenida
            service = NotificacionService()
            notificacion = service.enviar_bienvenida(usuario)
            
            if notificacion:
                self.stdout.write(f'   ✓ Correo enviado! ID: {notificacion.id}')
                self.stdout.write(f'   ✓ Estado: {notificacion.get_estado_display()}')
                self.stdout.write(f'   ✓ Asunto: {notificacion.asunto}')
                
                # Verificar si se envió correctamente
                if notificacion.estado == 'enviada':
                    self.stdout.write('   ✅ ¡Correo enviado exitosamente!')
                elif notificacion.estado == 'fallida':
                    self.stdout.write(f'   ❌ Correo falló: {notificacion.mensaje_error}')
                else:
                    self.stdout.write(f'   ⏳ Correo pendiente: {notificacion.estado}')
            else:
                self.stdout.write('   ⚠️ No se envió (usuario no permite este tipo)')
                
        except Exception as e:
            self.stdout.write(f'   ❌ Error en prueba de envío: {str(e)}')
            import traceback
            self.stdout.write(f'   Detalle: {traceback.format_exc()}')
    
    def _mostrar_estadisticas(self):
        self.stdout.write('\n6. 📊 Estadísticas del sistema...')
        
        from notificaciones.models import EstadoNotificacion
        
        stats = {
            'Enviadas': NotificacionCorreo.objects.filter(estado=EstadoNotificacion.ENVIADA).count(),
            'Fallidas': NotificacionCorreo.objects.filter(estado=EstadoNotificacion.FALLIDA).count(),
            'Pendientes': NotificacionCorreo.objects.filter(estado=EstadoNotificacion.PENDIENTE).count(),
            'Programadas': NotificacionCorreo.objects.filter(estado=EstadoNotificacion.PROGRAMADA).count(),
        }
        
        for estado, count in stats.items():
            self.stdout.write(f'   📈 {estado}: {count}')
        
        # Últimas notificaciones
        ultimas = NotificacionCorreo.objects.order_by('-fecha_creacion')[:5]
        if ultimas:
            self.stdout.write('\n   📝 Últimas 5 notificaciones:')
            for notif in ultimas:
                self.stdout.write(f'     - {notif.get_tipo_display()} → {notif.email_destinatario} ({notif.get_estado_display()})')