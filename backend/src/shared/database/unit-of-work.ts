/**
 * Puerto de transacciones (Arquitectura §4). Todo lo que los repositorios hagan dentro de
 * `run` se confirma junto o se deshace junto. Los servicios dependen de esta abstracción y
 * nunca de un ORM concreto (principio de inversión de dependencias).
 */
export abstract class UnitOfWork {
  /** Si ya hay una transacción abierta, `work` se une a ella. */
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
