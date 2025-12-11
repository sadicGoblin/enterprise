import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { FormEntranceService } from './services/form-entrance.service';
import { FormResponse, FormQuestion, FormValue } from './models/form.models';
import { TextFieldComponent } from './components/text-field/text-field.component';
import { SelectFieldComponent } from './components/select-field/select-field.component';
import { SelectParentFieldComponent } from './components/select-parent-field/select-parent-field.component';
import { MultipleChoiceFieldComponent } from './components/multiple-choice-field/multiple-choice-field.component';
import { PictureFieldComponent, PictureFile } from './components/picture-field/picture-field.component';

@Component({
  selector: 'app-form-entrance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TextFieldComponent,
    SelectFieldComponent,
    SelectParentFieldComponent,
    MultipleChoiceFieldComponent,
    PictureFieldComponent
  ],
  templateUrl: './form-entrance.component.html',
  styleUrls: ['./form-entrance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormEntranceComponent implements OnInit {
  // Estados de la UI
  isLoading = true;
  hasError = false;
  errorMessage = '';
  isSubmitting = false;

  // Datos del formulario
  formData: FormResponse | null = null;
  
  // Valores del formulario (respuestas)
  formValues: Map<string, any> = new Map();
  
  // Sub-parámetros dinámicos basados en selección padre (objeto para mejor change detection)
  dynamicSubParams: { [key: string]: FormValue[] } = {};
  
  // Archivos de imagen
  pictureFiles: Map<string, PictureFile[]> = new Map();
  
  // Preguntas ordenadas (cacheadas para evitar loop infinito de change detection)
  sortedQuestions: FormQuestion[] = [];

  // URL del bucket para subir imágenes
  private readonly BUCKET_URL = 'https://inarco-ssoma.favric.cl/bucket/storage';

  constructor(
    private formService: FormEntranceService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadForm();
  }

  /**
   * Carga el formulario desde la API
   */
  loadForm(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Por ahora usamos valores hardcodeados
    const caso = 'INS_STTMA_GRL';
    const idUsuario = 478;

    this.formService.getFormConfiguration(caso, idUsuario).subscribe({
      next: (response) => {
        console.log('Form loaded:', response);
        try {
          if (response.success && response.data) {
            this.formData = response.data;
            // Ordenar y cachear las preguntas una sola vez
            this.sortedQuestions = [...(this.formData.form.questions || [])].sort((a, b) => a.order - b.order);
            this.initializeFormValues();
            console.log('Form data set:', this.formData);
            console.log('Sorted questions:', this.sortedQuestions.length, 'items');
            
            // Debug: verificar select_parent con sub_params
            const selectParents = this.sortedQuestions.filter(q => q.type === 'select_parent');
            console.log('=== SELECT_PARENT QUESTIONS ===');
            selectParents.forEach(q => {
              console.log(`Question: ${q.id} (${q.name})`);
              console.log(`  - Values: ${q.values?.length || 0}`);
              console.log(`  - Sub_params: ${q.sub_params?.length || 0}`);
              if (q.sub_params) {
                console.log('  - Sub_params detail:', q.sub_params);
              }
            });
          } else {
            this.hasError = true;
            this.errorMessage = response.message || 'Error al cargar el formulario';
          }
        } catch (err) {
          console.error('Error processing form data:', err);
          this.hasError = true;
          this.errorMessage = 'Error al procesar los datos del formulario';
        }
        this.isLoading = false;
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (error) => {
        console.error('Error loading form:', error);
        this.hasError = true;
        this.errorMessage = 'No se pudo conectar con el servidor. Por favor, intente nuevamente.';
        this.isLoading = false;
        this.cdr.markForCheck(); // Trigger change detection
      }
    });
  }

  /**
   * Inicializa los valores del formulario con campos hidden
   */
  private initializeFormValues(): void {
    if (!this.formData?.form.questions) return;

    this.formData.form.questions.forEach(question => {
      if (question.type === 'hidden' && question.values.length > 0) {
        // Guardar valores de campos hidden automáticamente
        this.formValues.set(question.id, {
          value: question.values[0].value,
          text: question.values[0].text
        });
      }
    });
  }

  /**
   * Limpia todos los campos del formulario
   */
  resetForm(): void {
    console.log('=== LIMPIANDO FORMULARIO ===');
    
    // Limpiar valores del formulario
    this.formValues.clear();
    
    // Limpiar archivos de imágenes
    this.pictureFiles.clear();
    
    // Limpiar sub-parámetros dinámicos
    this.dynamicSubParams = {};
    
    // Re-inicializar valores hidden
    this.initializeFormValues();
    
    // Recargar el formulario para resetear los componentes hijos
    this.loadForm();
    
    console.log('Formulario limpiado');
  }

  /**
   * Maneja el cambio de valor en un campo
   */
  onFieldValueChange(event: { id: string; value: any; text?: string }): void {
    this.formValues.set(event.id, {
      value: event.value,
      text: event.text || event.value
    });
    console.log('Form values updated:', Object.fromEntries(this.formValues));
  }

  /**
   * Maneja el cambio de sub-parámetros cuando se selecciona un padre
   */
  onSubParamsChange(parentId: string, subParams: FormValue[]): void {
    console.log('=== onSubParamsChange ===');
    console.log('Parent ID:', parentId);
    console.log('Sub params received:', subParams);
    console.log('Sub params length:', subParams?.length || 0);
    
    // Crear nuevo objeto para forzar detección de cambios en OnPush
    this.dynamicSubParams = {
      ...this.dynamicSubParams,
      [parentId]: subParams || []
    };
    
    console.log('dynamicSubParams updated:', this.dynamicSubParams);
    console.log('Keys:', Object.keys(this.dynamicSubParams));
    
    // Forzar re-render de todo el componente
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio de valor del select hijo (generado automáticamente por select_parent con sub_params)
   */
  onChildValueChange(event: { parentId: string; value: string | number; text: string }): void {
    console.log('=== onChildValueChange ===');
    console.log('Parent ID:', event.parentId);
    console.log('Child value:', event.value);
    console.log('Child text:', event.text);
    
    // Guardar el valor del hijo con un ID único basado en el padre
    const childId = `${event.parentId}_child`;
    this.formValues.set(childId, {
      value: event.value,
      text: event.text
    });
    
    console.log('Saved child value with ID:', childId);
  }

  /**
   * TrackBy function para ngFor - evita re-renderizado innecesario
   */
  trackByQuestionId(index: number, question: FormQuestion): string {
    return question.id;
  }

  /**
   * Verifica si existe un valor para el padre especificado
   */
  hasParentValue(parentId: string | undefined): boolean {
    if (!parentId) return false;
    const value = this.formValues.get(parentId);
    return !!(value && value.value);
  }

  /**
   * Obtiene las opciones dinámicas para una pregunta que depende de otra
   */
  getDynamicOptionsForQuestion(question: FormQuestion): FormValue[] {
    if (!question.query_values) return question.values || [];
    
    const parentId = question.query_values.id;
    return this.dynamicSubParams[parentId] || [];
  }

  /**
   * Obtiene una pregunta select con sus opciones dinámicas actualizadas
   */
  getSelectQuestionWithDynamicOptions(question: FormQuestion): FormQuestion {
    if (!question.query_values) return question;
    
    const dynamicOptions = this.getDynamicOptionsForQuestion(question);
    return {
      ...question,
      values: dynamicOptions
    };
  }

  /**
   * Maneja el cambio en campos de selección múltiple
   */
  onMultipleChoiceChange(event: { id: string; values: (string | number)[]; texts: string[] }): void {
    this.formValues.set(event.id, {
      value: event.values,
      text: event.texts.join(', ')
    });
    console.log('Multiple choice updated:', event);
  }

  /**
   * Maneja el cambio en campos de imagen
   */
  onPictureChange(event: { id: string; files: PictureFile[] }): void {
    this.pictureFiles.set(event.id, event.files);
    this.formValues.set(event.id, {
      value: event.files.map(f => f.name),
      text: `${event.files.length} imagen(es)`
    });
    console.log('Pictures updated:', event);
  }

  /**
   * Valida si el formulario está completo
   */
  isFormValid(): boolean {
    if (!this.formData?.form.questions) return false;

    for (const question of this.formData.form.questions) {
      if (question.required) {
        const value = this.formValues.get(question.id);
        
        if (!value || !value.value) {
          return false;
        }

        // Validación especial para imágenes
        if (question.type === 'picture' && question.allow_pictures) {
          const pictures = this.pictureFiles.get(question.id) || [];
          if (pictures.length < question.allow_pictures.min) {
            return false;
          }
        }

        // Validación para selección múltiple
        if (question.type === 'multiple_choice' && Array.isArray(value.value)) {
          if (value.value.length === 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Envía el formulario
   */
  submitForm(): void {
    if (!this.isFormValid()) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting = true;

    // Primero subir las imágenes al bucket
    this.uploadAllImages().subscribe({
      next: (uploadedUrls) => {
        console.log('=== IMÁGENES SUBIDAS ===');
        console.log('URLs obtenidas:', uploadedUrls);
        
        // Actualizar los valores de las imágenes con las URLs del bucket
        uploadedUrls.forEach((urls, questionId) => {
          if (urls.length > 0) {
            this.formValues.set(questionId, {
              value: urls.map(u => u.url),
              text: urls.map(u => u.url).join(', ')
            });
          }
        });

        // Preparar los datos para enviar
        const formData = this.prepareFormData();
        console.log('=== PAYLOAD A ENVIAR ===');
        console.log(JSON.stringify(formData, null, 2));

        // Enviar a la API
        this.formService.submitForm(formData).subscribe({
          next: (response) => {
            console.log('=== RESPUESTA DEL SERVIDOR ===');
            console.log(response);
            this.isSubmitting = false;
            
            if (response.success || response.codigo === 0) {
              this.snackBar.open('Formulario enviado correctamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              // Limpiar el formulario después de envío exitoso
              this.resetForm();
            } else {
              this.snackBar.open(response.message || response.glosa || 'Error al enviar el formulario', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error al enviar formulario:', error);
            this.isSubmitting = false;
            this.snackBar.open('Error de conexión. Intente nuevamente.', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.cdr.markForCheck();
          }
        });
      },
      error: (error) => {
        console.error('Error al subir imágenes:', error);
        this.isSubmitting = false;
        this.snackBar.open('Error al subir las imágenes. Intente nuevamente.', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Sube todas las imágenes al bucket y retorna un Map con las URLs
   */
  private uploadAllImages(): Observable<Map<string, { url: string }[]>> {
    const uploadTasks: { questionId: string; file: File; index: number }[] = [];
    
    // Recopilar todos los archivos a subir
    this.pictureFiles.forEach((files, questionId) => {
      files.forEach((pictureFile, index) => {
        if (pictureFile.file) {
          uploadTasks.push({ questionId, file: pictureFile.file, index });
        }
      });
    });

    // Si no hay imágenes, retornar Map vacío
    if (uploadTasks.length === 0) {
      return of(new Map());
    }

    console.log(`Subiendo ${uploadTasks.length} imagen(es) al bucket...`);

    // Crear observables para cada subida
    const uploadObservables = uploadTasks.map(task => 
      this.uploadFileToStorage(task.file).pipe(
        map(response => ({
          questionId: task.questionId,
          index: task.index,
          url: response.url
        })),
        catchError(error => {
          console.error(`Error subiendo imagen para ${task.questionId}:`, error);
          return of({ questionId: task.questionId, index: task.index, url: '' });
        })
      )
    );

    // Ejecutar todas las subidas y agrupar por questionId
    return forkJoin(uploadObservables).pipe(
      map(results => {
        const urlMap = new Map<string, { url: string }[]>();
        
        results.forEach(result => {
          if (result.url) {
            const existing = urlMap.get(result.questionId) || [];
            existing.push({ url: result.url });
            urlMap.set(result.questionId, existing);
          }
        });
        
        return urlMap;
      })
    );
  }

  /**
   * Sube un archivo individual al bucket de storage
   */
  private uploadFileToStorage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string }>(this.BUCKET_URL, formData);
  }

  /**
   * Prepara los datos del formulario para enviar
   * Mantiene la estructura original del JSON pero con las respuestas del usuario
   */
  private prepareFormData(): any {
    if (!this.formData) return null;

    // Procesar cada pregunta manteniendo la estructura original
    const processedQuestions = this.formData.form.questions.map(question => {
      const userAnswer = this.formValues.get(question.id);
      
      // Clonar la pregunta para no modificar el original
      const processedQuestion: any = {
        id: question.id,
        name: question.name,
        type: question.type,
        required: question.required,
        allow_comment: question.allow_comment,
        order: question.order,
        read_only: question.read_only
      };

      // Incluir query_values si existe
      if (question.query_values) {
        processedQuestion.query_values = question.query_values;
      }

      // Incluir allow_pictures si existe
      if (question.allow_pictures) {
        processedQuestion.allow_pictures = question.allow_pictures;
      }

      // Procesar values según el tipo de pregunta y la respuesta del usuario
      if (userAnswer) {
        // Para imágenes (picture), crear array con formato especial
        if (question.type === 'picture' && Array.isArray(userAnswer.value)) {
          processedQuestion.values = userAnswer.value.map((url: string) => ({
            value: url,
            text: `Imagen: ${url}`
          }));
        }
        // Para multiple_choice, crear un array de values
        else if (question.type === 'multiple_choice' && Array.isArray(userAnswer.value)) {
          processedQuestion.values = userAnswer.value.map((val: any, index: number) => ({
            value: val,
            text: userAnswer.text.split(', ')[index] || val
          }));
        } else {
          // Para otros tipos, un solo value
          processedQuestion.values = [{
            value: userAnswer.value,
            text: userAnswer.text
          }];
        }
      } else {
        // Si no hay respuesta, values vacío
        processedQuestion.values = [];
      }

      // Para select_parent, procesar sub_params
      if (question.type === 'select_parent' && question.sub_params && userAnswer) {
        // Filtrar solo el sub_param que corresponde a la opción seleccionada
        const selectedOpt = String(userAnswer.value);
        const matchingSubParam = question.sub_params.find(sp => sp.opt === selectedOpt);
        
        if (matchingSubParam) {
          // Buscar el valor del select hijo automático (generado por el componente)
          const childId = `${question.id}_child`;
          const childAnswer = this.formValues.get(childId);
          
          if (childAnswer) {
            // Filtrar solo el value seleccionado en el hijo
            const selectedChildValue = String(childAnswer.value);
            const matchingChildValue = matchingSubParam.values.find(
              v => String(v.value) === selectedChildValue
            );
            
            processedQuestion.sub_params = [{
              opt: selectedOpt,
              values: matchingChildValue ? [matchingChildValue] : []
            }];
          } else {
            // Si no hay respuesta del hijo, incluir todas las opciones (o array vacío)
            processedQuestion.sub_params = [{
              opt: selectedOpt,
              values: []
            }];
          }
        } else {
          processedQuestion.sub_params = [];
        }
      }

      return processedQuestion;
    });

    // Construir el payload final con la estructura completa
    const payload = {
      data: {
        id: this.formData.id,
        name: this.formData.name,
        start_at: this.formData.start_at,
        end_at: this.formData.end_at,
        instructions: this.formData.instructions,
        form_read_only: this.formData.form_read_only,
        button_action: this.formData.button_action,
        form: {
          form_id: this.formData.form.form_id,
          version: this.formData.form.version,
          read_only: this.formData.form.read_only,
          questions: processedQuestions
        }
      },
      // submitted_at: new Date().toISOString()
    };

    // Imprimir el payload antes de enviar
    console.log('=== PAYLOAD A ENVIAR ===');
    console.log(JSON.stringify(payload, null, 2));

    return payload;
  }
}
