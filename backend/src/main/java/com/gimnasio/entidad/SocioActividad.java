package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "socio_actividad")
@IdClass(SocioActividadId.class)
public class SocioActividad {

  @Id
  @Column(name = "socio_id")
  private Integer socioId;

  @Id
  @Column(name = "actividad_id")
  private Integer actividadId;

  protected SocioActividad() {
  }

  public SocioActividad(Integer socioId, Integer actividadId) {
    this.socioId = socioId;
    this.actividadId = actividadId;
  }
}
