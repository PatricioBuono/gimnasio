package com.gimnasio.excepcion;

/** Datos de entrada inválidos o regla de validación incumplida. */
public class SolicitudInvalidaException extends ExcepcionNegocio {

  public SolicitudInvalidaException(String mensaje) {
    super(mensaje);
  }
}
