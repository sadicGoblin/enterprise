# Módulo de Gestión de Accidentes

Sistema completo para el registro, seguimiento y análisis de accidentes laborales.

## 📋 Componentes

### 1. AccidentsComponent (`/accidents/register`)
Formulario completo de registro de accidentes con:
- 10 secciones organizadas
- 40+ campos de información
- Validaciones completas
- Campos condicionales
- Campos de licencia médica con fechas

### 2. AccidentsListComponent (`/accidents/list`)
Listado y seguimiento de accidentes con:
- Tabla con filtros avanzados
- Búsqueda por texto
- Filtros por estado y severidad
- Tarjetas de resumen estadístico
- **Cálculo automático de días restantes de licencia médica**
- **Indicador visual de licencias vencidas**
- Acciones de ver/editar

### 3. AccidentsStatisticsComponent (`/accidents/statistics`)
Dashboard de estadísticas y análisis con:
- 4 gráficos interactivos (Chart.js)
- Tarjetas de métricas clave
- Tendencias mensuales
- Distribución por severidad, tipo y parte del cuerpo
- Insights y recomendaciones

## 🚀 Instalación

### Dependencias Requeridas

El módulo de estadísticas requiere Chart.js. Instalar con:

```bash
npm install chart.js
```

## 📍 Rutas

- `/check-list/accidents` → Redirige a `/check-list/accidents/register`
- `/check-list/accidents/register` → Formulario de registro
- `/check-list/accidents/list` → Listado de accidentes
- `/check-list/accidents/statistics` → Estadísticas y gráficos

## 🔧 Características Principales

### Licencia Médica
- **Fecha Inicio**: Campo de fecha para inicio de licencia
- **Fecha Fin**: Campo de fecha para fin de licencia
- **Cálculo Automático**: Días restantes calculados automáticamente
- **Estados Visuales**:
  - 🟢 **Activa**: Licencia vigente con días restantes
  - 🟡 **Por vencer**: 3 días o menos restantes
  - 🔴 **Vencida**: Fecha de fin superada
  - ⚪ **Sin licencia**: No tiene licencia médica

### Datos de Prueba
El listado incluye 7 accidentes de ejemplo con:
- Diferentes tipos y severidades
- Licencias médicas activas y vencidas
- Variedad de empresas y trabajadores
- Estados diversos (Reportado, En investigación, Cerrado)

### Gráficos Disponibles
1. **Distribución por Severidad** (Doughnut)
2. **Distribución por Tipo** (Pie)
3. **Tendencia Mensual** (Line)
4. **Partes del Cuerpo Afectadas** (Bar)

## 💾 Estructura de Datos

```typescript
interface Accident {
  id: string;
  accidentNumber: string;
  accidentDate: Date;
  workerName: string;
  workerCompany: string;
  accidentType: string;
  severity: string;
  bodyPart: string;
  status: string;
  medicalLeaveStartDate: Date | null;
  medicalLeaveEndDate: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
}
```

## 🎨 Estilos

- Diseño responsive para móviles, tablets y desktop
- Gradientes y colores según Material Design
- Animaciones suaves en hover
- Iconos Material Icons
- Chips de estado con colores semánticos

## 🔄 Navegación

Los componentes están interconectados:
- Desde el **listado** → botón "Estadísticas" y "Nuevo Accidente"
- Desde **estadísticas** → botón "Ver Listado"
- Desde el **formulario** → puede navegar al listado (implementar según necesidad)

## 📝 Notas

- **Sin conexión a servicios**: Todos los componentes usan datos mock
- **Validaciones activas**: El formulario tiene validaciones completas
- **Listo para integración**: Estructura preparada para conectar con backend
- **Código en inglés**: Variables y métodos siguiendo estándares del proyecto
- **UI en español**: Textos visibles para el usuario final

## 🚧 Próximos Pasos

1. Conectar con servicios backend
2. Implementar exportación de reportes
3. Agregar vista de detalles de accidente
4. Implementar edición de accidentes
5. Agregar notificaciones de licencias por vencer
6. Implementar filtros avanzados adicionales
