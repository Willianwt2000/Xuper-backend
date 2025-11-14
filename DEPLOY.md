# Guía de Despliegue - Xuper Backend

Esta guía explica cómo desplegar el backend de Xuper en Render u otros servicios similares.

## 🔐 Configuración de Variables de Entorno

El proyecto ahora soporta dos formas de configurar las credenciales de Firebase:

### Opción 1: Variables de Entorno (Recomendado para Producción)

Configura las siguientes variables de entorno en tu plataforma de despliegue (Render, Vercel, Railway, etc.):

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=xuper-9ad91
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@xuper-9ad91.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVgnW3NkhXwpqb\n...\n-----END PRIVATE KEY-----\n"

# MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=Cluster0

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación
SMTP_SECURE=true
EMAIL_FROM=tu-email@gmail.com

# JWT Secret
JWT_SECRET=tu_secret_jwt_muy_seguro

# Admin Registration Code (opcional)
ADMIN_REGISTRATION_CODE=tu_codigo_secreto_admin

# Puerto
PORT=5000
```

### Opción 2: Archivo JSON (Solo para Desarrollo Local)

Para desarrollo local, puedes usar el archivo `src/config/serviceAccount.json`. Este archivo **NO debe subirse al repositorio** (ya está en `.gitignore`).

## 📋 Configuración en Render

### Paso 1: Crear el Servicio

1. Ve a tu dashboard de Render
2. Crea un nuevo **Web Service**
3. Conecta tu repositorio de GitHub

### Paso 2: Configurar el Build

- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `node dist/server.js`
- **Node Version**: `22.16.0` (o la versión que uses)

### Paso 3: Agregar Variables de Entorno

En la sección **Environment** de Render, agrega todas las variables de entorno mencionadas arriba.

**Importante para `FIREBASE_PRIVATE_KEY`:**
- Debe estar entre comillas dobles
- Los saltos de línea deben ser `\n` (no saltos de línea reales)
- Ejemplo completo:
  ```
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVgnW3NkhXwpqb\n2njrpVaOexwa1qsYYEYQj+9W2d1LZ7U38Xnw3IniWTreKTfe9IS4xWuQoz4Vrz4R\n...\n-----END PRIVATE KEY-----\n"
  ```

### Paso 4: Desplegar

1. Guarda los cambios
2. Render iniciará el build automáticamente
3. Una vez completado, tu servicio estará disponible

## 🔍 Verificación

Después del despliegue, verifica que:

1. El servidor inicia correctamente (revisa los logs)
2. Firebase se inicializa: Deberías ver `✅ Firebase Admin SDK initialized.`
3. MongoDB se conecta: Deberías ver `✅ MongoDB connected successfully!!!`
4. El endpoint de healthcheck funciona: `GET https://tu-servicio.onrender.com/xuper/`

## 🐛 Solución de Problemas

### Error: "Firebase credentials not found"

**Causa**: Las variables de entorno no están configuradas correctamente.

**Solución**: 
- Verifica que todas las variables de Firebase estén configuradas en Render
- Asegúrate de que `FIREBASE_PRIVATE_KEY` tenga el formato correcto (con `\n` para saltos de línea)

### Error: "ENOENT: no such file or directory, open '.../serviceAccount.json'"

**Causa**: El código está intentando leer el archivo JSON en producción.

**Solución**: 
- Asegúrate de que las variables de entorno estén configuradas
- El código ahora prioriza las variables de entorno sobre el archivo JSON

### Error: "Invalid Firebase configuration"

**Causa**: Alguna de las credenciales tiene un formato incorrecto.

**Solución**:
- Verifica que `FIREBASE_CLIENT_EMAIL` sea un email válido
- Verifica que `FIREBASE_PRIVATE_KEY` tenga el formato PEM correcto
- Asegúrate de que `FIREBASE_PROJECT_ID` no esté vacío

## 📝 Notas Importantes

- **Nunca subas `serviceAccount.json` al repositorio** (ya está en `.gitignore`)
- **Usa variables de entorno en producción** para mayor seguridad
- **La clave privada debe tener saltos de línea como `\n`** en las variables de entorno
- **Guarda tus variables de entorno de forma segura** (usa un gestor de secretos si es posible)

## 🔗 Recursos

- [Documentación de Render](https://render.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

