package com.gimnasio.controlador;

import com.gimnasio.dto.ErrorApiResponse;
import com.gimnasio.excepcion.ConflictoException;
import com.gimnasio.excepcion.ErrorInternoException;
import com.gimnasio.excepcion.ExcepcionNegocio;
import com.gimnasio.excepcion.NoAutorizadoException;
import com.gimnasio.excepcion.RecursoNoEncontradoException;
import com.gimnasio.excepcion.SolicitudInvalidaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Traduce excepciones de negocio a respuestas HTTP. Único punto que conoce los códigos. */
@RestControllerAdvice
public class ManejadorExcepciones {

  @ExceptionHandler(SolicitudInvalidaException.class)
  public ResponseEntity<ErrorApiResponse> solicitudInvalida(SolicitudInvalidaException e) {
    return responder(HttpStatus.BAD_REQUEST, e);
  }

  @ExceptionHandler(NoAutorizadoException.class)
  public ResponseEntity<ErrorApiResponse> noAutorizado(NoAutorizadoException e) {
    return responder(HttpStatus.UNAUTHORIZED, e);
  }

  @ExceptionHandler(RecursoNoEncontradoException.class)
  public ResponseEntity<ErrorApiResponse> noEncontrado(RecursoNoEncontradoException e) {
    return responder(HttpStatus.NOT_FOUND, e);
  }

  @ExceptionHandler(ConflictoException.class)
  public ResponseEntity<ErrorApiResponse> conflicto(ConflictoException e) {
    return responder(HttpStatus.CONFLICT, e);
  }

  @ExceptionHandler(ErrorInternoException.class)
  public ResponseEntity<ErrorApiResponse> errorInterno(ErrorInternoException e) {
    return responder(HttpStatus.INTERNAL_SERVER_ERROR, e);
  }

  private ResponseEntity<ErrorApiResponse> responder(HttpStatus estado, ExcepcionNegocio e) {
    return ResponseEntity.status(estado).body(new ErrorApiResponse(e.getMessage()));
  }
}
