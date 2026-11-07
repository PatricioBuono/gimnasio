---
description: Levanta backend (Spring Boot 8080) y frontend (Angular 4200) en segundo plano
---

Levanta el servidor completo del proyecto (backend + frontend) en segundo plano, sin bloquear la sesión. Sigue estos pasos en orden y detente si algo falla:

1. Verifica prerrequisitos en Windows/PowerShell:
   - Puerto 5432 (PostgreSQL) escuchando: `Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue`. Si no está, informa que hay que iniciar PostgreSQL y no continúes.
   - Puertos 8080 y 4200 libres: si alguno está ocupado, avisa qué PID lo usa y sugiere ejecutar `/bajar-server` antes de continuar.
   - `backend\mvnw.cmd` y `frontend\node_modules` existen. Si falta `node_modules`, avisa y pide aprobación antes de instalar dependencias.

2. Levanta el backend desde el directorio `backend` con el tool de shell en modo background:
   `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.jvmArguments=-Duser.timezone=America/Argentina/Mendoza"`
   (la zona horaria es obligatoria según AGENTS.md §3).

3. Levanta el frontend desde el directorio `frontend` con el tool de shell en modo background:
   `npm start`

4. Espera y verifica (sondea hasta ~120 s, con pausas de 5 s usando `Start-Sleep -Seconds 5`):
   - Backend: `Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue` y `Invoke-WebRequest -Uri http://localhost:8080 -UseBasicParsing -SkipHttpErrorCheck`.
   - Frontend: `Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue` y `Invoke-WebRequest -Uri http://localhost:4200 -UseBasicParsing -SkipHttpErrorCheck`.
   - Si un proceso termina o el puerto no abre, lee su salida/últimos logs y reporta el error real (por ejemplo, fallo de Flyway o de conexión a PostgreSQL). No lo ocultes ni lo reintentes en bucle.

5. Al finalizar, reporta en una lista breve: URL del backend, URL del frontend, PID de cada proceso y cualquier advertencia. Para bajar todo, indica que se ejecute `/bajar-server`.
