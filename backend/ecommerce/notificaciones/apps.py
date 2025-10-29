from django.apps import AppConfig

class NotificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notificaciones'
    verbose_name = 'Notificaciones por Correo'

    def ready(self):
        """Se ejecuta cuando la aplicación está lista"""
        # print(f"\n{'='*60}")
        # print(f"🚀 [NOTIFICACIONES-APP] Inicializando app de notificaciones")
        # print(f"{'='*60}")
        # print(f"📦 [NOTIFICACIONES-APP] Importando signals...")
        from . import signals
        # print(f"✅ [NOTIFICACIONES-APP] Signals importados")
        # print(f"🔌 [NOTIFICACIONES-APP] Conectando signals...")
        signals.conectar_signals()
        # print(f"✅ [NOTIFICACIONES-APP] App de notificaciones lista")
        # print(f"{'='*60}\n")
