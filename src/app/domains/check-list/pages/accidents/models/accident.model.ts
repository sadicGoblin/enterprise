/**
 * Modelo de datos para el registro de accidentes
 * Basado en la estructura del Excel de reportes
 */

// =============================================
// DATOS PRINCIPALES DEL ACCIDENTE (Imagen 1)
// =============================================

export interface AccidentRecord {
  id: string;
  
  // Información básica
  obra: string;                    // Nombre del proyecto/obra
  obraId?: number;
  numAccidente: number;            // N° Acc
  numEnfermedadProfesional?: number; // N° EP
  diasPerdidosEstimados?: number;  // N° Dp Est.
  fechaAccidente: Date;            // F Acc
  fechaControl?: Date;             // control y/o Al
  diasPerdidosFinal?: number;      // N° Dp Final
  tipoAccidente: TipoAccidente;    // Tipo Acc. (Trabajo, NEP, Común)
  empresa: string;                 // Empresa
  empresaId?: number;
  descripcion: string;             // Descripción del accidente
  
  // Antecedentes del trabajador (Imagen 3)
  trabajador: DatosTrabajador;
  
  // Línea de mando (Imagen 3)
  lineaMando: LineaMando;
  
  // Análisis y Tipología (Imagen 2)
  analisis: AnalisisTipologia;
  
  // Gestión del cambio / Jerarquía de controles (Imagen 3)
  gestionCambio: GestionCambio;
  
  // Metadatos
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  creadoPor?: string;
  estado: EstadoAccidente;
}

// =============================================
// DATOS DEL TRABAJADOR (Imagen 3)
// =============================================

export interface DatosTrabajador {
  rut: string;
  nombre: string;
  edad: number;
  horario: string;                 // Ej: "18:30hrs"
  dia: DiaSemana;                  // Día de la semana
  cargo: string;                   // Cargo del trabajador
}

// =============================================
// LÍNEA DE MANDO (Imagen 3)
// =============================================

export interface LineaMando {
  supervisor: string;              // Supervisor directo
  pTerreno: string;                // P Terreno (Profesional en terreno)
  apr: string;                     // APR
  ado: string;                     // ADO
}

// =============================================
// ANÁLISIS / TIPOLOGÍA (Imagen 2)
// =============================================

export interface AnalisisTipologia {
  calificacionPS: CalificacionPotencialSeveridad; // Calif P/S
  fuente: string;                  // Fuente del accidente
  accion: string;                  // Acción que causó el accidente
  condicion: string;               // Condición del lugar/trabajo
  maquina?: string;                // Máquina involucrada (puede ser N/A)
  equipo?: string;                 // Equipo involucrado (puede ser N/A)
}

// =============================================
// GESTIÓN DEL CAMBIO / JERARQUÍA DE CONTROLES (Imagen 3)
// =============================================

export interface GestionCambio {
  causaRaiz: string;               // Causa raíz del accidente
  eliminacion: boolean;            // E - Eliminación
  sustitucion: boolean;            // S - Sustitución
  ingenieriaControl: boolean;      // I - Ingeniería de control
  administracion: boolean;         // A - Controles administrativos
  epp: boolean;                    // EPP - Equipo de protección personal
  observaciones?: string;
}

// =============================================
// ENUMERACIONES
// =============================================

export type TipoAccidente = 'Trabajo' | 'NEP' | 'Común';

export type CalificacionPotencialSeveridad = 'Leve' | 'Menor' | 'Importante' | 'Grave' | 'Fatal';

export type TipoOrganismo = 'INARCO' | 'SC';

export type TipoDiasPerdidos = 'STP' | 'CTP'; // Sin Tiempo Perdido / Con Tiempo Perdido

export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type EstadoAccidente = 'Reportado' | 'En Investigación' | 'Cerrado' | 'Pendiente';

// =============================================
// ESTADÍSTICAS (Imagen 1 - Panel izquierdo)
// =============================================

export interface EstadisticasAccidentes {
  // Totales
  numeroAccidentes: number;
  numeroDiasPerdidos: number;
  
  // Por tipo de accidente
  porTipo: {
    comun: number;
    fatal: number;
    trabajo: number;
  };
  
  // Por organismo
  porOrganismo: {
    inarco: number;
    sc: number;
    total: number;
  };
  
  // Por días perdidos
  porDiasPerdidos: {
    stp: number;  // Sin Tiempo Perdido
    ctp: number;  // Con Tiempo Perdido
    total: number;
  };
  
  // Por severidad/gravedad
  porGravedad: {
    leve: number;
    menor: number;
    importante: number;
    grave: number;
    fatal: number;
    total: number;
  };
  
  // Fecha de análisis
  fechaAnalisis: Date;
  periodo: string; // Ej: "Enero - Noviembre 2025"
}

// =============================================
// OPCIONES PARA DROPDOWNS
// =============================================

export const TIPO_ACCIDENTE_OPTIONS: TipoAccidente[] = ['Trabajo', 'NEP', 'Común'];

export const CALIFICACION_PS_OPTIONS: CalificacionPotencialSeveridad[] = [
  'Leve', 'Menor', 'Importante', 'Grave', 'Fatal'
];

export const DIA_SEMANA_OPTIONS: DiaSemana[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const ESTADO_ACCIDENTE_OPTIONS: EstadoAccidente[] = [
  'Reportado', 'En Investigación', 'Cerrado', 'Pendiente'
];

// =============================================
// DATOS MOCK PARA PRUEBAS
// =============================================

export const MOCK_ACCIDENTS: AccidentRecord[] = [
  {
    id: '1',
    obra: 'CD PROCENTRO III',
    numAccidente: 1,
    diasPerdidosEstimados: 254,
    fechaAccidente: new Date(2025, 3, 22),
    fechaControl: new Date(2025, 11, 31),
    diasPerdidosFinal: 254,
    tipoAccidente: 'Trabajo',
    empresa: 'SC B&J',
    descripcion: 'Trabajador sufre contacto eléctrico por uso de herramienta manual en proximidad a cables de media tensión ubicados en sector aledaño de la obra, la perenco de afinado tenía una extensión de 7,30 Mt.',
    trabajador: {
      rut: '18083363-3',
      nombre: 'Fabián Muñoz Aguirre',
      edad: 32,
      horario: '18:30hrs',
      dia: 'Martes',
      cargo: 'Hojalatero'
    },
    lineaMando: {
      supervisor: 'Juan Carriel',
      pTerreno: 'Sebastián Zapata',
      apr: 'Luis Iturra',
      ado: 'Felipe Gómez'
    },
    analisis: {
      calificacionPS: 'Grave',
      fuente: 'Línea de media Tensión',
      accion: 'posicionarse con herramienta manual bajo cables de media tensión',
      condicion: 'Falta de limitación física sobre cables de media tensión'
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Cerrado'
  },
  {
    id: '2',
    obra: 'CC Linares',
    numAccidente: 1,
    diasPerdidosEstimados: 79,
    fechaAccidente: new Date(2025, 9, 14),
    fechaControl: new Date(2025, 11, 31),
    diasPerdidosFinal: 79,
    tipoAccidente: 'Trabajo',
    empresa: 'SC AR Montajes',
    descripcion: 'Al realizar instalación de planchas de cubiertas, trabajador sufre caída de altura, controladas por SPDC.',
    trabajador: {
      rut: '16.713.543-0',
      nombre: 'Ramón Fabriciano Cuevas Rubilar',
      edad: 38,
      horario: '16:00hrs',
      dia: 'Martes',
      cargo: 'Maestro Montajista'
    },
    lineaMando: {
      supervisor: 'Fernando Rojas',
      pTerreno: 'Tito Fuentes',
      apr: 'Natalia Rojas',
      ado: 'Víctor Ardiles'
    },
    analisis: {
      calificacionPS: 'Grave',
      fuente: 'Izaje de EEMM',
      accion: 'posicionar manos bajo carga suspendida',
      condicion: 'falta de viento para dirigir carga'
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'En Investigación'
  },
  {
    id: '3',
    obra: 'Outlet La Calera',
    numAccidente: 1,
    diasPerdidosEstimados: 49,
    fechaAccidente: new Date(2025, 10, 13),
    fechaControl: new Date(2025, 11, 31),
    diasPerdidosFinal: 49,
    tipoAccidente: 'Trabajo',
    empresa: 'SC M.Acuña',
    descripcion: 'Trabajador en faena de izaje, sufre atrapamiento de su mano izquierda entre costaneras de EEMM.',
    trabajador: {
      rut: '9.941.496-0',
      nombre: 'Manuel Torrejon',
      edad: 61,
      horario: '16:00hrs',
      dia: 'Jueves',
      cargo: 'Rigger'
    },
    lineaMando: {
      supervisor: 'Fabricio Martínez',
      pTerreno: 'Jorge Fernández',
      apr: 'Karlos Acevedo',
      ado: 'Yerko Corvalán'
    },
    analisis: {
      calificacionPS: 'Importante',
      fuente: '',
      accion: '',
      condicion: ''
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Reportado'
  },
  {
    id: '4',
    obra: 'CC Linares',
    numAccidente: 1,
    diasPerdidosEstimados: 43,
    fechaAccidente: new Date(2025, 10, 19),
    fechaControl: new Date(2025, 11, 31),
    diasPerdidosFinal: 43,
    tipoAccidente: 'Trabajo',
    empresa: 'INARCO',
    descripcion: 'Trabajador atrapa su pie izquierdo en faena de descimbre con camión pluma.',
    trabajador: {
      rut: '17855083-7',
      nombre: 'Leonardo Luengo',
      edad: 34,
      horario: '11:30hrs',
      dia: 'Miércoles',
      cargo: 'Carpintero'
    },
    lineaMando: {
      supervisor: 'Jose Figueroa',
      pTerreno: 'Tito Fuentes',
      apr: 'Natalia Rojas',
      ado: 'Víctor Ardiles'
    },
    analisis: {
      calificacionPS: 'Grave',
      fuente: 'Moldaje',
      accion: 'Trabajador posiciona mano en línea de fuego',
      condicion: 'Espacio reducido'
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'En Investigación'
  },
  {
    id: '5',
    obra: 'TEGA',
    numAccidente: 1,
    diasPerdidosEstimados: 16,
    fechaAccidente: new Date(2025, 11, 16),
    fechaControl: new Date(2025, 11, 31),
    diasPerdidosFinal: 16,
    tipoAccidente: 'Trabajo',
    empresa: 'INARCO',
    descripcion: 'Trabajador golpeó su dedo pulgar izquierdo con un martillo al apuntalar una madera de 2X3.',
    trabajador: {
      rut: '17.160.636-5',
      nombre: 'Sebastian Antonio López Quilodrán',
      edad: 37,
      horario: '15:30hrs',
      dia: 'Martes',
      cargo: 'Carpintero'
    },
    lineaMando: {
      supervisor: 'Cristian Quezada',
      pTerreno: 'Pablo Rojas',
      apr: 'Tamara Vasquez',
      ado: 'Pablo Del Rio'
    },
    analisis: {
      calificacionPS: 'Leve',
      fuente: '',
      accion: '',
      condicion: ''
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Cerrado'
  },
  {
    id: '6',
    obra: 'CC Linares',
    numAccidente: 1,
    fechaAccidente: new Date(2025, 8, 1),
    fechaControl: new Date(2025, 8, 1),
    diasPerdidosFinal: 0,
    tipoAccidente: 'NEP',
    empresa: 'INARCO',
    descripcion: 'Sin antecedentes',
    trabajador: {
      rut: '19.407.410-7',
      nombre: 'JUAN IGNACIO RAMOS ORELLANA',
      edad: 30,
      horario: 'N/A',
      dia: 'Lunes',
      cargo: 'Pañolero'
    },
    lineaMando: {
      supervisor: 'Luis Robledo',
      pTerreno: 'Luis Robledo',
      apr: 'Luis Robledo',
      ado: 'Víctor Ardiles'
    },
    analisis: {
      calificacionPS: 'Leve',
      fuente: 'N/A',
      accion: 'N/A',
      condicion: 'N/A',
      maquina: 'N/A',
      equipo: 'N/A'
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Cerrado'
  },
  {
    id: '7',
    obra: 'NOVOLUCERO',
    numAccidente: 1,
    diasPerdidosEstimados: 3,
    fechaAccidente: new Date(2026, 0, 8),
    fechaControl: new Date(2026, 0, 10),
    diasPerdidosFinal: 3,
    tipoAccidente: 'Trabajo',
    empresa: 'SC ELYON',
    descripcion: 'Trabajador transita por un desnivel provocándole torcedura tobillo izquierdo.',
    trabajador: {
      rut: '19.895.791-7',
      nombre: 'Jorge Parra',
      edad: 30,
      horario: 'N/A',
      dia: 'Jueves',
      cargo: 'Jornal'
    },
    lineaMando: {
      supervisor: 'Jesus Borquez',
      pTerreno: 'Daniel Perez',
      apr: 'Luis Iturra',
      ado: 'Víctor Ardiles'
    },
    analisis: {
      calificacionPS: 'Importante',
      fuente: 'Moldaje',
      accion: 'Transitar por',
      condicion: 'Terreno irregular'
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Reportado'
  },
  {
    id: '8',
    obra: 'NOVOLUCERO',
    numAccidente: 1,
    fechaAccidente: new Date(2026, 0, 16),
    tipoAccidente: 'Trabajo',
    empresa: 'INARCO',
    descripcion: 'Trabajador al momento de trasladar barras de fierro, sufre caída a mismo nivel.',
    trabajador: {
      rut: '19.427.260-k',
      nombre: 'Augusto Miguele',
      edad: 30,
      horario: '18:40hrs',
      dia: 'Jueves',
      cargo: 'Maestro Moldajero'
    },
    lineaMando: {
      supervisor: 'Roberto Segovia',
      pTerreno: 'Sebastián Rocuant',
      apr: 'Luis Iturra',
      ado: 'Enrique Rojas'
    },
    analisis: {
      calificacionPS: 'Importante',
      fuente: '',
      accion: '',
      condicion: ''
    },
    gestionCambio: {
      causaRaiz: '',
      eliminacion: false,
      sustitucion: false,
      ingenieriaControl: false,
      administracion: false,
      epp: false
    },
    fechaCreacion: new Date(),
    estado: 'Reportado'
  }
];

// =============================================
// ESTADÍSTICAS MOCK
// =============================================

export const MOCK_ESTADISTICAS: EstadisticasAccidentes = {
  numeroAccidentes: 8,
  numeroDiasPerdidos: 444,
  porTipo: {
    comun: 0,
    fatal: 0,
    trabajo: 6
  },
  porOrganismo: {
    inarco: 4,
    sc: 4,
    total: 8
  },
  porDiasPerdidos: {
    stp: 2,
    ctp: 6,
    total: 8
  },
  porGravedad: {
    leve: 2,
    menor: 0,
    importante: 2,
    grave: 4,
    fatal: 0,
    total: 8
  },
  fechaAnalisis: new Date(2026, 0, 5),
  periodo: 'Enero - Diciembre 2025'
};
