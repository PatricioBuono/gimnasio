package com.gimnasio.entidad;

import java.io.Serializable;
import java.util.Objects;

public class SocioActividadId implements Serializable {

  private Integer socioId;
  private Integer actividadId;

  public SocioActividadId() {
  }

  public SocioActividadId(Integer socioId, Integer actividadId) {
    this.socioId = socioId;
    this.actividadId = actividadId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof SocioActividadId otra)) {
      return false;
    }
    return Objects.equals(socioId, otra.socioId) && Objects.equals(actividadId, otra.actividadId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(socioId, actividadId);
  }
}
