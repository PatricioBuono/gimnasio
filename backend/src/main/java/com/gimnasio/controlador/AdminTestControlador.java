package com.gimnasio.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint de verificación Fase 1: solo rol ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminTestControlador {

  @GetMapping("/test")
  public String test() {
    return "ok";
  }
}
