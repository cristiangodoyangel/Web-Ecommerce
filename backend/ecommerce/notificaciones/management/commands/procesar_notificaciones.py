from django.core.management.base import BaseCommand
from notificaciones.services import NotificacionService

class Command(BaseCommand):
    help = 'Procesa las notificaciones programadas pendientes de envío'

    def handle(self, *args, **options):
        service = NotificacionService()
        
        self.stdout.write('Iniciando procesamiento de notificaciones programadas...')
        
        try:
            service.procesar_notificaciones_programadas()
            self.stdout.write(
                self.style.SUCCESS('Notificaciones programadas procesadas exitosamente.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error procesando notificaciones: {str(e)}')
            )
            raise