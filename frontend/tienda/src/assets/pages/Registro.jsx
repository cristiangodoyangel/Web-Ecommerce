import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import API_BASE_URL from '../../config';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
    ciudad: '',
    comuna: '',
    codigo_postal: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // NUEVO ESTADO

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

const validateForm = () => {
  const newErrors = {};

  if (!formData.nombre.trim()) {
    newErrors.nombre = 'El nombre es requerido';
  }
  if (!formData.apellido.trim()) {
    newErrors.apellido = 'El apellido es requerido';
  }

  if (!formData.username.trim()) {
    newErrors.username = 'El nombre de usuario es requerido';
  } else if (formData.username.length < 3) {
    newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    newErrors.username = 'El nombre de usuario solo puede contener letras, números y guión bajo';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    newErrors.email = 'El email es requerido';
  } else if (!emailRegex.test(formData.email)) {
    newErrors.email = 'El formato del email no es válido';
  }

  if (!formData.password) {
    newErrors.password = 'La contraseña es requerida';
  } else if (formData.password.length < 8) {
    newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
  }

  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Debes confirmar la contraseña';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Las contraseñas no coinciden';
  }

  const phoneRegex = /^[+]?[0-9\s-()]{8,15}$/;
  if (formData.telefono && !phoneRegex.test(formData.telefono)) {
    newErrors.telefono = 'El formato del teléfono no es válido';
  }

  if (formData.fecha_nacimiento) {
    const birthDate = new Date(formData.fecha_nacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      newErrors.fecha_nacimiento = 'Debes ser mayor de 18 años';
    }
  }

  if (!acceptTerms) {
    newErrors.terms = 'Debes aceptar los términos y condiciones';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
        
  if (!validateForm()) {
        return;
  }

    setIsLoading(true);

  try {
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.nombre,
      last_name: formData.apellido,
      telefono: formData.telefono || null,
      fecha_nacimiento: formData.fecha_nacimiento || null,
      direccion: formData.direccion || null,
      ciudad: formData.ciudad || null,
      comuna: formData.comuna || null,
      codigo_postal: formData.codigo_postal || null
    };

  const response = await fetch(`${API_BASE_URL}/usuarios/registro/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

        const data = await response.json();
        if (response.ok) {
      // MOSTRAR MENSAJE DE ÉXITO ELEGANTE
            setShowSuccess(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
            if (data.email) {
        setErrors({ email: 'Este email ya está registrado' });
      } else if (data.username) {
        setErrors({ username: 'Este nombre de usuario ya está registrado' });
      } else {
        setErrors({ submit: 'Error al crear la cuenta. Intenta nuevamente.' });
      }
    }
  } catch (error) {
        setErrors({ submit: 'Error de conexión. Verifica tu internet.' });
  } finally {
    setIsLoading(false);
      }
};

  // COMPONENTE DEL MENSAJE DE ÉXITO
  const SuccessMessage = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="mx-4 w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#8c000f' }}>
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido creada correctamente. Serás redirigido al login en unos segundos.
            </p>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#f83258' }}></div>
          </div>
          
          <p className="text-sm text-gray-500">
            Redirigiendo al login...
          </p>
          
          <Button
            onClick={() => window.location.href = '/login'}
            className="mt-4"
            style={{ backgroundColor: '#8c000f', color: '#fff' }}
          >
            Ir al Login Ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 py-12 px-4">
      {/* MOSTRAR MENSAJE DE ÉXITO */}
      {showSuccess && <SuccessMessage />}
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#8c000f' }}>
            Crear Cuenta
          </h1>
          <p className="text-gray-600">
            Únete a nuestra comunidad y descubre productos increíbles
          </p>
        </div>

        {/* Formulario */}
        <Card className="display  shadow-xl border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Nombre *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Tu nombre"
                    />
                  </div>
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Apellido *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Tu apellido"
                    />
                  </div>
                  {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                </div>
              </div>

              {/* USERNAME */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                  Nombre de Usuario *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ej: juan_rojas123"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Solo letras, números y guión bajo. Mínimo 3 caracteres.</p>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  {errors.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>}
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Calle y número"
                  />
                </div>
              </div>

              {/* Ciudad, Comuna y Código Postal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tu ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Comuna
                  </label>
                  <input
                    type="text"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tu comuna"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8c000f' }}>
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Términos y Condiciones */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                  Acepto los{' '}
                  <a href="/terminos" className="text-red-600 hover:text-red-700 underline">
                    términos y condiciones
                  </a>{' '}
                  y confirmo que soy mayor de 18 años
                </label>
              </div>
              {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

              {/* Error general */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Botón de registro */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white font-medium rounded-lg transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#8c000f' }}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              {/* Link a login */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <a 
                    href="/login" 
                    className="font-medium hover:underline"
                    style={{ color: '#f83258' }}
                  >
                    Inicia Sesión
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Registro;