from rest_framework import serializers
from .models import Usuario
from django.contrib.auth import get_user_model

class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer básico para listado (solo admin)"""
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'date_joined']

class UsuarioProfileSerializer(serializers.ModelSerializer):
    """Serializer completo para el perfil del usuario"""
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'direccion', 'telefono', 'fecha_nacimiento', 'ciudad', 
            'comuna', 'codigo_postal', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined']

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = get_user_model()
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'direccion', 'telefono', 'fecha_nacimiento', 'ciudad', 'comuna', 'codigo_postal'
        ]

    def create(self, validated_data):
        # Extraer los campos que van directamente a create_user
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Crear el usuario con los campos requeridos
        user = get_user_model().objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Actualizar con los campos adicionales
        for field, value in validated_data.items():
            setattr(user, field, value)
        user.save()
        
        return user

    def validate_email(self, value):
        if get_user_model().objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value

    def validate_username(self, value):
        if get_user_model().objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username ya está registrado.")
        return value