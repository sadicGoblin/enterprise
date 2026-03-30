# Integración Frontend - API de Accidentes

## Endpoint Base

| Entorno     | URL                                                        |
|-------------|-----------------------------------------------------------|
| Desarrollo  | `http://localhost:8080/ws/AccidentesSvcImpl.php`          |
| Producción  | `https://inarco-ssoma.favric.cl/ws/AccidentesSvcImpl.php` |

Todas las peticiones son **POST** con `Content-Type: application/json`.

---

## Servicio Angular

**Archivo:** `services/accidente.service.ts`

```typescript
import { AccidenteService } from '../../services/accidente.service';
```

### Métodos Disponibles

| Método               | Caso API              | Descripción                          |
|----------------------|-----------------------|--------------------------------------|
| `getDropdowns()`     | `ConsultaDropdowns`   | Carga opciones para formulario       |
| `crearAccidente()`   | `Crea`                | Registrar nuevo accidente            |
| `actualizarAccidente()` | `Actualiza`        | Actualizar accidente existente       |
| `getAccidente(id)`   | `Consulta`            | Obtener un accidente por ID          |
| `listarAccidentes()` | `Consultas`           | Listar accidentes con filtros        |
| `eliminarAccidente()`| `Elimina`             | Eliminar accidente (soft delete)     |
| `cambiarEstado()`    | `Activa`              | Cambiar estado de accidente          |
| `getEstadisticas()`  | `ConsultaEstadisticas`| Obtener estadísticas                 |
| `generarNumero()`    | `GenerarNumero`       | Generar número de accidente          |

---

## Modelos TypeScript

**Archivo:** `models/accident.model.ts`

### Interfaces Principales

- **`AccidenteApiResponse`** — Respuesta plana de la vista `vista_accidentes_completa`
- **`CrearAccidenteRequest`** — Payload para crear accidente
- **`ActualizarAccidenteRequest`** — Payload para actualizar accidente
- **`ListarAccidentesRequest`** — Payload para listar con filtros
- **`AccidenteDropdowns`** — Respuesta de dropdowns del formulario
- **`EstadisticasApiResponse`** — Respuesta de estadísticas
- **`ApiResponse<T>`** — Wrapper genérico de respuesta API

---

## Campos Requeridos para Crear (caso: Crea)

Solo **2 campos** son obligatorios:

| Campo          | Tipo   | Descripción              |
|----------------|--------|--------------------------|
| `IdObra`       | number | ID de la obra/proyecto   |
| `IdTrabajador` | number | ID del trabajador        |

Todos los demás campos son opcionales.

---

## Dropdowns Dinámicos (ConsultaDropdowns)

La API devuelve las siguientes listas para poblar los `<mat-select>`:

| Propiedad          | Tabla Origen               | Campos Key              |
|--------------------|----------------------------|-------------------------|
| `obras`            | `TB_ObrasAccidentes`       | `IdObra`, `Nombre`      |
| `empresas`         | `TB_Empresas`              | `IdEmpresa`, `Nombre`   |
| `trabajadores`     | `TB_Trabajadores`          | `IdTrabajador`, `Nombre`, `RUT` |
| `tiposAccidente`   | `TB_TiposAccidente`        | `IdTipoAccidente`, `Nombre` |
| `riesgosAsociados` | `TB_RiesgosAsociados`      | `IdRiesgoAsociado`, `Nombre` |
| `lesiones`         | `TB_Lesiones`              | `IdLesion`, `Nombre`    |
| `partesCuerpo`     | `TB_PartesCuerpo`          | `IdParteCuerpo`, `Nombre` |
| `cargos`           | `TB_Cargos`                | `IdCargo`, `Nombre`     |
| `maquinasEquipos`  | `TB_MaquinasEquipos`       | `IdMaquinaEquipo`, `Nombre` |
| `causasRaiz`       | `TB_CausasRaiz`            | `IdCausaRaiz`, `Nombre` |
| `calificacionPS`   | (constante)                | `['Leve','Menor','Importante','Grave','Fatal']` |
| `estados`          | (constante)                | `['Reportado','En_Investigacion','Cerrado','Anulado']` |

---

## Componentes Actualizados

### 1. AccidentsComponent (Registro)
**Ruta:** `/check-list/accidents/register`

- Formulario de 5 pasos con `FormGroup`
- Carga dropdowns al iniciar (`ngOnInit → loadDropdowns()`)
- Submit llama `accidenteService.crearAccidente()`
- Muestra spinner mientras se cargan datos y se guarda
- Campos obligatorios: `IdObra`, `FechaAccidente`, `IdTrabajador`
- `DiaSemana` se calcula automáticamente en el backend

### 2. AccidentsListComponent (Listado)
**Ruta:** `/check-list/accidents/list`

- Carga datos via `accidenteService.listarAccidentes()`
- Tabla Material con sorting y paginación
- Filtros: Obra, Estado, Gravedad, búsqueda de texto
- Exportación a Excel mantiene las mismas columnas
- Estado se muestra con labels legibles (`En_Investigacion` → `En Investigación`)

### 3. AccidentsStatisticsComponent (Estadísticas)
**Ruta:** `/check-list/accidents/statistics`

- Carga datos via `accidenteService.getEstadisticas()`
- KPIs: Total accidentes, Alta Gravedad, Importante, Leve/Menor
- Gráfico doughnut de distribución por gravedad
- Gráfico línea de tendencia mensual
- Tabla de riesgos asociados más frecuentes

---

## Mapeo Formulario → API Request

| Campo Formulario       | Campo API               | Notas                        |
|------------------------|-------------------------|------------------------------|
| `IdObra`               | `IdObra`                | Requerido                    |
| `IdTrabajador`         | `IdTrabajador`          | Requerido                    |
| `IdEmpresa`            | `IdEmpresa`             |                              |
| `FechaAccidente`       | `FechaAccidente`        | Se formatea a `YYYY-MM-DD`   |
| `HoraAccidente`        | `HoraAccidente`         | Formato `HH:MM`             |
| `IdTipoAccidente`      | `IdTipoAccidente`       |                              |
| `Descripcion`          | `Descripcion`           | Min 10 caracteres            |
| `DiasPerdidosEstimados`| `DiasPerdidosEstimados` |                              |
| `FechaControl`         | `FechaControl`          | Se formatea a `YYYY-MM-DD`   |
| `IdCargo`              | `IdCargo`               |                              |
| `IdSupervisor`         | `IdSupervisor`          | ID de trabajador             |
| `IdPTerreno`           | `IdPTerreno`            | ID de trabajador             |
| `IdAPR`                | `IdAPR`                 | ID de trabajador             |
| `IdADO`                | `IdADO`                 | ID de trabajador             |
| `IdRiesgoAsociado`     | `IdRiesgoAsociado`      |                              |
| `IdLesion`             | `IdLesion`              |                              |
| `IdParteCuerpo`        | `IdParteCuerpo`         |                              |
| `CalificacionPS`       | `CalificacionPS`        | String: Leve/Menor/etc      |
| `FuenteAgente`         | `FuenteAgente`          | Texto libre                  |
| `Accion`               | `Accion`                | Texto libre                  |
| `Condicion`            | `Condicion`             | Texto libre                  |
| `IdMaquinaEquipo`      | `IdMaquinaEquipo`       |                              |
| `IdCausaRaiz`          | `IdCausaRaiz`           |                              |
| `CtrlE`                | `CtrlE`                 | boolean                      |
| `CtrlS`                | `CtrlS`                 | boolean                      |
| `CtrlI`                | `CtrlI`                 | boolean                      |
| `CtrlA`                | `CtrlA`                 | boolean                      |
| `CtrlEPP`              | `CtrlEPP`               | boolean                      |
| `Observaciones`        | `Observaciones`         |                              |

---

## Estados del Accidente

| Valor BD             | Label Frontend       |
|----------------------|----------------------|
| `Reportado`          | Reportado            |
| `En_Investigacion`   | En Investigación     |
| `Cerrado`            | Cerrado              |
| `Anulado`            | Anulado              |

---

## Ejemplo de Request: Crear Accidente

```json
{
  "caso": "Crea",
  "IdObra": 1,
  "IdTrabajador": 5,
  "IdEmpresa": 2,
  "FechaAccidente": "2025-11-15",
  "HoraAccidente": "14:30",
  "IdTipoAccidente": 1,
  "Descripcion": "Trabajador sufre caída a mismo nivel al transitar por terreno irregular",
  "CalificacionPS": "Importante",
  "IdRiesgoAsociado": 3,
  "IdLesion": 2,
  "IdParteCuerpo": 4,
  "CtrlE": false,
  "CtrlS": false,
  "CtrlI": true,
  "CtrlA": true,
  "CtrlEPP": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "success": true,
  "code": 201,
  "message": "Accidente creado exitosamente",
  "data": {
    "IdAccidente": 15,
    "NumeroAccidente": "ACC-OBR1-2025-001",
    "success": true
  }
}
```

---

## Proxy de Desarrollo

El Angular proxy (`proxy.conf.json`) redirige `/ws/*` a la API PHP. El `ProxyService` en modo desarrollo usa la URL relativa con `environment.apiBaseUrl`.

**Nota:** Asegúrese de que el servidor `ms-ssoma` (Docker) esté corriendo en el puerto `8080` para desarrollo local.
