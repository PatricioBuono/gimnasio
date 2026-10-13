package com.gimnasio.repositorio;

import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.entidad.SocioActividadId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocioActividadRepositorio extends JpaRepository<SocioActividad, SocioActividadId> {
  boolean existsByActividadId(Integer actividadId);
}
