'use client';
// Este arquivo pode ser removido ou modificado, já que a lógica de erro
// de permissão do Firebase se torna menos relevante com a autenticação manual.
// Por enquanto, o deixamos para não quebrar importações, mas sua lógica
// de criar um objeto de erro detalhado não será mais acionada da mesma forma.

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * Erro customizado para permissões do Firestore.
 * Com a auth manual, a responsabilidade de relatar erros muda para a lógica da aplicação.
 */
export class FirestorePermissionError extends Error {
  constructor(context: SecurityRuleContext) {
    const message = `Erro de permissão na operação '${context.operation}' no caminho '${context.path}'. Verifique as regras de segurança do Firestore e a lógica da aplicação.`;
    super(message);
    this.name = 'FirestorePermissionError';
  }
}
