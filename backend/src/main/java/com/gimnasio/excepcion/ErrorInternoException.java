package com.gimnasio.excepcion;

/** Configuración o estado interno inconsistente que impide completar la operación. */
public class ErrorInternoException extends ExcepcionNegocio {

  public ErrorInternoException(String mensaje) {
    super(mensaje);
  }
}
