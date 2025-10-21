"""
Autenticación personalizada sin verificación CSRF
Para permitir operaciones del carrito a usuarios anónimos
"""
from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication sin verificación CSRF
    """
    def enforce_csrf(self, request):
        return  # No hacer nada = no verificar CSRF
