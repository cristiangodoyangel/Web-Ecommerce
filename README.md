# 🛒 Sistema Ecommerce - Fullstack Solution

![Project Status](https://img.shields.io/badge/Status-Terminado-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> **Solución E-commerce robusta desarrollada para migrar operaciones al 100% digital tras el cierre de una tienda física.**

Una plataforma completa que gestiona desde el catálogo de productos hasta el procesamiento de pagos reales, garantizando la continuidad operativa del negocio mediante una arquitectura moderna y escalable.

---

## 📸 Sistema Responsivo

| Home Page |
|:---:|
| ![Home Page](./frontend/tienda/src/assets/img/banner/ecommerce.webp) |

---

## 🚀 Características Principales

Este sistema no es solo una tienda visual, cuenta con lógica de negocio compleja:

* **💳 Pasarela de Pagos Real:** Integración completa con **MercadoPago Chile** (Webhooks, preferencias y validación de estado).
* **📦 Gestión de Inventario:** Reducción automática de stock tras la confirmación del pago.
* **🔐 Autenticación Segura:** Sistema de Login/Registro con **JWT (JSON Web Tokens)**.
* **🛒 Carrito Persistente:** Gestión de estado global para carrito de compras y lista de deseos.
* **📱 Diseño Responsive:** Interfaz adaptada a móviles, tablets y escritorio (Mobile First).
* **⚡ Panel Administrativo:** Gestión de productos, categorías y monitoreo de ventas (Django Admin).

---

## 🛠️ Tech Stack

El proyecto utiliza una arquitectura desacoplada (Frontend separado del Backend):

### Backend (API REST)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST-ff1709?style=for-the-badge&logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

### Frontend (SPA)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

---

## 📂 Estructura del Proyecto

```bash
Web-Ecommerce/
├── backend/ecommerce/   # API Django, Modelos, Vistas, Serializers
├── frontend/tienda/     # Cliente React, Componentes, Context API
└── README.md            # Documentación
```

##  🔧 Instalación y Despliegue Local
Sigue estos pasos para correr el proyecto en tu máquina local.

Prerrequisitos
Node.js & npm

Python 3.8+

MySQL (o SQLite por defecto)

1. Configuración del Backend (Django)
Bash

#### Entrar a la carpeta del backend
cd backend/ecommerce

#### Crear entorno virtual (Opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

#### Instalar dependencias
pip install -r requirements.txt

#### Migraciones de base de datos
python manage.py migrate

#### Crear superusuario (para el admin)
python manage.py createsuperuser

#### Correr el servidor
python manage.py runserver
El backend correrá en http://localhost:8000

2. Configuración del Frontend (React)
Bash

#### Entrar a la carpeta del frontend (en una nueva terminal)
cd frontend/tienda

#### Instalar dependencias
npm install

#### Correr el servidor de desarrollo
npm run dev
El frontend correrá en http://localhost:5173 (o el puerto que asigne Vite)

##  🔑 Variables de Entorno
Para que el proyecto funcione correctamente (especialmente los pagos), necesitas configurar las variables de entorno.

Crea un archivo .env en la carpeta backend/ecommerce/ con la siguiente estructura:

Fragmento de código

SECRET_KEY=tu_clave_secreta_django
DEBUG=True

#### Base de datos (si usas MySQL/Postgres)
DB_NAME=nombre_db
DB_USER=usuario
DB_PASSWORD=password
DB_HOST=localhost

#### MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_prueba
MERCADOPAGO_PUBLIC_KEY=tu_public_key

## 👤 Autor

Cristian Godoy Angel Fullstack Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/cristian-godoy-angel/)




