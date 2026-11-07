package com.gimnasio.excepcion;

/** La operación choca con el estado actual o con una restricción de unicidad. */
public class ConflictoException extends ExcepcionNegocio {

  public ConflictoException(String mensaje) {
    super(mensaje);
  }
}
