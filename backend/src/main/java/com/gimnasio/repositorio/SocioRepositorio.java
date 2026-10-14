package com.gimnasio.repositorio;

import com.gimnasio.entidad.Socio;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SocioRepositorio extends JpaRepository<Socio, Integer> {
  boolean existsByDni(String dni);

  Optional<Socio> findByDni(String dni);

  @Query(value = "SELECT * FROM socio "
      + "WHERE similarity(nombre, :q) > 0.2 OR similarity(apellido, :q) > 0.2 "
      + "OR nombre ILIKE CONCAT('%', :q, '%') OR apellido ILIKE CONCAT('%', :q, '%') "
      + "ORDER BY GREATEST(similarity(nombre, :q), similarity(apellido, :q)) DESC LIMIT 20",
      nativeQuery = true)
  List<Socio> buscarPorTexto(String q);
}
