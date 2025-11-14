# Colección de Postman - Xuper Backend API

Esta carpeta contiene la colección completa de Postman para probar todos los endpoints del backend de Xuper.

## 📁 Archivos

- **`xuper-backend.postman_collection.json`**: Colección principal con todos los endpoints
- **`xuper-backend.postman_environment.json`**: Variables de entorno (baseUrl, authToken)
- **`README.md`**: Este archivo con las instrucciones

## 🚀 Configuración Inicial

### 1. Importar la colección en Postman

1. Abre Postman
2. Haz clic en **Import** (botón superior izquierdo)
3. Selecciona el archivo `xuper-backend.postman_collection.json`
4. Haz clic en **Import**

### 2. Importar el entorno (opcional pero recomendado)

1. En Postman, haz clic en el icono de **entornos** (⚙️) en la esquina superior derecha
2. Haz clic en **Import**
3. Selecciona el archivo `xuper-backend.postman_environment.json`
4. Selecciona el entorno "Xuper Backend - Local" en el dropdown de entornos

### 3. Verificar variables

Asegúrate de que las siguientes variables estén configuradas:
- `baseUrl`: `http://localhost:5000` (o el puerto que uses)
- `authToken`: Se llena automáticamente después del login

## 📋 Flujo de Uso Recomendado

### Para registrar un nuevo usuario:

1. **Solicitar código de verificación**
   - Endpoint: `POST /xuper/verify-email`
   - Body: `{ "email": "tu-correo@ejemplo.com" }`
   - Revisa tu correo para obtener el código de 6 dígitos

2. **Registrar usuario**
   - Endpoint: `POST /xuper/register`
   - Body: Incluye el código recibido en `verificationCode`
   - Ejemplo:
     ```json
     {
       "name": "Juan Pérez",
       "email": "tu-correo@ejemplo.com",
       "password": "ContraseñaSegura123",
       "verificationCode": "123456"
     }
     ```

3. **Iniciar sesión**
   - Endpoint: `POST /xuper/login`
   - El token JWT se guarda automáticamente en `authToken`
   - Este token se usará automáticamente en las peticiones que requieren autenticación

### Para usar endpoints de administrador:

1. Primero inicia sesión con una cuenta de administrador
2. El token se guarda automáticamente
3. Los endpoints protegidos (`/xuper/users`, `/xuper/register/admin`) usarán este token automáticamente

## 🔐 Endpoints que Requieren Autenticación

Los siguientes endpoints requieren el header `Authorization: Bearer {{authToken}}`:
- `GET /xuper/users` (solo administradores)
- `POST /xuper/register/admin` (solo administradores)

El token se obtiene al hacer login y se guarda automáticamente en la variable `authToken`.

## 📝 Notas Importantes

- **Código de verificación**: Expira después de 15 minutos
- **Token JWT**: Válido por 30 días
- **Contraseñas**: Mínimo 6 caracteres, sin espacios
- **Nombres**: Entre 2 y 50 caracteres
- **Emails**: Deben ser válidos y únicos

## 🧪 Tests Automáticos

La colección incluye tests automáticos que verifican:
- Códigos de estado HTTP correctos
- Estructura de las respuestas
- Presencia de campos requeridos
- Guardado automático del token después del login

## 🔄 Actualizar la Colección

Si se agregan nuevos endpoints al servidor, puedes:
1. Actualizar manualmente el archivo JSON
2. O exportar nuevamente desde Postman después de hacer cambios

---

**¿Problemas?** Asegúrate de que:
- El servidor esté corriendo (`pnpm dev`)
- El puerto en `baseUrl` coincida con el del servidor
- Las variables de entorno estén correctamente configuradas


