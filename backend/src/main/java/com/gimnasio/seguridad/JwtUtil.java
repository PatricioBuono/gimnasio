package com.gimnasio.seguridad;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  private final SecretKey llave;
  private final long expiracionMs;
  private final Clock reloj;

  public JwtUtil(
      @Value("${app.jwt.secreto}") String secreto,
      @Value("${app.jwt.expiracion-ms}") long expiracionMs,
      Clock reloj) {
    this.llave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
    this.expiracionMs = expiracionMs;
    this.reloj = reloj;
  }

  public String generarToken(String username, String rol) {
    Date ahora = Date.from(reloj.instant());
    return Jwts.builder()
        .subject(username)
        .claim("rol", rol)
        .issuedAt(ahora)
        .expiration(new Date(ahora.getTime() + expiracionMs))
        .signWith(llave)
        .compact();
  }

  public String extraerUsername(String token) {
    return Jwts.parser().verifyWith(llave).build()
        .parseSignedClaims(token).getPayload().getSubject();
  }

  public boolean valido(String token) {
    try {
      Jwts.parser().verifyWith(llave).build().parseSignedClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }
}
