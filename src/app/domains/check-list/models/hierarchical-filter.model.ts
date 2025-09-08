/**
 * Interface for hierarchical filter
 * Used for maintaining filter hierarchy and relationships across components
 */
export interface HierarchicalFilterItem {
  position: number;      // Position in the hierarchy (0 = first selected, 1 = second, etc.)
  filterType: string;    // Name of the filter in lowercase
  filters: string[];     // Array of selected filter values
}
