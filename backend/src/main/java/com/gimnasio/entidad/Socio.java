package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "socio")
public class Socio {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true, length = 20)
  private String dni;

  @Column(nullable = false, length = 100)
  private String nombre;

  @Column(nullable = false, length = 100)
  private String apellido;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  protected Socio() {
  }

  public Socio(String dni, String nombre, String apellido, OffsetDateTime creadoEn) {
    this.dni = dni;
    this.nombre = nombre;
    this.apellido = apellido;
    this.creadoEn = creadoEn;
  }

  public Integer getId() {
    return id;
  }

  public String getDni() {
    return dni;
  }

  public String getNombre() {
    return nombre;
  }

  public String getApellido() {
    return apellido;
  }

  public OffsetDateTime getCreadoEn() {
    return creadoEn;
  }
}
