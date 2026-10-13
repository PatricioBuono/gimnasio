package com.gimnasio.seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {

  private final JwtUtil jwtUtil;
  private final UsuarioDetailsService usuarios;

  public JwtFilter(JwtUtil jwtUtil, UsuarioDetailsService usuarios) {
    this.jwtUtil = jwtUtil;
    this.usuarios = usuarios;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String cabecera = request.getHeader("Authorization");
    if (cabecera != null && cabecera.startsWith("Bearer ")) {
      String token = cabecera.substring(7);
      if (jwtUtil.valido(token)) {
        try {
          String username = jwtUtil.extraerUsername(token);
          UserDetails detalles = usuarios.loadUserByUsername(username);
          var auth = new UsernamePasswordAuthenticationToken(detalles, null, detalles.getAuthorities());
          SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (UsernameNotFoundException e) {
          SecurityContextHolder.clearContext();
        }
      }
    }
    chain.doFilter(request, response);
  }
}
