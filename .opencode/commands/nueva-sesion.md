---
description: Crea una bitácora de sesión en docs/bitacora/ con la fecha de Mendoza
---

Crea una nueva bitácora de sesión. No modifiques ningún otro archivo.

1. Tema: usa el argumento recibido (`$ARGUMENTS`). Si está vacío, pide el tema y detente sin crear nada.
2. Fecha con zona horaria estricta (no uses la hora local del sistema). Windows PowerShell 5.1 no trae la base IANA, así que usa IANA con fallback al ID de Windows:
   ```powershell
   $tz = try { [TimeZoneInfo]::FindSystemTimeZoneById('America/Argentina/Mendoza') } catch { [TimeZoneInfo]::FindSystemTimeZoneById('Argentina Standard Time') }
   [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $tz).ToString('yyyy-MM-dd')
   ```
3. Slug del tema: minúsculas, sin acentos, espacios → `-`, solo `[a-z0-9-]`.
4. Destino: `docs/bitacora/<fecha>-<slug>.md`.
   - Si el archivo ya existe, **no lo sobrescribas**: informa la ruta y detente.
   - Si no existe, créalo copiando el contenido de `docs/bitacora/_plantilla.md` y reemplazando `YYYY-MM-DD` y el tema del título.
5. Completa solo con lo que sepas con certeza: título con fecha y tema, y «Objetivo» en una línea. Deja el resto de las secciones para el cierre.
   - Si el usuario indicó un ID de tarea (`F1-T2`, etc.), colócalo en el campo «Tarea».
6. Reporta la ruta creada y recordá que el cierre se hace con `/cerrar-sesion`.
