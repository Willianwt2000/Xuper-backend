import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountRaw = JSON.parse(
  readFileSync(join(__dirname, "serviceAccount.json"), "utf-8")
);

try {
  const apps = admin.apps ?? [];
  if (apps.length === 0) {
    const serviceAccountJson = serviceAccountRaw as {
      type?: string;
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    // Validar que el tipo sea service_account
    if (serviceAccountJson.type !== "service_account") {
      throw new Error(
        "Invalid serviceAccount.json: 'type' must be 'service_account'.",
      );
    }

    // Validar que project_id exista y no esté vacío
    if (!serviceAccountJson.project_id || typeof serviceAccountJson.project_id !== "string" || serviceAccountJson.project_id.trim() === "") {
      throw new Error(
        "Invalid serviceAccount.json: 'project_id' is required and must be a non-empty string.",
      );
    }

    // Validar que client_email exista, no esté vacío y tenga formato de email válido
    if (!serviceAccountJson.client_email || typeof serviceAccountJson.client_email !== "string" || serviceAccountJson.client_email.trim() === "") {
      throw new Error(
        "Invalid serviceAccount.json: 'client_email' is required and must be a non-empty string.",
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(serviceAccountJson.client_email)) {
      throw new Error(
        "Invalid serviceAccount.json: 'client_email' must be a valid email address.",
      );
    }

    // Validar que private_key exista, no esté vacío y tenga el formato correcto
    if (!serviceAccountJson.private_key || typeof serviceAccountJson.private_key !== "string" || serviceAccountJson.private_key.trim() === "") {
      throw new Error(
        "Invalid serviceAccount.json: 'private_key' is required and must be a non-empty string.",
      );
    }

    // Validar que la private_key tenga el formato PEM correcto
    const normalizedPrivateKey = serviceAccountJson.private_key.replace(/\\n/g, "\n");
    if (!normalizedPrivateKey.includes("-----BEGIN PRIVATE KEY-----") || !normalizedPrivateKey.includes("-----END PRIVATE KEY-----")) {
      throw new Error(
        "Invalid serviceAccount.json: 'private_key' must be a valid PEM-formatted private key.",
      );
    }

    const serviceAccount: ServiceAccount = {
      projectId: serviceAccountJson.project_id!,
      clientEmail: serviceAccountJson.client_email!,
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

