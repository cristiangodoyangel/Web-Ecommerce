import React, { useState } from 'react';

import api from "../../api"; // Asegúrate de que la ruta al archivo 'api.js' sea correcta

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Evitamos el comportamiento predeterminado del formulario

    // Indicamos que está cargando
    setLoading(true);
    setError('');

    try {
      // Realizamos la petición de login
      const response = await api.post('login/', {
        username: username,
        password: password,
      });

      // Guardamos el token en el localStorage
      localStorage.setItem('access_token', response.data.access);

      // Redirigimos al usuario a la página principal
      window.location.href = '/'; // O puedes usar React Router para redirigir
    } catch (err) {
      // En caso de error mostramos el mensaje
      setError('Credenciales incorrectas, por favor intente nuevamente.');
          } finally {
      // Indicamos que terminó el proceso de carga
      setLoading(false);
    }
  };

  return (
    <div className="display max-w-md mx-auto bg-white p-18 mt-18 mb-18 rounded-lg shadow-md">
          <h2
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: "var(--color-life-principal)" }}
          >
              Iniciar Sesión
          </h2>
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
                  <label
                      htmlFor="username"
                      className="block text-sm font-medium"
                      style={{ color: "var(--color-life-sec)" }}
                  >
                      Usuario
                  </label>

          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-red-300 rounded-md"
            placeholder="Ingrese su nombre de usuario"
            required
          />
        </div>
        
        <div className="mb-4">
                  <label
                      htmlFor="password"
                      className="block text-sm font-medium"
                      style={{ color: "var(--color-life-sec)" }}
                  >
                      Contraseña
                  </label>

          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-red-300 rounded-md"
            placeholder="Ingrese su contraseña"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 text-white font-semibold rounded-md focus:outline-none"
                  style={{ backgroundColor: "var(--color-life-principal)" }}
              >
                  {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>

      </form>

      <p className="mt-4 text-sm text-center">
        ¿No tienes cuenta?{' '}
        <a href="/registro" className="text-red-600 hover:underline">
          Regístrate
        </a>
      </p>
    </div>
  );
}
