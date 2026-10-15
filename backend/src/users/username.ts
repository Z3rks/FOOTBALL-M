/** Letras sin tilde, números y guion bajo. Evita inyección de HTML/scripts en el nombre (RNF-SEC-06). */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
export const USERNAME_MESSAGE = 'username must be 3-30 characters: letters, numbers or underscore';
