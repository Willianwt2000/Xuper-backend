import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import serviceAccountRaw from "./serviceAccount.json" with { type: "json" };

try {
  const apps = admin.apps ?? [];
  if (apps.length === 0) {
    const serviceAccountJson = serviceAccountRaw as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    const { project_id, client_email, private_key } = serviceAccountJson;

    if (!project_id || !client_email || !private_key) {
      throw new Error(
        "Invalid serviceAccount.json: ensure project_id, client_email, and private_key are defined.",
      );
    }

    const serviceAccount: ServiceAccount = {
      projectId: project_id,
      clientEmail: client_email,
      privateKey: private_key.replace(/\\n/g, "\n"),
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

