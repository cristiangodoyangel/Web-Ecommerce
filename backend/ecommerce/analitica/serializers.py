from rest_framework import serializers
from .models import Analitica

class AnaliticaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analitica
        fields = ['id', 'evento', 'valor', 'fecha']
        read_only_fields = ['fecha']
