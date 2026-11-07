package com.gimnasio.excepcion;

/** El recurso solicitado no existe. */
public class RecursoNoEncontradoException extends ExcepcionNegocio {

  public RecursoNoEncontradoException(String mensaje) {
    super(mensaje);
  }
}
