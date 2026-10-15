/**
 * Interfaz pública y mínima de Users para Credits: el saldo de créditos vive en USER
 * (Modelo de Datos §5.1), pero Credits solo necesita leerlo y moverlo. Depender de esta
 * interfaz y no de todo UsersService aplica los principios de segregación de interfaces
 * e inversión de dependencias.
 */
export abstract class CreditBalanceStore {
  /** null si el usuario no existe. */
  abstract getBalance(userId: string): Promise<number | null>;
  /**
   * Suma `delta` (o resta, si es negativo) y devuelve el nuevo saldo. Participa en la
   * transacción de UnitOfWork abierta. Lanza InsufficientCreditsError si quedaría negativo.
   */
  abstract addToBalance(userId: string, delta: number): Promise<number>;
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super('Not enough credits');
    this.name = 'InsufficientCreditsError';
  }
}
