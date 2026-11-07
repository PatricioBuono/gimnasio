---
description: Baja backend (8080) y frontend (4200) del proyecto
---

Baja el servidor del proyecto (backend Spring Boot en 8080 y frontend Angular en 4200) de forma limpia. Pasos:

1. Identifica los procesos que escuchan en los puertos del proyecto:
   `Get-NetTCPConnection -LocalPort 8080,4200 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess -Unique`

2. Detén cada PID encontrado con `Stop-Process -Id <PID> -Force` (ignora PIDs ya inexistentes). No toques el puerto 5432: PostgreSQL es infraestructura y no forma parte de este comando.

3. Como respaldo, detén procesos huérfanos del propio proyecto (no uses coincidencias genéricas que puedan matar otros `java`/`node` del sistema):
   - `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'spring-boot:run' -and $_.CommandLine -match 'Proyecto Gimnasio' }`
   - `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '@angular[/\\]cli|ng serve' -and $_.CommandLine -match 'Proyecto Gimnasio' }`
   Detén esos procesos con `Stop-Process -Id $_.ProcessId -Force`.

4. Verifica que los puertos quedaron libres:
   `Get-NetTCPConnection -LocalPort 8080,4200 -State Listen -ErrorAction SilentlyContinue`
   Si alguno sigue escuchando, informa el PID restante y el error al detenerlo.

5. Reporta qué se detuvo (puerto → PID) y confirma el estado final de los puertos 8080 y 4200. Si no había nada corriendo, dilo explícitamente.
