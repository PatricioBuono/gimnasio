package com.gimnasio.config;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ZonaHorariaConfig {

  public static final String ZONA = "America/Argentina/Mendoza";

  @PostConstruct
  public void forzarZonaHoraria() {
    TimeZone.setDefault(TimeZone.getTimeZone(ZONA));
  }

  @Bean
  public ZoneId zonaMendoza() {
    return ZoneId.of(ZONA);
  }

  @Bean
  public Clock reloj(ZoneId zonaMendoza) {
    return Clock.system(zonaMendoza);
  }
}
