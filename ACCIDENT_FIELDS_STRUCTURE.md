# Estructura de Campos del Formulario de Accidentes

## Resumen de Cambios Solicitados

### 🔄 Cambios en Tipos de Control
- **Riesgo Asociado**: Cambio de `text input` → `select dropdown`
- **N° Accidente**: **ELIMINAR** del formulario (generación automática por fecha/hora)
- **Edad**: **REEMPLAZAR** por `fechaNacimiento` (date picker)
- **Múltiples campos**: Cambio de `text input` → `select dropdown`

### 👥 Campos de Trabajadores
- Supervisor, P Terreno, APR, ADO deben ser `select` de lista de trabajadores (sin mostrar RUT)

### 🎛️ Controles de Jerarquía
- Renombrar controles a nombres más cortos (ctrlE, ctrlS, ctrlI, ctrlA)

---

## Estructura Final Actualizada

| Campo CSV | Campo Frontend | Tipo de Control | Observaciones | Estado |
|-----------|----------------|-----------------|---------------|--------|
| ~~N° Acc~~ | ~~`numAccidente`~~ | **ELIMINADO** | Generación automática por fecha/hora | ❌ |
| Obras | `obra` | **Select** (Dropdown de obras) | | ✅ |
| N° EP | `numEnfermedadProfesional` | **Number Input** (opcional) | | ✅ |
| N° Dp Est. | `diasPerdidosEstimados` | **Number Input** (opcional) | | ✅ |
| F Acc | `fechaAccidente` | **Date Picker** | | ✅ |
| Hora | `horaAccidente` | **Time Input** (HH:MM) | | ✅ |
| F control y/o Alta | `fechaControl` | **Date Picker** (opcional) | | ✅ |
| N° Dp Final | `diasPerdidosFinal` | **Number Input** (opcional) | | ✅ |
| Tipo Acc. | `tipoAccidente` | **Select** (Trabajo, NEP, Común) | | ✅ |
| Empresa | `empresa` | **Select** (Dropdown de empresas) | | ✅ |
| Descripción | `descripcion` | **Textarea** (min 10 chars) | | ✅ |

### Sección Análisis / Tipología
| Campo CSV | Campo Frontend | Tipo de Control | Observaciones | Estado |
|-----------|----------------|-----------------|---------------|--------|
| **Riesgo asociado** | **`riesgoAsociado`** | **Select** | Opciones predefinidas | 🔄 |
| **Lesión** | **`lesion`** | **Select** | Opciones predefinidas | 🔄 |
| **Parte del cuerpo Afectada** | **`parteDelCuerpoAfectada`** | **Select** | Opciones predefinidas | 🔄 |
| Calif P/S | `calificacionPS` | **Select** (Leve, Menor, Importante, Grave, Fatal) | | ✅ |
| Fuente (Agente) | `fuente` | **Text Input** (opcional) | | ✅ |
| Acción | `accion` | **Text Input** (opcional) | | ✅ |
| Condición | `condicion` | **Text Input** (opcional) | | ✅ |
| Maquina | `maquina` | **Select** | Opciones predefinidas + N/A | 🔄 |
| Equipo | `equipo` | **Select** | Opciones predefinidas + N/A | 🔄 |

### Sección Trabajador
| Campo CSV | Campo Frontend | Tipo de Control | Observaciones | Estado |
|-----------|----------------|-----------------|---------------|--------|
| Trabajador | `trabajadorNombre` | **Text Input** | | ✅ |
| RUT | `trabajadorRut` | **Text Input** (formato RUT) | | ✅ |
| ~~Edad~~ | ~~`trabajadorEdad`~~ | **ELIMINADO** | Reemplazado por fechaNacimiento | ❌ |
| **Fecha Nacimiento** | **`fechaNacimiento`** | **Date Picker** | Cálculo automático de edad | ✅ |
| Horario | `trabajadorHorario` | **Text Input** (opcional) | | ✅ |
| Dia | `trabajadorDia` | **Select** (Lunes-Domingo) | | ✅ |
| Cargo | `trabajadorCargo` | **Select** | Lista de cargos predefinidos | 🔄 |

### Sección Línea de Mando
| Campo CSV | Campo Frontend | Tipo de Control | Observaciones | Estado |
|-----------|----------------|-----------------|---------------|--------|
| Supervisor | `supervisor` | **Select** | Lista de trabajadores (sin RUT visible) | 🔄 |
| P Terreno | `pTerreno` | **Select** | Lista de trabajadores (sin RUT visible) | 🔄 |
| APR | `apr` | **Select** | Lista de trabajadores (sin RUT visible) | 🔄 |
| ADO | `ado` | **Select** | Lista de trabajadores (sin RUT visible) | 🔄 |

### Sección Gestión del Cambio
| Campo CSV | Campo Frontend | Tipo de Control | Observaciones | Estado |
|-----------|----------------|-----------------|---------------|--------|
| Causa raíz | `causaRaiz` | **Select** | Opciones predefinidas | 🔄 |
| E | `ctrlE` | **Checkbox** (Eliminación) | Renombrado | 🔄 |
| S | `ctrlS` | **Checkbox** (Sustitución) | Renombrado | 🔄 |
| I | `ctrlI` | **Checkbox** (Ingeniería) | Renombrado | 🔄 |
| A | `ctrlA` | **Checkbox** (Administración) | Renombrado | 🔄 |
| EPP | `ctrlEPP` | **Checkbox** (EPP) | Mantiene nombre | ✅ |
| Observaciones | `observaciones` | **Textarea** (opcional) | | ✅ |

---

## Opciones para Dropdowns/Selects

### Riesgo Asociado (Basado en CSV real)
```typescript
export const RIESGO_ASOCIADO_OPTIONS = [
  'Caída distinto nivel',
  'Caída mismo nivel', 
  'Contacto Eléctrico',
  'Atropello',
  'Herida',
  'Atrapamiento',
  'Proyección Partícula',
  'Sobrecarga física',
  'Golpeado por',
  'Golpeado contra',
  'Común',
  'Picadura Insecto',
  'Contacto con',
  'Musculoesquelético',
  'Desvanecimiento'
];
```

### Lesión (Basado en CSV real)
```typescript
export const LESION_OPTIONS = [
  'Fractura',
  'Fractura Muñeca Izq.',
  'Policontuso',
  'Herida Punzante Plantar',
  'Herida en dedos mano izquierda',
  'Cuerpo extraño ocular',
  'Esguince grado 1',
  'Sobrecarga',
  'Contusión',
  'Quemadura',
  'Descompensación',
  'Herida',
  'Herida Cortante',
  'Contusión abrasiva',
  'Herida Contusa',
  'Contusiones Simples',
  'Picadura Muñeca izquierda',
  'N/A'
];
```

### Parte del Cuerpo Afectada (Basado en CSV real)
```typescript
export const PARTE_CUERPO_OPTIONS = [
  'Muñeca',
  'Costal',
  'Rodilla',
  'Pie derecho',
  'Pie izquierdo',
  'Pierna Derecha',
  'Cabeza',
  'Manos',
  'Rostro',
  'Brazo izquierdo',
  'Ojo derecho',
  'Ojo izquierdo',
  'Dedos',
  'Mano derecha',
  'Mano izquierda',
  'Costilla derecha',
  'Zona costal Izquierda',
  'Manos y pie izquierdo',
  'Muñeca derecha',
  'Muñeca izquierda',
  'Coxis',
  'Pierna izquierda',
  'Zona Lumbar',
  'Antebrazo Derecho',
  'Antebrazo Izquierdo',
  'Pantorilla derecha',
  'Pomulo derecho',
  'Frente costrado derecho',
  'Palma mano izquierda',
  'Dedo indice, mano derecha',
  'Dedos anular y medio',
  'Dorso mano derecha',
  'Dedo pulgar izquierdo',
  'Tobillo izquierdo',
  'Fatiga',
  'Dedo pulgar',
  'N/A'
];
```

### Máquina/Equipo (Basado en CSV real)
```typescript
export const MAQUINA_EQUIPO_OPTIONS = [
  'N/A',
  'Motocicleta',
  'Plataforma elevadora',
  'Andamio',
  'Martillo demoledor',
  'Esmeril Angular',
  'Escala telescópica',
  'Esmeril Inalámbrico',
  'Placa compactadora'
];
```

### Cargos (Basado en CSV real)
```typescript
export const CARGO_OPTIONS = [
  'Trazador',
  'Operador', 
  'Canguero',
  'Carpintero',
  'Jornal',
  'Montajista',
  'Andamiero',
  'Hojalatero',
  'Maestro Montajista',
  'Rigger',
  'Pañolero',
  'Maestro Moldajero',
  'Enfierrador',
  'Soldador',
  'Electricista',
  'Gasfiter',
  'Concretero',
  'Albañil',
  'Supervisor',
  'Eléctrico',
  'Instalador',
  'Maestro',
  'Ayudante',
  'Ay. Mantención',
  'Guardia',
  'Ayudante Trazador',
  'Prevencionista',
  'Maestro moldaje',
  'Auxiliar de aseo',
  'Aydte Gasfiter'
];
```

### Causa Raíz (Ejemplos comunes)
```typescript
export const CAUSA_RAIZ_OPTIONS = [
  'Falta de capacitación',
  'No uso de EPP',
  'Procedimiento inadecuado',
  'Falta de señalización',
  'Condiciones ambientales adversas',
  'Herramientas inadecuadas',
  'Fatiga/cansancio',
  'Falta de supervisión',
  'Mantenimiento deficiente',
  'Diseño inadecuado',
  'Factores externos',
  'Error humano',
  'Otro'
];
```

---

## Lista de Trabajadores (Para Línea de Mando)

La lista de trabajadores debe cargarse desde la base de datos y mostrar:

```typescript
export interface TrabajadorSelect {
  id: number;
  nombre: string;
  cargo: string;
  // RUT no se muestra en el dropdown, pero se almacena internamente
}

// Ejemplo de formato en dropdown:
// "Juan Pérez (Supervisor)"
// "María González (Ingeniero)"
```

---

## Resumen de Cambios Técnicos

### Campos Eliminados
- ❌ `numAccidente` - Generación automática
- ❌ `trabajadorEdad` - Reemplazado por fechaNacimiento

### Campos Agregados  
- ✅ `fechaNacimiento` - Date picker

### Campos con Cambio de Tipo
- 🔄 `riesgoAsociado`: text → select
- 🔄 `lesion`: text → select  
- 🔄 `parteDelCuerpoAfectada`: text → select
- 🔄 `maquina`: text → select
- 🔄 `equipo`: text → select
- 🔄 `trabajadorCargo`: text → select
- 🔄 `causaRaiz`: text → select
- 🔄 `supervisor`: text → select (trabajadores)
- 🔄 `pTerreno`: text → select (trabajadores)
- 🔄 `apr`: text → select (trabajadores)
- 🔄 `ado`: text → select (trabajadores)

### Campos Renombrados
- 🔄 `ctrlEliminacion` → `ctrlE`
- 🔄 `ctrlSustitucion` → `ctrlS`  
- 🔄 `ctrlIngenieria` → `ctrlI`
- 🔄 `ctrlAdministracion` → `ctrlA`

**Total de campos después de cambios: 33 campos** (eliminamos 2, agregamos 1)
