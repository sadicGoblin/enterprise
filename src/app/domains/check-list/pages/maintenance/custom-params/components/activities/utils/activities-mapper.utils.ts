import { ActivityItem } from '../models/activity.model';
import { FrequencyOption, CategoryOption, ParameterOption, DocumentOption, ReferenceData } from '../models/reference-data.model';

/**
 * Clase utilidad con métodos estáticos para mapeo de actividades
 */
export class ActivitiesMapper {
  
  /**
   * Mapea actividades con nombres legibles
   */
  static mapActivitiesWithNames(activities: any[], referenceData: ReferenceData): ActivityItem[] {
    if (!activities || !Array.isArray(activities)) {
      console.warn('❌ No hay actividades para mapear o no es un array');
      return [];
    }

    console.log('🔄 Iniciando mapeo de', activities.length, 'actividades');
    console.log('📊 Datos de referencia disponibles:', {
      frecuencia: referenceData.frequencyOptions?.length || 0,
      categoria: referenceData.categoryOptions?.length || 0,
      parametro: referenceData.parameterOptions?.length || 0,
      documento: referenceData.documentOptions?.length || 0
    });

    return activities.map((activity, index) => {
      console.log(`\n🔍 Mapeando actividad ${index + 1}:`, {
        id: activity.idActividades,
        nombre: activity.nombre,
        idPeriocidad: activity.idPeriocidad,
        idCategoriaActividad: activity.idCategoriaActividad,
        idParametroAsociado: activity.idParametroAsociado,
        idBiblioteca: activity.idBiblioteca
      });
      
      // Mapear nombres usando los IDs
      const frequencyName = this.getFrequencyNameById(activity.idPeriocidad, referenceData.frequencyOptions);
      const categoryName = this.getCategoryNameById(activity.idCategoriaActividad, referenceData.categoryOptions);
      const parameterName = this.getParameterNameById(activity.idParametroAsociado, referenceData.parameterOptions);
      const documentName = this.getDocumentNameById(activity.idBiblioteca, referenceData.documentOptions);

      console.log('✅ Nombres resueltos:', {
        frequencyName,
        categoryName,
        parameterName,
        documentName
      });

      const mappedActivity = {
        id: activity.idActividades || activity.id,
        code: activity.codigo || activity.code,
        name: activity.nombre || activity.name,
        frequency: activity.idPeriocidad, // Mantener el ID original
        category: activity.idCategoriaActividad, // Mantener el ID original
        parameter: activity.idParametroAsociado, // Mantener el ID original
        document: activity.idBiblioteca, // Mantener el ID original
        idAmbito: activity.idAmbito,
        idFrequency: activity.idPeriocidad,
        idCategory: activity.idCategoriaActividad,
        idParameter: activity.idParametroAsociado,
        idDocument: activity.idBiblioteca,
        // Nombres resueltos para mostrar en la tabla
        frequencyName,
        categoryName,
        parameterName,
        documentName
      };

      return mappedActivity;
    });
  }

  /**
   * Obtiene el nombre de la frecuencia por su ID
   */
  static getFrequencyNameById(id: number | string | null, options: FrequencyOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging
    console.log(`⏱️ Buscando frecuencia con ID: ${id} en ${options?.length || 0} opciones`);
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de frecuencia disponibles');
      return 'Desconocido';
    }

    // Buscar por las propiedades más comunes en frecuencias
    const optionById = options.find(opt => 
      opt['IdSubParam']?.toString() === id.toString() || 
      opt['IdDet']?.toString() === id.toString() || 
      opt['id']?.toString() === id.toString() || 
      opt['value']?.toString() === id.toString()
    );
    
    if (optionById) {
      const nombre = optionById['Nombre'] || optionById['nombre'] || optionById['label'] || optionById['glosa'] || 'Desconocido';
      console.log(`✓ Nombre de frecuencia encontrado: ${nombre}`);
      return nombre;
    }
    
    console.warn(`❌ No se encontró frecuencia para ID: ${id}`);
    return 'Desconocido';
  }

  /**
   * Obtiene el nombre de la categoría por su ID
   */
  static getCategoryNameById(id: number | string | null, options: CategoryOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging
    console.log(`⏱️ Buscando categoría con ID: ${id} en ${options?.length || 0} opciones`);
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de categoría disponibles');
      return 'Desconocido';
    }

    // Buscar por las propiedades más comunes en categorías
    const optionById = options.find(opt => 
      opt['IdSubParam']?.toString() === id.toString() || 
      opt['IdDet']?.toString() === id.toString() || 
      opt['id']?.toString() === id.toString() || 
      opt['value']?.toString() === id.toString()
    );
    
    if (optionById) {
      const nombre = optionById['Nombre'] || optionById['nombre'] || optionById['label'] || optionById['glosa'] || 'Desconocido';
      console.log(`✓ Nombre de categoría encontrado: ${nombre}`);
      return nombre;
    }
    
    console.warn(`❌ No se encontró categoría para ID: ${id}`);
    return 'Desconocido';
  }

  /**
   * Obtiene el nombre del parámetro por su ID
   */
  static getParameterNameById(id: number | string | null, options: ParameterOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging
    console.log(`⏱️ Buscando parámetro con ID: ${id} en ${options?.length || 0} opciones`);
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de parámetro disponibles');
      return 'Desconocido';
    }

    // Buscar por las propiedades más comunes en parámetros
    const optionById = options.find(opt => 
      opt['IdSubParam']?.toString() === id.toString() || 
      opt['IdDet']?.toString() === id.toString() || 
      opt['id']?.toString() === id.toString() || 
      opt['value']?.toString() === id.toString()
    );
    
    if (optionById) {
      const nombre = optionById['Nombre'] || optionById['nombre'] || optionById['label'] || optionById['glosa'] || 'Desconocido';
      console.log(`✓ Nombre de parámetro encontrado: ${nombre}`);
      return nombre;
    }
    
    console.warn(`❌ No se encontró parámetro para ID: ${id}`);
    return 'Desconocido';
  }

  /**
   * Obtiene el nombre del documento por su ID
   */
  static getDocumentNameById(id: number | string | null, options: DocumentOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging
    console.log(`⏱️ Buscando documento con ID: ${id} en ${options?.length || 0} opciones`);
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de documento disponibles');
      return 'Desconocido';
    }

    // Primero intentamos buscar por IdDocumento (más común en documentos)
    const optionById = options.find(opt => 
      opt['IdDocumento']?.toString() === id.toString() || 
      opt['id']?.toString() === id.toString() || 
      opt['value']?.toString() === id.toString()
    );
    
    if (optionById) {
      const nombre = optionById['nombre'] || optionById['Nombre'] || optionById['label'] || 'Desconocido';
      console.log(`✓ Nombre de documento encontrado: ${nombre}`);
      return nombre;
    }
    
    console.warn(`❌ No se encontró documento para ID: ${id}`);
    return 'Desconocido';
  }

  /**
   * Normaliza las propiedades de los options para asegurar compatibilidad con el custom-select
   */
  static normalizeOptions(options: any[], valueKey: string, labelKey: string): any[] {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    return options.map(option => {
      // Asegurar que el objeto tenga las propiedades esperadas
      return {
        ...option,
        id: option[valueKey] || option.id,
        nombre: option[labelKey] || option.nombre || option.Nombre
      };
    });
  }
}