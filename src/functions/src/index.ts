import * as admin from "firebase-admin";
import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// Função para criar uma conta de instrutor (Auth + Firestore)
export const createInstructorAccount = onCall(async (request) => {
  if (request.auth?.token.email !== "Adm@gmail.com") {
    throw new HttpsError(
      "permission-denied",
      "Apenas administradores podem criar instrutores."
    );
  }

  const { email, password, name } = request.data;
  if (!email || !password || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Email, senha e nome são obrigatórios."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Agora, cria o documento no Firestore com o UID como ID
    await admin.firestore().collection("instructors").doc(userRecord.uid).set({
      id: userRecord.uid,
      name: name,
      email: email,
    });

    return { uid: userRecord.uid };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Erro desconhecido.");
  }
});

// Função para deletar uma conta de instrutor (Auth + Firestore)
export const deleteInstructorAccount = onCall(async (request) => {
  if (request.auth?.token.email !== "Adm@gmail.com") {
    throw new HttpsError(
      "permission-denied",
      "Apenas administradores podem excluir instrutores."
    );
  }

  const { uid } = request.data;
  if (!uid) {
    throw new HttpsError("invalid-argument", "O UID do instrutor é obrigatório.");
  }

  try {
    await admin.auth().deleteUser(uid);
    // A exclusão do documento do Firestore será tratada no lado do cliente
    // para garantir consistência e feedback ao usuário.
    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Erro desconhecido.");
  }
});
