import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit, Inject } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { IncidentFormComponent } from './components/incident-form/incident-form.component';
import { IncidentOriginSelectionComponent } from './components/incident-origin-selection/incident-origin-selection.component';
import { IncidentValidationComponent } from './components/incident-validation/incident-validation.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-incident-report-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatDividerModule,
    MatButtonModule,
    MatButton,
    IncidentFormComponent,
    IncidentOriginSelectionComponent,
    IncidentValidationComponent,
    MatSnackBarModule,
  ],
  templateUrl: './incident-report-modal.component.html',
  styleUrls: ['./incident-report-modal.component.scss'],
})
export class IncidentReportModalComponent implements OnInit {
  // Referencias a los subcomponentes para acceder a sus métodos
  @ViewChild(IncidentFormComponent) incidentForm!: IncidentFormComponent;
  @ViewChild(IncidentOriginSelectionComponent)
  originSelection!: IncidentOriginSelectionComponent;
  @ViewChild(IncidentValidationComponent)
  validationForm!: IncidentValidationComponent;

  // Variable para controlar mensajes de error
  validationErrors: string[] = [];
  showValidationErrors = false;
  isSaving = false;

  // Datos del incidente
  incidentData: any = {};

  // Obtener los usuarios disponibles para buscar por ID
  private personasMap: { [key: string]: string } = {};

  // Mapeos para convertir strings a IDs numéricos
  private gravedadMap: Record<string, number> = {
    alto: 1,
    medio: 2,
    leve: 3,
  };

  private gravedadTextoMap: Record<string, string> = {
    alto: 'ALTO',
    medio: 'MEDIO',
    leve: 'LEVE',
  };

  private ameritaMap: Record<string, number> = {
    investigacion: 1,
    seguimiento: 2,
  };

  private ameritaTextoMap: Record<string, string> = {
    investigacion: 'Investigación',
    seguimiento: 'Seguimiento',
  };

  private tipoIncidenteMap: Record<string, number> = {
    cuasi_acc: 1,
    acc_ctp: 2,
    dano_material: 3,
  };

  private tipoIncidenteTextoMap: Record<string, string> = {
    cuasi_acc: 'CUASI ACC',
    acc_ctp: 'ACC CTP',
    dano_material: 'DAÑO MATERIAL',
  };

  // Mapeos para categorías de origen
  private categoriaTextosMap: Record<string, Record<number, string>> = {
    A_TRABAJADORES: {
      35: 'FALTA DE CONOCIMIENTO, ACTITUD DESPREOCUPADA',
      62: 'ACTO INSEGURO, DISTRACCIÓN',
    },
    B_EQUIPOS_FIJOS: {
      36: 'MAL ESTADO, NO CUMPLE CON NORMAS',
      69: 'FALLA MECÁNICA, SIN MANTENIMIENTO',
    },
    C_EDIFICIOS: {
      37: 'FALTA DE ASEO, NO CUMPLE CON ESTÁNDAR',
      74: 'DEFECTOS ESTRUCTURALES, MALA ILUMINACIÓN',
    },
    D_VEHICULOS: {
      38: 'TRÁNSITO, SIN INSPECCIÓN',
      80: 'EXCESO VELOCIDAD, FALLA MECÁNICA',
    },
    E_AMBIENTALES: {
      39: 'AIRE, SUELO',
      83: 'CONTAMINACIÓN, DERRAMES',
    },
  };

  private interesadosTextoMap: Record<number, string> = {
    40: 'CLIENTES',
    86: 'COMUNIDAD',
  };

  constructor(
    private proxyService: ProxyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Inicializar datos si se recibieron del diálogo
    if (this.data && this.data.incidentData) {
      this.incidentData = this.data.incidentData;
    }
  }

  saveReport() {
    // Reiniciar validación
    this.validationErrors = [];
    this.showValidationErrors = false;

    // Validar cada sección del formulario
    if (!this.validateIncidentForm()) {
      this.validationErrors.push(
        'Complete todos los campos requeridos en la sección "Datos de Reporte"'
      );
    }

    if (!this.validateOriginSelection()) {
      this.validationErrors.push(
        'Seleccione el origen del incidente en la sección "Origen"'
      );
    }

    if (!this.validateCommunication()) {
      this.validationErrors.push(
        'Complete la información de comunicación en la sección "Validación"'
      );
    }

    // Mostrar errores si existen
    if (this.validationErrors.length > 0) {
      this.showValidationErrors = true;
      return;
    }

    // Si todo está validado, proceder con el guardado
    this.isSaving = true;

    try {
      // Recopilar datos de todos los formularios (con verificaciones de null)
      const formData = this.incidentForm?.getFormData() || {};
      const originData = this.originSelection?.getOriginData() || {
        categorias: {
          A_TRABAJADORES: [],
          B_EQUIPOS_FIJOS: [],
          C_EDIFICIOS: [],
          D_VEHICULOS: [],
          E_AMBIENTALES: [],
        },
        accion: {},
        partesInteresadas: null,
      };
      const validationData = this.validationForm?.getValidationData() || {
        comunicadoPor: null,
        comunicadoA: null,
      };

      // Asegurarnos de que todas las propiedades de categorias existan
      if (!originData.categorias) {
        originData.categorias = {
          A_TRABAJADORES: [],
          B_EQUIPOS_FIJOS: [],
          C_EDIFICIOS: [],
          D_VEHICULOS: [],
          E_AMBIENTALES: [],
        };
      }

      // Obtener la fecha actual para el reporte
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();

      // Extraer el año y mes actual para el período (AAAAMM)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const periodo = year * 100 + month; // Ejemplo: 202507 para Julio 2025

      // Crear el objeto de datos para enviar al backend
      console.log('formData', formData);
      console.log('originData', originData);
      console.log('validationData', validationData);

      // Extraer valores con mapeos para tipos correctos
      const responsableId = this.extractValue(
        formData.responsableArea || null,
        478
      );
      const responsableNombre =
        this.personasMap[String(responsableId)] || 'FELIPE GALLARDO';

      // Potencial de gravedad (de string a ID numérico)
      const potencialGravedadKey =
        (formData.potencialGravedad as string) || 'leve';
      const potencialGravedadId = this.gravedadMap[potencialGravedadKey] || 3;
      const potencialGravedadTxt =
        this.gravedadTextoMap[potencialGravedadKey] || 'LEVE';

      // Amerita (de string a ID numérico)
      const ameritaKey = (formData.amerita as string) || 'investigacion';
      const ameritaId = this.ameritaMap[ameritaKey] || 1;
      const ameritaTxt = this.ameritaTextoMap[ameritaKey] || 'Investigación';

      // Tipo de incidente (de string a ID numérico)
      const tipoIncidenteKey =
        (formData.tipoIncidente as string) || 'dano_material';
      const tipoIncidenteId = this.tipoIncidenteMap[tipoIncidenteKey] || 3;
      const tipoIncidenteTxt =
        this.tipoIncidenteTextoMap[tipoIncidenteKey] || 'DAÑO MATERIAL';

      // Usar valores fijos para los IDs de orígenes
      // Y usar SOLO los textos exactos seleccionados por el usuario (sin valores predeterminados)
      const trabajadoresId = 35; // ID FIJO
      const trabajadoresTxt =
        originData.categoriaTextos?.A_TRABAJADORES &&
        originData.categoriaTextos.A_TRABAJADORES.length > 0
          ? originData.categoriaTextos.A_TRABAJADORES.join(', ')
          : '';

      const equiposFijosId = 36; // ID FIJO
      const equiposFijosTxt =
        originData.categoriaTextos?.B_EQUIPOS_FIJOS &&
        originData.categoriaTextos.B_EQUIPOS_FIJOS.length > 0
          ? originData.categoriaTextos.B_EQUIPOS_FIJOS.join(', ')
          : '';

      const edificiosId = 37; // ID FIJO
      const edificiosTxt =
        originData.categoriaTextos?.C_EDIFICIOS &&
        originData.categoriaTextos.C_EDIFICIOS.length > 0
          ? originData.categoriaTextos.C_EDIFICIOS.join(', ')
          : '';

      const vehiculosId = 38; // ID FIJO
      const vehiculosTxt =
        originData.categoriaTextos?.D_VEHICULOS &&
        originData.categoriaTextos.D_VEHICULOS.length > 0
          ? originData.categoriaTextos.D_VEHICULOS.join(', ')
          : '';

      const ambientalesId = 39; // ID FIJO
      const ambientalesTxt =
        originData.categoriaTextos?.E_AMBIENTALES &&
        originData.categoriaTextos.E_AMBIENTALES.length > 0
          ? originData.categoriaTextos.E_AMBIENTALES.join(', ')
          : '';

      // Partes interesadas (ID fijo = 40)
      const interesadosId = 40; // ID FIJO
      // Solo usamos el texto seleccionado por el usuario, sin valores predeterminados
      const interesadosTxt = originData.partesInteresadasTexto || '';

      // ID del reportador
      const idReportadoPor =
        typeof validationData.comunicadoPor === 'string'
          ? parseInt(validationData.comunicadoPor, 10)
          : validationData.comunicadoPor || 147;

      const requestData = {
        caso: 'Crea',
        idReporteIncidente: 0,
        idControl: -1,
        periodo: periodo,
        dia: 0,
        idResponsable: responsableId,
        Responsable: responsableNombre,
        fecha: formattedDate,
        potencialGravedad: potencialGravedadId,
        potencialGravedadTxt: potencialGravedadTxt,
        amerita: ameritaId,
        ameritaTxt: ameritaTxt,
        situacionObservada:
          formData.situacionObservada || 'SITUACION OBSERVADA',
        tipoIncidente: tipoIncidenteId,
        tipoIncidenteTxt: tipoIncidenteTxt,

        // Datos de origen
        originadoPorTrabajadores: trabajadoresId,
        originadoPorTrabajadoresTxt: trabajadoresTxt,

        originadoPorEquiposFijos: equiposFijosId,
        originadoPorEquiposFijosTxt: equiposFijosTxt,

        originadoPorEdificios: edificiosId,
        originadoPorEdificiosTxt: edificiosTxt,

        originadoPorVehiculos: vehiculosId,
        originadoPorVehiculosTxt: vehiculosTxt,

        originadoPorAmbientales: ambientalesId,
        originadoPorAmbientalesTxt: ambientalesTxt,

        // Datos de partes interesadas
        interesadosAfectados: interesadosId,
        interesadosAfectadosTxt: interesadosTxt,

        // Datos de acción a realizar
        accionRealizar: 1, // Valor fijo como número
        accionRealizarTxt: 'Observar', // Texto fijo según el tipo de acción
        descripcionAccionRealizar:
          originData.accion?.descripcion || 'DESCRIPCION DE LA ACCION',

        // Datos de validación
        idReportadoPor: idReportadoPor,
        // Usar el nombre directamente o caer al valor predeterminado
        reportadoPor:
          (validationData as any).comunicadoPorTexto ||
          this.getPersonaLabelById(validationData.comunicadoPor) ||
          'SEBASTIAN LUNA',
        // Usar el array de nombres si existe, de lo contrario intentar obtener los nombres por ID
        comunicadoA:
          (validationData as any).comunicadoATextos &&
          Array.isArray((validationData as any).comunicadoATextos) &&
          (validationData as any).comunicadoATextos.length > 0
            ? (validationData as any).comunicadoATextos.join(', ')
            : // Fallback al método anterior
            Array.isArray(validationData.comunicadoA) &&
              validationData.comunicadoA.length > 0
            ? validationData.comunicadoA
                .map((id) => this.getPersonaLabelById(id) || '')
                .filter((name) => !!name)
                .join(', ')
            : '',
      };

      // Llamar a la API para guardar el reporte
      console.log('Datos del reporte de incidente:');
      console.log(JSON.stringify(requestData, null, 2));

      // Realizar la llamada a la API con los datos del reporte
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirmar actualización',
          message: `¿Está seguro que desea crear el reporte de incidente?`,
          confirmText: 'Crear',
          cancelText: 'Cancelar',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.proxyService
          .post('/ws/ReporteIncidenteSvcImpl.php', requestData)
          .subscribe({
            next: (response) => {
              this.isSaving = false;
              console.log('Respuesta de la API:', response);
              this.snackBar.open('Reporte de incidente creado exitosamente', 'Cerrar', {
                duration: 5000,
                panelClass: ['success-snackbar'],
              });
            },
            error: (error) => {
              this.isSaving = false;
              console.error('Error al enviar el reporte:', error);
            },
          });
        } else {
          this.isSaving = false;
        }
      });

    } catch (error) {
      this.snackBar.open('Error al generar datos del reporte', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      console.error('Error al generar datos del reporte:', error);
      this.isSaving = false;
    }
  }

  /**
   * Valida que el formulario principal de incidente esté completo
   */
  validateIncidentForm(): boolean {
    if (!this.incidentForm) return false;
    return this.incidentForm.isFormValid();
  }

  /**
   * Valida que se haya seleccionado un origen para el incidente
   */
  validateOriginSelection(): boolean {
    if (!this.originSelection) return false;
    return this.originSelection.isFormValid();
  }

  /**
   * Valida que el formulario de comunicación esté completo
   */
  validateCommunication(): boolean {
    if (!this.validationForm) return false;
    const validationData = this.validationForm.getValidationData();
    return validationData !== null;
  }

  /**
   * Obtiene el nombre de la persona según su ID
   * @param id ID de la persona
   * @returns Nombre de la persona o un valor por defecto
   */
  private getPersonaLabelById(
    id: string | number | null | undefined
  ): string | null {
    if (id === null || id === undefined) return null;
    const key = typeof id === 'number' ? String(id) : id;
    return this.personasMap[key] || null;
  }

  /**
   * Obtiene el texto descriptivo para una categoría y su ID
   * @param categoria Clave de la categoría
   * @param id ID del elemento seleccionado
   */
  private getCategoriaTexto(categoria: string, id: number): string {
    // Obtenemos los valores por defecto según la categoría
    const defaultValues: Record<string, string> = {
      A_TRABAJADORES: 'FALTA DE CONOCIMIENTO, ACTITUD DESPREOCUPADA',
      B_EQUIPOS_FIJOS: 'MAL ESTADO, NO CUMPLE CON NORMAS',
      C_EDIFICIOS: 'FALTA DE ASEO, NO CUMPLE CON ESTÁNDAR',
      D_VEHICULOS: 'TRÁNSITO, SIN INSPECCIÓN',
      E_AMBIENTALES: 'AIRE, SUELO',
    };

    // Si no hay categoría o ID válidos
    if (!categoria || !id) {
      return defaultValues[categoria] || 'NO ESPECIFICADO';
    }

    // Mapa con más descripciones de textos
    const textosCategorias: Record<string, Record<number, string>> = {
      A_TRABAJADORES: {
        ...this.categoriaTextosMap['A_TRABAJADORES'],
        62: 'ACTO INSEGURO, DISTRACCIÓN',
        63: 'COMPORTAMIENTO TEMERARIO, FALTA EXPERIENCIA',
      },
      B_EQUIPOS_FIJOS: {
        ...this.categoriaTextosMap['B_EQUIPOS_FIJOS'],
        70: 'SIN MANTENIMIENTO, OPERACIÓN INCORRECTA',
      },
      C_EDIFICIOS: {
        ...this.categoriaTextosMap['C_EDIFICIOS'],
        74: 'DEFECTOS ESTRUCTURALES, MALA ILUMINACIÓN',
      },
      D_VEHICULOS: {
        ...this.categoriaTextosMap['D_VEHICULOS'],
        81: 'CONDUCCIÓN PELIGROSA, VEHÍCULO INADECUADO',
      },
      E_AMBIENTALES: {
        ...this.categoriaTextosMap['E_AMBIENTALES'],
        83: 'CONTAMINACIÓN, DERRAMES',
      },
    };

    // Si existe un texto específico para este ID, úsalo
    if (textosCategorias[categoria] && textosCategorias[categoria][id]) {
      return textosCategorias[categoria][id];
    }

    // Si no existe un texto específico, usa el valor por defecto o el ID
    return defaultValues[categoria] || `OPCIÓN ${id}`;
  }

  // El método getAllCategoryTexts ha sido eliminado, ahora usamos directamente los textos seleccionados por el usuario

  /**
   * Extrae el valor de un objeto de opción o devuelve un valor por defecto
   * Asegura que el valor retornado sea un número, no un string
   * @param option Objeto de opción (puede ser un objeto con value o un valor primitivo)
   * @param defaultValue Valor por defecto si no se encuentra
   */
  extractValue(option: any, defaultValue: any): number {
    if (!option) return defaultValue;
    let value;
    if (typeof option === 'object' && option !== null && 'value' in option) {
      value = option.value;
    } else {
      value = option || defaultValue;
    }
    // Asegurar que se devuelve un número, no un string
    return typeof value === 'string' ? parseInt(value, 10) : value;
  }

  /**
   * Extrae la etiqueta de un objeto de opción o devuelve un valor por defecto
   * @param option Objeto de opción (puede ser un objeto con label o un valor primitivo)
   * @param defaultLabel Etiqueta por defecto si no se encuentra
   */
  extractLabel(option: any, defaultLabel: string): string {
    if (!option) return defaultLabel;
    if (typeof option === 'object' && option !== null && 'label' in option) {
      return option.label || defaultLabel;
    }
    return String(option) || defaultLabel;
  }

  /**
   * Extrae el valor del primer elemento de un array o devuelve un valor por defecto
   * Asegura que el valor retornado sea un número, no un string
   * @param options Array de opciones
   * @param defaultValue Valor por defecto si no se encuentra
   */
  extractFirstValue(
    options: any[] | null | undefined,
    defaultValue: any
  ): number {
    if (!options || !Array.isArray(options) || options.length === 0)
      return defaultValue;

    let value;
    const firstOption = options[0];
    if (
      typeof firstOption === 'object' &&
      firstOption !== null &&
      'value' in firstOption
    ) {
      value = firstOption.value;
    } else {
      value = firstOption || defaultValue;
    }

    // Asegurar que se devuelve un número, no un string
    return typeof value === 'string' ? parseInt(value, 10) : value;
  }

  /**
   * Extrae la etiqueta del primer elemento de un array o devuelve un valor por defecto
   * @param options Array de opciones
   * @param defaultLabel Etiqueta por defecto si no se encuentra
   */
  extractFirstLabel(
    options: any[] | null | undefined,
    defaultLabel: string
  ): string {
    if (!options || !Array.isArray(options) || options.length === 0)
      return defaultLabel;

    // Intentamos obtener la etiqueta, no el ID
    const firstOption = options[0];
    if (
      typeof firstOption === 'object' &&
      firstOption !== null &&
      'label' in firstOption
    ) {
      return firstOption.label || defaultLabel;
    }
    return String(firstOption) || defaultLabel;
  }
}
