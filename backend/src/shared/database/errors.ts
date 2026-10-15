/**
 * Un dato que debía ser único ya existe (email, username, respuesta repetida…). Lo lanzan
 * los repositorios para que los servicios no dependan de los códigos de error del motor.
 */
export class UniqueConstraintError extends Error {
  constructor(message = 'Unique constraint violated') {
    super(message);
    this.name = 'UniqueConstraintError';
  }
}

/** Una restricción CHECK de la base de datos rechazó el cambio (ej. saldo negativo). */
export class CheckConstraintError extends Error {
  constructor(message = 'Check constraint violated') {
    super(message);
    this.name = 'CheckConstraintError';
  }
}
