/**
 * Interface defining the structure of the icon mapping dictionary
 * Used to centralize icon assignments throughout the report module
 */
export interface IconMap {
  /**
   * Icons assigned to field names (e.g., 'estado' → 'check_circle')
   */
  fields: {
    [key: string]: string;
    default: string;
  };

  /**
   * Icons assigned to specific field values (e.g., 'cumplida' → 'check_circle')
   */
  values: {
    [key: string]: string;
    default: string;
  };
}
