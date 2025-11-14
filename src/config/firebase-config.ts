import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para obtener las credenciales desde variables de entorno o archivo JSON
const getServiceAccountConfig = (): {
  project_id: string;
  client_email: string;
  private_key: string;
} => {
  // Prioridad 1: Variables de entorno (para producción)
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (envProjectId && envClientEmail && envPrivateKey) {
    return {
      project_id: envProjectId,
      client_email: envClientEmail,
      private_key: envPrivateKey,
    };
  }

  // Prioridad 2: Archivo JSON (para desarrollo local)
  const jsonPath = join(__dirname, "serviceAccount.json");
  if (existsSync(jsonPath)) {
    const serviceAccountRaw = JSON.parse(
      readFileSync(jsonPath, "utf-8")
    );
    return {
      project_id: serviceAccountRaw.project_id,
      client_email: serviceAccountRaw.client_email,
      private_key: serviceAccountRaw.private_key,
    };
  }

  throw new Error(
    "Firebase credentials not found. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables, or provide a serviceAccount.json file.",
  );
};

const validateServiceAccount = (
  config: { project_id: string; client_email: string; private_key: string },
): void => {
  // Validar que project_id exista y no esté vacío
  if (!config.project_id || typeof config.project_id !== "string" || config.project_id.trim() === "") {
    throw new Error(
      "Invalid Firebase configuration: 'project_id' is required and must be a non-empty string.",
    );
  }

  // Validar que client_email exista, no esté vacío y tenga formato de email válido
  if (!config.client_email || typeof config.client_email !== "string" || config.client_email.trim() === "") {
    throw new Error(
      "Invalid Firebase configuration: 'client_email' is required and must be a non-empty string.",
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.client_email)) {
    throw new Error(
      "Invalid Firebase configuration: 'client_email' must be a valid email address.",
    );
  }

  // Validar que private_key exista, no esté vacío y tenga el formato correcto
  if (!config.private_key || typeof config.private_key !== "string" || config.private_key.trim() === "") {
    throw new Error(
      "Invalid Firebase configuration: 'private_key' is required and must be a non-empty string.",
    );
  }

  // Validar que la private_key tenga el formato PEM correcto
  const normalizedPrivateKey = config.private_key.replace(/\\n/g, "\n");
  if (!normalizedPrivateKey.includes("-----BEGIN PRIVATE KEY-----") || !normalizedPrivateKey.includes("-----END PRIVATE KEY-----")) {
    throw new Error(
      "Invalid Firebase configuration: 'private_key' must be a valid PEM-formatted private key.",
    );
  }
};

try {
  const apps = admin.apps ?? [];
  if (apps.length === 0) {
    const config = getServiceAccountConfig();
    validateServiceAccount(config);

    const normalizedPrivateKey = config.private_key.replace(/\\n/g, "\n");

    const serviceAccount: ServiceAccount = {
      projectId: config.project_id,
      clientEmail: config.client_email,
      privateKey: normalizedPrivateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized.");
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
}

export { admin };

