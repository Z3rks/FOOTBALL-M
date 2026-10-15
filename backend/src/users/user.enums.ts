/** Rol de la cuenta (RNF-SEC-03). Vocabulario compartido: lo usan Auth (guards) y Admin. */
export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
}

/** "inactive" equivale a cuenta suspendida por un administrador. */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
