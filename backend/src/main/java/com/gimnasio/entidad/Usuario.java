package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usuario")
public class Usuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true, length = 50)
  private String username;

  @Column(name = "password_hash", nullable = false, length = 100)
  private String passwordHash;

  @Column(nullable = false, length = 20)
  private String rol;

  @Column(nullable = false)
  private boolean activo = true;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  protected Usuario() {
  }

  public Usuario(String username, String passwordHash, String rol) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.rol = rol;
  }

  public Integer getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public String getRol() {
    return rol;
  }

  public boolean isActivo() {
    return activo;
  }
}
