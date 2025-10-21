from django.urls import path
from .views import OfertasActivasListView, OfertaDetailView

app_name = 'ofertas'

urlpatterns = [
    path('', OfertasActivasListView.as_view(), name='ofertas-activas'),
    path('<int:pk>/', OfertaDetailView.as_view(), name='oferta-detail'),
]