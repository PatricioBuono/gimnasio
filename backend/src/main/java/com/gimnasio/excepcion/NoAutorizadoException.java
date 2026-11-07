package com.gimnasio.excepcion;

/** La identidad presentada no es válida para operar. */
public class NoAutorizadoException extends ExcepcionNegocio {

  public NoAutorizadoException(String mensaje) {
    super(mensaje);
  }
}
