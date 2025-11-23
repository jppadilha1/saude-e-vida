'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';

/**
 * Operações não-bloqueantes no Firestore.
 * Com a autenticação manual, a captura de erros de permissão
 * se torna menos automática e deve ser tratada no local da chamada, se necessário.
 */

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    console.error(`Falha em setDoc no caminho ${docRef.path}:`, error);
  });
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  return addDoc(colRef, data).catch(error => {
    console.error(`Falha em addDoc no caminho ${colRef.path}:`, error);
  });
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data).catch(error => {
    console.error(`Falha em updateDoc no caminho ${docRef.path}:`, error);
  });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch(error => {
    console.error(`Falha em deleteDoc no caminho ${docRef.path}:`, error);
  });
}
