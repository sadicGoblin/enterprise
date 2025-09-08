/**
 * Centralized icon configuration file for the entire application
 * This configuration contains icon mappings for all UI components
 */

// Interface for the icon dictionary structure
export interface IconMap {
  // General icons used across the application
  general: {
    [key: string]: string;
  };
  
  // Input and form control icons
  inputs: {
    [key: string]: string;
  };
  
  // Action icons for buttons, etc.
  actions: {
    [key: string]: string;
  };
  
  // Field name icons for reports and data displays
  fields: {
    [key: string]: string;
  };
  
  // Value specific icons for field values
  values: {
    [key: string]: string;
  };
}

// Global icon dictionary
export const iconDictionary: IconMap = {
  general: {
    'info': 'info',
    'warning': 'warning',
    'error': 'error',
    'success': 'check_circle',
    'help': 'help',
    'calendar': 'calendar_today',
    'clock': 'access_time',
    'settings': 'settings',
    'user': 'person',
    'users': 'group',
    'location': 'place',
    'phone': 'phone',
    'email': 'email',
    'default': 'help_outline'
  },
  
  inputs: {
    'search': 'search',
    'filter': 'filter_list',
    'sort': 'sort',
    'checkbox': 'check_box',
    'dropdown': 'arrow_drop_down',
    'expand': 'expand_more',
    'collapse': 'expand_less',
    'clear': 'clear',
    'more': 'more_horiz',
    'add': 'add',
    'remove': 'remove',
    'edit': 'edit',
    'default': 'input'
  },
  
  actions: {
    'save': 'save',
    'delete': 'delete',
    'cancel': 'cancel',
    'close': 'close',
    'view': 'visibility',
    'hide': 'visibility_off',
    'download': 'download',
    'upload': 'upload',
    'refresh': 'refresh',
    'back': 'arrow_back',
    'forward': 'arrow_forward',
    'default': 'touch_app'
  },
  
  // Fields specific for reports module
  fields: {
    'estado': 'assignment_turned_in',
    'fecha': 'calendar_today',
    'tipo': 'category',
    'prioridad': 'low_priority',
    'responsable': 'person',
    'area': 'domain',
    'obra': 'domain',          // Added from reports module
    'usuario': 'person',       // Added from reports module
    'cargo': 'badge',          // Added from reports module
    'periodo': 'date_range',   // Added from reports module
    'etapaconst': 'construction', // Added from reports module
    'subproceso': 'subdirectory_arrow_right', // Added from reports module
    'ambito': 'room',          // Added from reports module
    'actividad': 'assignment',
    'periocidad': 'repeat',
    'ubicacion': 'place',
    'nombre': 'person',
    'default': 'label'
  },
  
  // Value icons - specific icons for field values
  values: {
    // Estado values
    'cumplida': 'check_circle',
    'no cumplida': 'cancel',
    'pendiente': 'pending',
    'en proceso': 'hourglass_empty',
    
    // Tipo values
    'inspección': 'visibility',
    'inspección general': 'search',
    'verificación': 'verified',
    'personalizado': 'tune',
    'default': 'circle'
  }
};

/**
 * Gets the appropriate icon for a general purpose
 * @param key The key to look for in the general section
 * @returns The corresponding icon or a default if not found
 */
export function getGeneralIcon(key: string): string {
  const normalizedKey = key?.toLowerCase() || '';
  return iconDictionary.general[normalizedKey] || iconDictionary.general['default'];
}

/**
 * Gets the appropriate icon for an input or form control
 * @param key The key to look for in the inputs section
 * @returns The corresponding icon or a default if not found
 */
export function getInputIcon(key: string): string {
  const normalizedKey = key?.toLowerCase() || '';
  return iconDictionary.inputs[normalizedKey] || iconDictionary.inputs['default'];
}

/**
 * Gets the appropriate icon for an action
 * @param key The key to look for in the actions section
 * @returns The corresponding icon or a default if not found
 */
export function getActionIcon(key: string): string {
  const normalizedKey = key?.toLowerCase() || '';
  return iconDictionary.actions[normalizedKey] || iconDictionary.actions['default'];
}

/**
 * Gets the appropriate icon for a field name
 * @param fieldName The field name to look for
 * @returns The corresponding icon or a default if not found
 */
export function getFieldIcon(fieldName: string): string {
  const normalizedKey = fieldName?.toLowerCase() || '';
  return iconDictionary.fields[normalizedKey] || iconDictionary.fields['default'];
}

/**
 * Gets the appropriate icon for a specific value
 * @param value The value to look for
 * @returns The corresponding icon or a default if not found
 */
export function getValueIcon(value: string): string {
  const normalizedKey = value?.toLowerCase() || '';
  return iconDictionary.values[normalizedKey] || iconDictionary.values['default'];
}

