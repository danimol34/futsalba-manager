# FUTSALBA - Flujo de Trabajo Permanente

Cada vez que completes una modificación solicitada por el usuario:

1. **Ejecutar verificación de TypeScript**:
   `npx tsc --noEmit`

2. **Corregir errores**:
   Si hay errores de compilación o tipos, resolverlos obligatoriamente antes de continuar.

3. **Revisar cambios**:
   Ejecutar `git diff` y `git status`.

4. **Auditoría de seguridad (CERO CREDENCIALES)**:
   Verificar exhaustivamente que NO se incluyan en el commit:
   - `.env.local` ni variantes de entorno con secretos
   - `SUPABASE_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Cadenas con prefijo `sb_secret_`
   - Contraseñas, tokens o credenciales privadas

5. **Commit y Push automático**:
   - `git add .`
   - Crear commit descriptivo en español relacionado con el cambio realizado.
   - `git push origin main`

6. **Despliegue**:
   Vercel está conectado a `main`, por lo que el push a `main` activa la publicación automática.

7. **Reporte final al usuario**:
   - Hash del commit (`git rev-parse --short HEAD`)
   - Resultado del push a `origin/main`
   - Confirmación de si `main` quedó sincronizada con `origin/main`

---

### Excepciones Importantes

#### 1. Migraciones SQL en Supabase
NO hacer push automático si el cambio requiere primero ejecutar una migración SQL en Supabase y el código depende de ella:
- Preparar el archivo / script SQL.
- Indicar al usuario exactamente cuál script SQL debe ejecutar en el SQL Editor de Supabase.
- Esperar únicamente a que el usuario confirme que Supabase respondió `Success`.
- Inmediatamente después de la confirmación, continuar automáticamente con `commit` + `push origin main` sin pedir segunda autorización.

#### 2. Operaciones Críticas o Destructivas
NO publicar automáticamente cambios que involucren:
- Rotación de claves o secretos
- Eliminación masiva de datos o tablas
- Operaciones destructivas de base de datos
- Cambios que puedan borrar usuarios, partidos, jugadores o historial

Para cambios normales (interfaz, responsive, navegación, validaciones, módulos, correcciones de bugs y lógica respaldada por el esquema existente): publicar automáticamente tras pasar las verificaciones.
