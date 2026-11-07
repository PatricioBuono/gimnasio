package com.gimnasio.excepcion;

/** Raíz de las excepciones de negocio. No conoce HTTP: el mapeo vive en el borde. */
public abstract class ExcepcionNegocio extends RuntimeException {

  protected ExcepcionNegocio(String mensaje) {
    super(mensaje);
  }
}
