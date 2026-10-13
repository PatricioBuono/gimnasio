package com.gimnasio.repositorio;

import com.gimnasio.entidad.Actividad;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ActividadRepositorio extends JpaRepository<Actividad, Integer> {

  @Query("select case when count(a) > 0 then true else false end from Actividad a "
      + "where lower(trim(both from a.nombre)) = lower(trim(both from :nombre)) "
      + "and (:id is null or a.id <> :id)")
  boolean existeConNombre(String nombre, Integer id);

  Optional<Actividad> findById(Integer id);
}
