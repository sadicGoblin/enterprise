# API de Accidentes - Documentación Completa

## Endpoint

```
POST /ws/AccidentesSvcImpl.php
Content-Type: application/json
```

Todos los casos se envían como JSON con el campo `caso` que determina la operación.

---

## 1. `Crea` — Crear Accidente

Crea un accidente completo con todas sus tablas relacionadas.

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdObra` | int | FK a `TB_ObrasAccidentes` |
| `IdTrabajador` | int | FK a `TB_Trabajadores` |

### Campos Opcionales

#### Accidente Principal (`TB_Accidentes`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdEmpresa` | int | FK a `TB_Empresas`. Si es null, se asigna "SIN ESPECIFICAR" (solo vía importador CSV) |
| `FechaAccidente` | string | Formato `YYYY-MM-DD` |
| `HoraAccidente` | string | Formato `HH:MM` |
| `IdTipoAccidente` | int | FK a `TB_TiposAccidente` |
| `Descripcion` | string | Texto libre (se normaliza a MAYÚSCULAS) |
| `NumEnfermedadProfesional` | string | Número de enfermedad profesional |
| `DiasPerdidosEstimados` | int | Días perdidos estimados |
| `FechaControl` | string | Formato `YYYY-MM-DD` |
| `FechaAlta` | string | Formato `YYYY-MM-DD` (opcional) |
| `created_by` | int | ID del usuario creador |

#### Datos del Trabajador (`TB_AccidentesTrabajadorData`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdCargo` | int | FK a `TB_Cargos` |
| `HorarioTrabajo` | string | Horario del trabajador (se normaliza a MAYÚSCULAS) |
| `DiaSemana` | string | Día de la semana (se normaliza a MAYÚSCULAS). **Nota**: En la vista se calcula automáticamente desde `FechaAccidente` |

#### Línea de Mando (`TB_AccidentesLineaMando`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdSupervisor` | int | FK a `TB_Trabajadores` |
| `IdPTerreno` | int | FK a `TB_Trabajadores` |
| `IdAPR` | int | FK a `TB_Trabajadores` |
| `IdADO` | int | FK a `TB_Trabajadores` |

#### Análisis (`TB_AccidentesAnalisis`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdRiesgoAsociado` | int | FK a `TB_RiesgosAsociados` |
| `IdLesion` | int | FK a `TB_Lesiones` |
| `IdParteCuerpo` | int | FK a `TB_PartesCuerpo` |
| `CalificacionPS` | string | Valores: `Leve`, `Menor`, `Importante`, `Grave`, `Fatal` (Title Case, **no se normaliza a mayúsculas**) |
| `FuenteAgente` | string | Texto libre (se normaliza a MAYÚSCULAS) |
| `Accion` | string | Texto libre (se normaliza a MAYÚSCULAS) |
| `Condicion` | string | Texto libre (se normaliza a MAYÚSCULAS) |
| `IdMaquinaEquipo` | int | FK a `TB_MaquinasEquipos` |

#### Gestión del Cambio (`TB_AccidentesGestionCambio`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdCausaRaiz` | int | FK a `TB_CausasRaiz` |
| `CtrlE` | bool | Control: Eliminación |
| `CtrlS` | bool | Control: Sustitución |
| `CtrlI` | bool | Control: Ingeniería |
| `CtrlA` | bool | Control: Administrativo |
| `CtrlEPP` | bool | Control: EPP |
| `Observaciones` | string | Texto libre (se normaliza a MAYÚSCULAS) |

### Ejemplo

```json
{
  "caso": "Crea",
  "IdObra": 1,
  "IdTrabajador": 5,
  "IdEmpresa": 2,
  "FechaAccidente": "2025-03-10",
  "HoraAccidente": "09:30",
  "IdTipoAccidente": 1,
  "Descripcion": "Caída desde andamio",
  "IdCargo": 3,
  "IdRiesgoAsociado": 1,
  "IdLesion": 2,
  "IdParteCuerpo": 5,
  "CalificacionPS": "Grave",
  "FuenteAgente": "Andamio",
  "IdSupervisor": 10,
  "CtrlE": false,
  "CtrlS": false,
  "CtrlI": true,
  "CtrlA": true,
  "CtrlEPP": true,
  "created_by": 1
}
```

### Respuesta

```json
{
  "success": true,
  "code": 200,
  "message": "Accidente creado correctamente",
  "data": {
    "IdAccidente": 69,
    "NumeroAccidente": "MPV-20250310-001",
    "success": true
  }
}
```

### Comportamiento Automático

- `NumeroAccidente` se genera automáticamente: `{CODIGO_OBRA}-{YYYYMMDD}-{NNN}`
- `EdadAlAccidente` se calcula automáticamente desde `TB_Trabajadores.FechaNacimiento`
- `Estado` se establece como `"Reportado"`
- Textos (`Descripcion`, `FuenteAgente`, `Accion`, `Condicion`, `Observaciones`) se normalizan a MAYÚSCULAS
- `CalificacionPS` y `Estado` NO se normalizan (son Title Case)

---

## 2. `Actualiza` — Actualizar Accidente

Actualiza un accidente existente. Solo se actualizan los campos que se envían (no nulos).

### Campos Requeridos

| Campo | Tipo |
|-------|------|
| `IdAccidente` | int |

### Campos Opcionales

Todos los mismos campos que `Crea`, más:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `DiasPerdidosFinal` | int | Días perdidos final (no disponible en Crea) |
| `Estado` | string | `Reportado`, `En_Investigacion`, `Cerrado`, `Anulado` |

### Ejemplo

```json
{
  "caso": "Actualiza",
  "IdAccidente": 1,
  "DiasPerdidosFinal": 15,
  "Estado": "Cerrado",
  "CalificacionPS": "Grave"
}
```

### Respuesta

```json
{
  "success": true,
  "code": 200,
  "message": "Accidente actualizado correctamente",
  "data": { "IdAccidente": 1, "success": true }
}
```

---

## 3. `Consulta` — Obtener Accidente por ID

Retorna un accidente completo con todos sus datos relacionados usando `vista_accidentes_completa`.

### Campos Requeridos

| Campo | Tipo |
|-------|------|
| `IdAccidente` | int |

### Ejemplo

```json
{ "caso": "Consulta", "IdAccidente": 1 }
```

### Respuesta (campos de la vista)

```json
{
  "success": true,
  "data": {
    "IdAccidente": "1",
    "NumeroAccidente": "MPV-20250101-001",
    "IdObra": "1",
    "IdEmpresa": "1",
    "IdTrabajador": "5",
    "IdTipoAccidente": "1",
    "DiasPerdidosEstimados": "17",
    "DiasPerdidosFinal": "17",
    "NumEnfermedadProfesional": null,
    "NombreObra": "MPV LIFESTYLE",
    "CodigoObra": null,
    "EstadoObra": "Activa",
    "DescripcionObra": null,
    "NombreEmpresa": "INARCO",
    "FechaAccidente": "2025-01-01",
    "HoraAccidente": null,
    "FechaControl": "2025-01-17",
    "FechaAlta": null,
    "Descripcion": "TRAZADOR AL TRANSITAR OBRA...",
    "DiaSemana": "Miércoles",
    "NombreTrabajador": "ANDRÉS FARIAS",
    "RUTTrabajador": "134501464",
    "EdadAlAccidente": null,
    "Cargo": "TRAZADOR",
    "RiesgoAsociado": "CAÍDA DISTINTO NIVEL",
    "TipoLesion": "FRACTURA MUÑECA IZQ.",
    "ParteCuerpo": "MUÑECA",
    "CalificacionPS": "Importante",
    "FuenteAgente": "CAMARA ELECTRICA",
    "Accion": "TRANSITO POR LUGAR INADECUADO",
    "Condicion": "CAMARA EXISTENTE, SIN IDENTIFICAR",
    "MaquinaEquipo": null,
    "Supervisor": "CRISTIAN QUEZADA",
    "PTerreno": "CHRISTIAN SEGNER",
    "APR": "JONATHAN SOTO",
    "ADO": "DANIEL FUENTES",
    "CausaRaiz": null,
    "CtrlE": null, "CtrlS": null, "CtrlI": null, "CtrlA": null, "CtrlEPP": null,
    "Observaciones": null,
    "TipoAccidente": "TRABAJO",
    "CategoriaTipoAccidente": "LABORAL",
    "Estado": "Reportado",
    "FechaReporte": "2026-03-13 05:21:37"
  }
}
```

### Campos de la Vista

| Campo | Origen | Descripción |
|-------|--------|-------------|
| `IdAccidente` | `TB_Accidentes` | PK del accidente |
| `NumeroAccidente` | `TB_Accidentes` | Número auto-generado |
| `IdObra` | `TB_Accidentes` | FK (para filtros) |
| `IdEmpresa` | `TB_Accidentes` | FK (para filtros) |
| `IdTrabajador` | `TB_Accidentes` | FK (para filtros) |
| `IdTipoAccidente` | `TB_Accidentes` | FK (para filtros) |
| `DiasPerdidosEstimados` | `TB_Accidentes` | Días estimados |
| `DiasPerdidosFinal` | `TB_Accidentes` | Días finales |
| `NumEnfermedadProfesional` | `TB_Accidentes` | Número enfermedad profesional |
| `NombreObra` | `TB_ObrasAccidentes.Obra` | Nombre de la obra |
| `CodigoObra` | `TB_ObrasAccidentes.Codigo` | Código de la obra |
| `EstadoObra` | `TB_ObrasAccidentes.Estado` | Estado de la obra |
| `DescripcionObra` | `TB_ObrasAccidentes.Descripcion` | Descripción de la obra |
| `NombreEmpresa` | `TB_Empresas.Nombre` | Nombre de la empresa |
| `FechaAccidente` | `TB_Accidentes` | Fecha del accidente |
| `HoraAccidente` | `TB_Accidentes` | Hora del accidente (formato `HH:MM`) |
| `FechaControl` | `TB_Accidentes` | Fecha de control |
| `FechaAlta` | `TB_Accidentes` | Fecha de alta |
| `Descripcion` | `TB_Accidentes` | Descripción del accidente |
| `DiaSemana` | Calculado | `DAYOFWEEK(FechaAccidente)` → Lunes, Martes, etc. |
| `NombreTrabajador` | `TB_Trabajadores.Nombre` | Nombre del trabajador |
| `RUTTrabajador` | `TB_Trabajadores.RUT` | RUT formateado (sin puntos ni guiones) |
| `EdadAlAccidente` | `TB_AccidentesTrabajadorData` | Edad calculada |
| `Cargo` | `TB_Cargos.Nombre` | Cargo del trabajador |
| `RiesgoAsociado` | `TB_RiesgosAsociados.Nombre` | Riesgo asociado |
| `TipoLesion` | `TB_Lesiones.Nombre` | Tipo de lesión |
| `ParteCuerpo` | `TB_PartesCuerpo.Nombre` | Parte del cuerpo afectada |
| `CalificacionPS` | `TB_AccidentesAnalisis` | Leve/Menor/Importante/Grave/Fatal |
| `FuenteAgente` | `TB_AccidentesAnalisis` | Fuente o agente causante |
| `Accion` | `TB_AccidentesAnalisis` | Acción insegura |
| `Condicion` | `TB_AccidentesAnalisis` | Condición insegura |
| `MaquinaEquipo` | `TB_MaquinasEquipos.Nombre` | Máquina o equipo involucrado |
| `Supervisor` | `TB_Trabajadores.Nombre` | Supervisor del trabajador |
| `PTerreno` | `TB_Trabajadores.Nombre` | Profesional de terreno |
| `APR` | `TB_Trabajadores.Nombre` | APR |
| `ADO` | `TB_Trabajadores.Nombre` | ADO |
| `CausaRaiz` | `TB_CausasRaiz.Nombre` | Causa raíz |
| `CtrlE/S/I/A/EPP` | `TB_AccidentesGestionCambio` | Controles aplicados |
| `Observaciones` | `TB_AccidentesGestionCambio` | Observaciones |
| `TipoAccidente` | `TB_TiposAccidente.Nombre` | Tipo de accidente |
| `CategoriaTipoAccidente` | `TB_TiposAccidente.Categoria` | Categoría |
| `Estado` | `TB_Accidentes` | Estado del accidente |
| `FechaReporte` | `TB_Accidentes.created_at` | Fecha de creación |

**Cache**: 300 segundos (5 minutos)

---

## 4. `Consultas` — Listar Accidentes con Filtros

Retorna una lista paginada de accidentes usando la vista completa.

### Campos (todos opcionales)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdObra` | int | Filtrar por obra |
| `IdEmpresa` | int | Filtrar por empresa |
| `FechaDesde` | string | Fecha inicio `YYYY-MM-DD` |
| `FechaHasta` | string | Fecha fin `YYYY-MM-DD` |
| `IdTipoAccidente` | int | Filtrar por tipo |
| `Estado` | string | Filtrar por estado |
| `limit` | int | Máximo de registros (default: 100) |
| `offset` | int | Desplazamiento (default: 0) |

### Ejemplo

```json
{
  "caso": "Consultas",
  "IdObra": 1,
  "FechaDesde": "2025-01-01",
  "FechaHasta": "2025-12-31",
  "limit": 10,
  "offset": 0
}
```

### Respuesta

```json
{
  "success": true,
  "data": [
    { /* mismo formato que Consulta */ },
    { /* ... */ }
  ]
}
```

**Ordenamiento**: `FechaAccidente DESC, IdAccidente DESC`
**Cache**: 180 segundos (3 minutos)

---

## 5. `Elimina` — Eliminar Accidente (Soft Delete)

Cambia el estado del accidente a `"Anulado"`.

### Campos Requeridos

| Campo | Tipo |
|-------|------|
| `IdAccidente` | int |

### Ejemplo

```json
{ "caso": "Elimina", "IdAccidente": 5 }
```

---

## 6. `Activa` — Cambiar Estado

Cambia el estado de un accidente.

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdAccidente` | int | ID del accidente |
| `Estado` | string | `Reportado`, `En_Investigacion`, `Cerrado`, `Anulado` |

### Ejemplo

```json
{ "caso": "Activa", "IdAccidente": 5, "Estado": "Cerrado" }
```

---

## 7. `ConsultaDropdowns` — Datos para Formulario

Retorna todos los catálogos necesarios para poblar dropdowns de un formulario de accidentes.

### Campos

Ninguno requerido.

### Ejemplo

```json
{ "caso": "ConsultaDropdowns" }
```

### Respuesta

```json
{
  "success": true,
  "data": {
    "obras": [
      { "IdObra": "1", "Nombre": "MPV LIFESTYLE", "Codigo": null, "Estado": "Activa", "Descripcion": null }
    ],
    "empresas": [
      { "IdEmpresa": "1", "Nombre": "INARCO", "RUT": null }
    ],
    "trabajadores": [
      { "IdTrabajador": "1", "Nombre": "CRISTIAN QUEZADA", "RUT": null }
    ],
    "riesgosAsociados": [
      { "IdRiesgoAsociado": "1", "Nombre": "CAÍDA DISTINTO NIVEL", "Categoria": "General", "NivelPeligro": "Medio" }
    ],
    "lesiones": [
      { "IdLesion": "1", "Nombre": "FRACTURA MUÑECA IZQ.", "Gravedad": "Leve" }
    ],
    "partesCuerpo": [
      { "IdParteCuerpo": "1", "Nombre": "MUÑECA", "ZonaAnatomica": "General" }
    ],
    "cargos": [
      { "IdCargo": "1", "Nombre": "TRAZADOR", "Categoria": "Operativo" }
    ],
    "maquinasEquipos": [
      { "IdMaquinaEquipo": "1", "Nombre": "ANDAMIO", "Tipo": "Maquinaria", "Marca": null, "Modelo": null }
    ],
    "causasRaiz": [
      { "IdCausaRaiz": "1", "Nombre": "...", "Categoria": "General" }
    ],
    "calificacionPS": ["Leve", "Menor", "Importante", "Grave", "Fatal"],
    "tiposAccidente": [
      { "IdTipoAccidente": "1", "Nombre": "TRABAJO", "Categoria": "LABORAL", "Descripcion": null }
    ],
    "estados": ["Reportado", "En_Investigacion", "Cerrado", "Anulado"]
  }
}
```

**Cache**: 1800 segundos (30 minutos)

---

## 8. `ConsultaEstadisticas` — Dashboard de Estadísticas

Retorna estadísticas agregadas de accidentes.

### Campos (todos opcionales)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdObra` | int | Filtrar por obra |
| `FechaDesde` | string | Fecha inicio `YYYY-MM-DD` |
| `FechaHasta` | string | Fecha fin `YYYY-MM-DD` |

### Ejemplo

```json
{ "caso": "ConsultaEstadisticas" }
```

### Respuesta

```json
{
  "success": true,
  "data": {
    "por_riesgo": [
      { "Riesgo": "CAÍDA DISTINTO NIVEL", "Total": "8", "NivelPeligro": "Medio" },
      { "Riesgo": "GOLPEADO POR", "Total": "6", "NivelPeligro": "Medio" }
    ],
    "por_mes": [
      { "Mes": "2025-10", "Total": "10" },
      { "Mes": "2025-09", "Total": "8" }
    ],
    "por_gravedad": [
      { "Gravedad": "Leve", "Total": "27" },
      { "Gravedad": "Importante", "Total": "23" },
      { "Gravedad": "Grave", "Total": "16" },
      { "Gravedad": "Menor", "Total": "2" }
    ],
    "total_accidentes": "68"
  }
}
```

**Cache**: 600 segundos (10 minutos)

---

## 9. `GenerarNumero` — Generar Número de Accidente

Genera un número de accidente automático sin crear el accidente.

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `IdObra` | int | FK a `TB_ObrasAccidentes` |
| `FechaAccidente` | string | Formato `YYYY-MM-DD` |

### Ejemplo

```json
{ "caso": "GenerarNumero", "IdObra": 1, "FechaAccidente": "2025-03-10" }
```

### Respuesta

```json
{
  "success": true,
  "data": "MPV-20250310-001"
}
```

**Formato**: `{3_LETRAS_OBRA}-{YYYYMMDD}-{NNN}`

---

## 10. `Test` — Prueba de Conectividad

### Ejemplo

```json
{ "caso": "Test", "valor": "hola" }
```

### Respuesta

```json
{ "success": true, "data": "hola - AccidentesDal" }
```

---

## 11. `CreaCatalogo` — Crear Elemento en Tabla de Catálogo

Permite crear nuevos elementos en cualquiera de las **10 tablas de catálogo** del sistema.
Esto es útil para agregar, por ejemplo, un nuevo Tipo de Accidente, una Lesión, un Cargo, etc. directamente desde la API sin necesidad de acceder a la base de datos.

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tabla` | string | Nombre exacto de la tabla (ver tablas permitidas) |
| `Nombre` | string | Nombre del elemento (se normaliza a MAYÚSCULAS) |

### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Descripcion` | string | Descripción del elemento (se normaliza a MAYÚSCULAS) |
| `extra` | object | Campos adicionales específicos de cada tabla (ver detalle abajo) |

### Tablas Permitidas y sus Campos Extra

| Tabla | Crea... | Campos `extra` disponibles |
|-------|---------|---------------------------|
| `TB_TiposAccidente` | Tipo de accidente | `Categoria` (ej: `"LABORAL"`) |
| `TB_RiesgosAsociados` | Riesgo asociado | `Categoria`, `NivelPeligro` (ej: `"Medio"`, `"Crítico"`) |
| `TB_Lesiones` | Tipo de lesión | `Gravedad` (ej: `"Leve"`, `"Grave"`) |
| `TB_PartesCuerpo` | Parte del cuerpo | `ZonaAnatomica` (ej: `"Extremidades superiores"`) |
| `TB_Cargos` | Cargo | `Categoria` (ej: `"Operativo"`, `"Técnico"`) |
| `TB_MaquinasEquipos` | Máquina/equipo | `Tipo`, `Marca`, `Modelo` |
| `TB_CausasRaiz` | Causa raíz | `Categoria` (ej: `"Organizacional"`) |
| `TB_ObrasAccidentes` | Obra | `Codigo`, `Estado`, `Descripcion` |
| `TB_Empresas` | Empresa | `RUT` |
| `TB_Trabajadores` | Trabajador | `RUT` |

### Comportamiento

- **Anti-duplicados**: Si ya existe un registro activo con el mismo `Nombre`, retorna el ID existente con `"exists": true` en lugar de crear uno nuevo.
- **Normalización**: `Nombre`, `Descripcion`, `Categoria`, `Tipo`, `Estado` y `Codigo` se normalizan a MAYÚSCULAS automáticamente.
- **Cache**: Limpia automáticamente el cache de `ConsultaDropdowns` para que los nuevos elementos aparezcan inmediatamente.
- **Nota sobre TB_ObrasAccidentes**: El campo nombre se guarda en la columna `Obra` (no `Nombre`), pero en la API siempre se envía como `Nombre`.

### Ejemplos

#### Crear un Tipo de Accidente
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_TiposAccidente",
  "Nombre": "ELECTRICO",
  "Descripcion": "Accidente por contacto eléctrico",
  "extra": {
    "Categoria": "LABORAL"
  }
}
```

#### Crear un Riesgo Asociado
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_RiesgosAsociados",
  "Nombre": "CONTACTO CON SUSTANCIAS QUIMICAS",
  "extra": {
    "Categoria": "Químico",
    "NivelPeligro": "Crítico"
  }
}
```

#### Crear una Lesión
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_Lesiones",
  "Nombre": "QUEMADURA GRADO 2",
  "extra": {
    "Gravedad": "Grave"
  }
}
```

#### Crear una Parte del Cuerpo
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_PartesCuerpo",
  "Nombre": "ANTEBRAZO",
  "extra": {
    "ZonaAnatomica": "Extremidades superiores"
  }
}
```

#### Crear un Cargo
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_Cargos",
  "Nombre": "SOLDADOR",
  "extra": {
    "Categoria": "Operativo"
  }
}
```

#### Crear una Máquina/Equipo
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_MaquinasEquipos",
  "Nombre": "GRUA TORRE",
  "extra": {
    "Tipo": "Maquinaria",
    "Marca": "LIEBHERR",
    "Modelo": "EC-H 16"
  }
}
```

#### Crear una Obra
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_ObrasAccidentes",
  "Nombre": "EDIFICIO CENTRAL NORTE",
  "extra": {
    "Codigo": "ECN",
    "Estado": "Activa"
  }
}
```

#### Crear una Empresa
```json
{
  "caso": "CreaCatalogo",
  "tabla": "TB_Empresas",
  "Nombre": "CONSTRUCTORA ACME",
  "extra": {
    "RUT": "76.123.456-7"
  }
}
```

### Respuesta (elemento nuevo)

```json
{
  "success": true,
  "code": 200,
  "message": "Elemento creado correctamente",
  "data": {
    "id": 15,
    "nombre": "ELECTRICO",
    "exists": false
  }
}
```

### Respuesta (elemento ya existía)

```json
{
  "success": true,
  "code": 200,
  "message": "Elemento creado correctamente",
  "data": {
    "id": 3,
    "nombre": "ELECTRICO",
    "exists": true
  }
}
```

---

## Flujo Completo: Crear un Accidente desde Cero

Este flujo muestra cómo crear un accidente cuando los catálogos necesarios aún no existen.

### Paso 1 — Obtener catálogos existentes

```json
{ "caso": "ConsultaDropdowns" }
```

Revisar si los valores necesarios (obra, empresa, trabajador, tipo accidente, etc.) ya existen en los dropdowns retornados.

### Paso 2 — Crear catálogos faltantes (si es necesario)

Si por ejemplo no existe el tipo de accidente o el cargo, crearlos primero:

```json
{ "caso": "CreaCatalogo", "tabla": "TB_TiposAccidente", "Nombre": "ELECTRICO", "extra": { "Categoria": "LABORAL" } }
```
```json
{ "caso": "CreaCatalogo", "tabla": "TB_Cargos", "Nombre": "SOLDADOR", "extra": { "Categoria": "Operativo" } }
```

Guardar los `id` retornados para usarlos en el paso siguiente.

### Paso 3 — Crear el accidente

Usar los IDs de los catálogos (existentes o recién creados):

```json
{
  "caso": "Crea",
  "IdObra": 1,
  "IdTrabajador": 5,
  "IdEmpresa": 2,
  "FechaAccidente": "2026-03-30",
  "HoraAccidente": "09:30",
  "IdTipoAccidente": 15,
  "Descripcion": "Quemadura por contacto con cable eléctrico",
  "DiasPerdidosEstimados": 10,
  "IdCargo": 8,
  "IdSupervisor": 10,
  "IdRiesgoAsociado": 3,
  "IdLesion": 7,
  "IdParteCuerpo": 5,
  "CalificacionPS": "Grave",
  "FuenteAgente": "Cable eléctrico",
  "Accion": "Manipulación sin guantes dieléctricos",
  "Condicion": "Cable sin señalizar",
  "CtrlI": true,
  "CtrlA": true,
  "CtrlEPP": true,
  "created_by": 1
}
```

### Paso 4 — Verificar el accidente creado

```json
{ "caso": "Consulta", "IdAccidente": 69 }
```

### Resumen del Flujo

```
ConsultaDropdowns → CreaCatalogo (si faltan) → Crea → Consulta (verificar)
```

---

## Bugs Corregidos en Esta Revisión

| # | Bug | Causa | Fix |
|---|-----|-------|-----|
| 1 | `Crea` rechazaba peticiones sin `DiaSemana`, `CalificacionPS`, etc. | `validateRequiredParams` exigía 12 campos | Reducido a solo `IdObra`, `IdTrabajador` |
| 2 | `ConsultaDropdowns` retornaba tipos de accidente hardcodeados | `tiposAccidente` era array estático `['Trabajo', 'NEP', 'Común']` | Cambiado a `GetTiposAccidente()` de BD |
| 3 | `ConsultaDropdowns` incluía `diasSemana` | DiaSemana ya no es campo manual | Eliminado del dropdown |
| 4 | `CalificacionPS` se normalizaba a MAYÚSCULAS | `DataNormalizer::normalize()` en DAL | Eliminada normalización (valores son Title Case) |
| 5 | `Estado` se normalizaba a MAYÚSCULAS | Mismo problema | Eliminada normalización |
| 6 | `Consulta/Consultas/Dropdowns/Estadisticas` daban error 500 | `CacheManager::remember()` se llamaba con argumentos invertidos `($key, $ttl, $callback)` en vez de `($key, $callback, $ttl)` | Corregido orden de argumentos |
| 7 | `Consultas` no podía filtrar por `IdObra`, `IdEmpresa`, `IdTipoAccidente` | Vista no exponía columnas FK | Agregadas a `vista_accidentes_completa` |

---

## Importador CSV

El importador es un endpoint separado:

```
POST /ws/CsvImportSvcImpl.php
Content-Type: application/json

{
  "caso": "ImportFromPath",
  "file_path": "/var/www/html/docs/formato.csv",
  "batch_size": 25,
  "stop_on_error": false,
  "validate_only": false
}
```

Ver documentación completa en `IMPORTADOR_CSV_DOCUMENTACION.md`.
