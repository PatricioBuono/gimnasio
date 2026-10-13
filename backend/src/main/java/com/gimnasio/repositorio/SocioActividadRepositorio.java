package com.gimnasio.repositorio;

import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.entidad.SocioActividadId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocioActividadRepositorio extends JpaRepository<SocioActividad, SocioActividadId> {
  boolean existsByActividadId(Integer actividadId);

  List<SocioActividad> findBySocioId(Integer socioId);

  void deleteBySocioId(Integer socioId);
}
