import * as admin from "firebase-admin";
import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

try {
  admin.initializeApp();
} catch (e) {
  console.log("Admin SDK already initialized");
}

setGlobalOptions({ region: "us-central1" });

// Função para criar uma conta de instrutor (Auth + Firestore)
export const createInstructorAccount = onCall(async (request) => {
  if (request.auth?.token.email?.toLowerCase() !== "adm@gmail.com") {
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
     console.error("Error creating instructor account:", error);
    // Transforma erros comuns do Auth em erros HttpsError mais amigáveis
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este email já está em uso.');
    }
    throw new HttpsError("internal", error.message || "Erro desconhecido ao criar conta.");
  }
});

// Função para deletar uma conta de instrutor (Auth + Firestore)
export const deleteInstructorAccount = onCall(async (request) => {
  if (request.auth?.token.email?.toLowerCase() !== "adm@gmail.com") {
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
    // Exclui o usuário do Firebase Authentication
    await admin.auth().deleteUser(uid);
    
    // A exclusão de documentos relacionados (instrutor, alunos) é tratada no lado do cliente
    // para fornecer feedback imediato e garantir a consistência da interface.

    return { success: true, message: `Usuário ${uid} excluído do Auth.` };
  } catch (error: any) {
    console.error("Error deleting instructor account:", error);
    if (error.code === 'auth/user-not-found') {
      // Se o usuário não existe no Auth, ainda podemos querer continuar
      // para limpar o Firestore. Retornamos sucesso, mas com um aviso.
      return { success: true, message: `Usuário ${uid} não encontrado no Auth, pode já ter sido excluído.` };
    }
    throw new HttpsError("internal", error.message || "Erro desconhecido ao excluir conta.");
  }
});


// Função para listar todos os usuários do Firebase Authentication
export const listAllAuthUsers = onCall(async (request) => {
  // Protege a função para que apenas o administrador possa chamá-la
  if (request.auth?.token.email?.toLowerCase() !== "adm@gmail.com") {
    throw new HttpsError(
      "permission-denied",
      "Apenas administradores podem listar os usuários de autenticação."
    );
  }

  try {
    const userRecords = await admin.auth().listUsers();
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
      creationTime: user.metadata.creationTime,
    }));

    return { users };
  } catch (error: any) {
    console.error("Error listing users:", error);
    throw new HttpsError("internal", error.message || "Erro desconhecido ao listar usuários.");
  }
});