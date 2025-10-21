from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notificaciones.services import NotificacionService

User = get_user_model()

class Command(BaseCommand):
    help = 'Envía correos de prueba para verificar la configuración'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email destinatario para el correo de prueba',
        )
        parser.add_argument(
            '--tipo',
            type=str,
            default='bienvenida',
            help='Tipo de correo de prueba (bienvenida, orden_confirmada, etc.)',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        tipo = options.get('tipo')
        
        if not email:
            self.stdout.write(
                self.style.ERROR('Debes proporcionar un email con --email')
            )
            return
        
        # Buscar usuario o crear uno temporal
        try:
            usuario = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.WARNING(f'Usuario con email {email} no encontrado.')
            )
            return
        
        service = NotificacionService()
        
        self.stdout.write(f'Enviando correo de prueba tipo "{tipo}" a {email}...')
        
        try:
            if tipo == 'bienvenida':
                notificacion = service.enviar_bienvenida(usuario)
            else:
                self.stdout.write(
                    self.style.ERROR(f'Tipo de correo "{tipo}" no soportado')
                )
                return
            
            if notificacion:
                self.stdout.write(
                    self.style.SUCCESS(f'Correo enviado exitosamente. ID: {notificacion.id}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('El correo no se envió (posiblemente bloqueado por configuración)')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error enviando correo: {str(e)}')
            )
            raise