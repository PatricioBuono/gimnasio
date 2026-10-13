package com.gimnasio.seguridad;

import com.gimnasio.entidad.Usuario;
import com.gimnasio.repositorio.UsuarioRepositorio;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioDetailsService implements UserDetailsService {

  private final UsuarioRepositorio repositorio;

  public UsuarioDetailsService(UsuarioRepositorio repositorio) {
    this.repositorio = repositorio;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Usuario usuario = repositorio.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    if (!usuario.isActivo()) {
      throw new UsernameNotFoundException("Usuario inactivo");
    }
    return new User(usuario.getUsername(), usuario.getPasswordHash(),
        List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol())));
  }
}
