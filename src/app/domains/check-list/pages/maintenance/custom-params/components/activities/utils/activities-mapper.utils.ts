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
      return [];
    }

    return activities.map(activity => {
      console.log('Mapeando actividad:', activity);
      // Usamos las propiedades exactamente como vienen de la API
      const frequencyName = this.getFrequencyNameById(activity.idPeriocidad, referenceData.frequencyOptions);
      const categoryName = this.getCategoryNameById(activity.idCategoriaActividad, referenceData.categoryOptions);
      const parameterName = this.getParameterNameById(activity.idParametroAsociado, referenceData.parameterOptions);
      const documentName = this.getDocumentNameById(activity.idBiblioteca, referenceData.documentOptions);

      return {
        ...activity,
        frequencyName,
        categoryName,
        parameterName,
        documentName
      };
    });
  }

  /**
   * Obtiene el nombre de la frecuencia por su ID
   */
  static getFrequencyNameById(id: number | string | null, options: FrequencyOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging: imprimir un slice de las opciones para evitar logs demasiado grandes
    const optionsSlice = options.slice(0, 3);
    console.log(`⏱️ Buscando frecuencia con ID: ${id} en ${options.length} opciones.`);
    console.log('Muestra de opciones disponibles:', JSON.stringify(optionsSlice));
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de frecuencia disponibles para mapear');
      return 'Desconocido';
    }
    
    // Primero intentamos buscar por la propiedad 'value' (la que usa el CustomSelectComponent)
    const optionByValue = options.find(opt => {
      // Si es un objeto SelectOption como los que crea CustomSelectComponent
      if (typeof opt === 'object' && opt !== null) {
        // Si tiene una propiedad 'value'
        if ('value' in opt && opt['value']?.toString() === id.toString()) {
          console.log(`✓ Coincidencia encontrada por prop 'value':`, opt);
          return true;
        }
      }
      return false;
    });
    
    if (optionByValue) {
      // Si encontramos por value, usar label o Nombre
      return optionByValue['label'] || optionByValue['Nombre'] || 'Desconocido';
    }
    
    // Si no encuentra por value, intentar con las propiedades originales
    const option = options.find(opt => {
      if (typeof opt !== 'object' || opt === null) return false;
      
      // Revisar todas las claves disponibles para buscar el ID
      const keys = Object.keys(opt);
      for (const key of keys) {
        if (opt[key]?.toString() === id.toString()) {
          // Considerar solo claves que parezcan ser IDs
          if (key.toLowerCase().includes('id') || key === 'value') {
            console.log(`✓ Coincidencia encontrada para ID ${id} en prop ${key}:`, opt);
            return true;
          }
        }
      }
      
      // Si no encontró, verificar específicamente las claves que sabemos que pueden tener el ID
      const matchSubParam = opt['IdSubParam']?.toString() === id.toString();
      const matchDet = opt['IdDet']?.toString() === id.toString();
      const matchId = opt['id']?.toString() === id.toString();
      const matchValue = opt['value']?.toString() === id.toString();
      
      return matchSubParam || matchDet || matchId || matchValue;
    });
    
    if (!option) {
      console.warn(`❌ No se encontró ninguna frecuencia para el ID: ${id}`);
      return 'Desconocido';
    }
    
    // Buscar el nombre en varias propiedades posibles
    const nombre = option['Nombre'] || option['nombre'] || option['label'] || 'Desconocido';
    console.log(`✓ Nombre encontrado para ID ${id}: ${nombre}`);
    return nombre;
  }

  /**
   * Obtiene el nombre de la categoría por su ID
   */
  static getCategoryNameById(id: number | string | null, options: CategoryOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging: imprimir un slice de las opciones para evitar logs demasiado grandes
    const optionsSlice = options.slice(0, 3);
    console.log(`⏱️ Buscando categoría con ID: ${id} en ${options.length} opciones.`);
    console.log('Muestra de opciones de categoría:', JSON.stringify(optionsSlice));
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de categoría disponibles para mapear');
      return 'Desconocido';
    }
    
    // Primero intentamos buscar por la propiedad 'value' (la que usa el CustomSelectComponent)
    const optionByValue = options.find(opt => {
      // Si es un objeto SelectOption como los que crea CustomSelectComponent
      if (typeof opt === 'object' && opt !== null) {
        // Si tiene una propiedad 'value'
        if ('value' in opt && opt['value']?.toString() === id.toString()) {
          console.log(`✓ Coincidencia encontrada por prop 'value' para categoría:`, opt);
          return true;
        }
      }
      return false;
    });
    
    if (optionByValue) {
      // Si encontramos por value, usar label o Nombre
      return optionByValue['label'] || optionByValue['Nombre'] || 'Desconocido';
    }
    
    // Si no encuentra por value, intentar con las propiedades originales
    const option = options.find(opt => {
      if (typeof opt !== 'object' || opt === null) return false;
      
      // Revisar todas las claves disponibles para buscar el ID
      const keys = Object.keys(opt);
      for (const key of keys) {
        if (opt[key]?.toString() === id.toString()) {
          // Considerar solo claves que parezcan ser IDs
          if (key.toLowerCase().includes('id') || key === 'value') {
            console.log(`✓ Coincidencia encontrada para categoría ID ${id} en prop ${key}:`, opt);
            return true;
          }
        }
      }
      
      // Si no encontró, verificar específicamente las claves que sabemos que pueden tener el ID
      const matchSubParam = opt['IdSubParam']?.toString() === id.toString();
      const matchDet = opt['IdDet']?.toString() === id.toString();
      const matchId = opt['id']?.toString() === id.toString();
      const matchValue = opt['value']?.toString() === id.toString();
      
      return matchSubParam || matchDet || matchId || matchValue;
    });
    
    if (!option) {
      console.warn(`❌ No se encontró ninguna categoría para el ID: ${id}`);
      return 'Desconocido';
    }
    
    // Buscar el nombre en varias propiedades posibles
    const nombre = option['Nombre'] || option['nombre'] || option['label'] || 'Desconocido';
    console.log(`✓ Nombre de categoría encontrado para ID ${id}: ${nombre}`);
    return nombre;
  }

  /**
   * Obtiene el nombre del parámetro por su ID
   */
  static getParameterNameById(id: number | string | null, options: ParameterOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging: imprimir un slice de las opciones para evitar logs demasiado grandes
    const optionsSlice = options.slice(0, 3);
    console.log(`⏱️ Buscando parámetro con ID: ${id} en ${options.length} opciones.`);
    console.log('Muestra de opciones de parámetro:', JSON.stringify(optionsSlice));
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de parámetro disponibles para mapear');
      return 'Desconocido';
    }
    
    // Primero intentamos buscar por la propiedad 'value' (la que usa el CustomSelectComponent)
    const optionByValue = options.find(opt => {
      // Si es un objeto SelectOption como los que crea CustomSelectComponent
      if (typeof opt === 'object' && opt !== null) {
        // Si tiene una propiedad 'value'
        if ('value' in opt && opt['value']?.toString() === id.toString()) {
          console.log(`✓ Coincidencia encontrada por prop 'value' para parámetro:`, opt);
          return true;
        }
      }
      return false;
    });
    
    if (optionByValue) {
      // Si encontramos por value, usar label o Nombre
      return optionByValue['label'] || optionByValue['Nombre'] || 'Desconocido';
    }
    
    // Si no encuentra por value, intentar con las propiedades originales
    const option = options.find(opt => {
      if (typeof opt !== 'object' || opt === null) return false;
      
      // Revisar todas las claves disponibles para buscar el ID
      const keys = Object.keys(opt);
      for (const key of keys) {
        if (opt[key]?.toString() === id.toString()) {
          // Considerar solo claves que parezcan ser IDs
          if (key.toLowerCase().includes('id') || key === 'value') {
            console.log(`✓ Coincidencia encontrada para parámetro ID ${id} en prop ${key}:`, opt);
            return true;
          }
        }
      }
      
      // Si no encontró, verificar específicamente las claves que sabemos que pueden tener el ID
      const matchSubParam = opt['IdSubParam']?.toString() === id.toString();
      const matchDet = opt['IdDet']?.toString() === id.toString();
      const matchId = opt['id']?.toString() === id.toString();
      const matchValue = opt['value']?.toString() === id.toString();
      
      return matchSubParam || matchDet || matchId || matchValue;
    });
    
    if (!option) {
      console.warn(`❌ No se encontró ningún parámetro para el ID: ${id}`);
      return 'Desconocido';
    }
    
    // Buscar el nombre en varias propiedades posibles
    const nombre = option['Nombre'] || option['nombre'] || option['label'] || 'Desconocido';
    console.log(`✓ Nombre de parámetro encontrado para ID ${id}: ${nombre}`);
    return nombre;
  }

  /**
   * Obtiene el nombre del documento por su ID
   */
  static getDocumentNameById(id: number | string | null, options: DocumentOption[]): string {
    if (!id || id === '0' || id === 0) return 'No Asociado';
    
    // Para debugging: imprimir un slice de las opciones para evitar logs demasiado grandes
    const optionsSlice = options.slice(0, 3);
    console.log(`⏱️ Buscando documento con ID: ${id} en ${options.length} opciones.`);
    console.log('Muestra de opciones de documento:', JSON.stringify(optionsSlice));
    
    if (!options || options.length === 0) {
      console.warn('⚠️ No hay opciones de documento disponibles para mapear');
      return 'Desconocido';
    }
    
    // Primero intentamos buscar por la propiedad 'value' (la que usa el CustomSelectComponent)
    const optionByValue = options.find(opt => {
      // Si es un objeto SelectOption como los que crea CustomSelectComponent
      if (typeof opt === 'object' && opt !== null) {
        // Si tiene una propiedad 'value'
        if ('value' in opt && opt['value']?.toString() === id.toString()) {
          console.log(`✓ Coincidencia encontrada por prop 'value' para documento:`, opt);
          return true;
        }
      }
      return false;
    });
    
    if (optionByValue) {
      // Si encontramos por value, usar label o nombre
      return optionByValue['label'] || optionByValue['nombre'] || optionByValue['Nombre'] || 'Desconocido';
    }
    
    // Si no encuentra por value, intentar con las propiedades originales
    const option = options.find(opt => {
      if (typeof opt !== 'object' || opt === null) return false;
      
      // Revisar todas las claves disponibles para buscar el ID
      const keys = Object.keys(opt);
      for (const key of keys) {
        if (opt[key]?.toString() === id.toString()) {
          // Considerar solo claves que parezcan ser IDs
          if (key.toLowerCase().includes('id') || key === 'value') {
            console.log(`✓ Coincidencia encontrada para documento ID ${id} en prop ${key}:`, opt);
            return true;
          }
        }
      }
      
      // Si no encontró, verificar específicamente las claves que sabemos que pueden tener el ID
      const matchId = opt['id']?.toString() === id.toString();
      const matchIdBiblioteca = opt['IdDocumento']?.toString() === id.toString();
      const matchValue = opt['value']?.toString() === id.toString();
      
      return matchId || matchIdBiblioteca || matchValue;
    });
    
    if (!option) {
      console.warn(`❌ No se encontró ningún documento para el ID: ${id}`);
      return 'Desconocido';
    }
    
    // Buscar el nombre en varias propiedades posibles
    const nombre = option['nombre'] || option['Nombre'] || option['label'] || 'Desconocido';
    console.log(`✓ Nombre de documento encontrado para ID ${id}: ${nombre}`);
    return nombre;
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