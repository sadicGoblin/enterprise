import { Injectable } from '@angular/core';
import { ExportService } from './export.service';
import { ExportableItem } from '../components/export-selector/export-selector.component';

export interface MassExportOptions {
  fileNamePrefix?: string;
  scale?: number;
  backgroundColor?: string;
  format?: 'png' | 'jpg';
  includeTimestamp?: boolean;
  zipFiles?: boolean;
}

export interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MassExportService {
  
  constructor(private exportService: ExportService) {}
  
  /**
   * Exports multiple elements as individual files
   * @param elementIds Array of element IDs to export (in the desired order)
   * @param exportableItems Array of exportable item definitions
   * @param options Export configuration options
   * @returns Promise with export results
   */
  async exportMultipleElements(
    elementIds: string[], 
    exportableItems: ExportableItem[], 
    options: MassExportOptions = {}
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    const defaultOptions = {
      fileNamePrefix: 'export',
      scale: 2,
      backgroundColor: '#ffffff',
      format: 'png' as const,
      includeTimestamp: true,
      zipFiles: false
    };
    
    const config = { ...defaultOptions, ...options };
    
    for (const elementId of elementIds) {
      try {
        const exportableItem = exportableItems.find(item => item.id === elementId);
        const element = document.getElementById(elementId) || document.querySelector(`[data-export-id="${elementId}"]`);
        
        if (!element) {
          results.push({
            success: false,
            error: `Element with ID "${elementId}" not found`
          });
          continue;
        }
        
        const fileName = this.generateFileName(
          exportableItem?.name || elementId, 
          config.fileNamePrefix, 
          config.includeTimestamp
        );
        
        await this.exportService.exportElementToPNG(element as HTMLElement, {
          fileName,
          scale: config.scale,
          backgroundColor: config.backgroundColor
        });
        
        results.push({
          success: true,
          fileName: `${fileName}.png`
        });
        
        // Add a small delay between exports to prevent browser overload
        await this.delay(100);
        
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Exports multiple elements as a single combined image
   * @param elementIds Array of element IDs to export
   * @param exportableItems Array of exportable item definitions
   * @param options Export configuration options
   * @returns Promise with export result
   */
  async exportCombinedElements(
    elementIds: string[], 
    exportableItems: ExportableItem[], 
    options: MassExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const defaultOptions = {
        fileNamePrefix: 'combined-export',
        scale: 2,
        backgroundColor: '#ffffff',
        includeTimestamp: true
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Create a temporary container to hold all elements
      const container = document.createElement('div');
      container.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        background-color: ${config.backgroundColor};
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      `;
      
      // Clone and append all selected elements
      for (const elementId of elementIds) {
        const element = document.getElementById(elementId) || document.querySelector(`[data-export-id="${elementId}"]`);
        if (element) {
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.width = '100%';
          container.appendChild(clone);
        }
      }
      
      document.body.appendChild(container);
      
      const fileName = this.generateFileName(
        'combined-export', 
        config.fileNamePrefix, 
        config.includeTimestamp
      );
      
      await this.exportService.exportElementToPNG(container, {
        fileName,
        scale: config.scale,
        backgroundColor: config.backgroundColor
      });
      
      // Clean up
      document.body.removeChild(container);
      
      return {
        success: true,
        fileName: `${fileName}.png`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generates a filename for export
   * @param baseName Base name for the file
   * @param prefix Optional prefix
   * @param includeTimestamp Whether to include timestamp
   * @returns Generated filename
   */
  private generateFileName(baseName: string, prefix?: string, includeTimestamp: boolean = true): string {
    let fileName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    
    if (prefix) {
      fileName = `${prefix}_${fileName}`;
    }
    
    if (includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      fileName = `${fileName}_${timestamp}`;
    }
    
    return fileName;
  }
  
  /**
   * Creates a delay for sequential operations
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Gets exportable elements from the DOM
   * @param containerSelector Optional container selector to limit search
   * @returns Array of found exportable elements
   */
  getExportableElementsFromDOM(containerSelector?: string): ExportableItem[] {
    const container = containerSelector ? 
      document.querySelector(containerSelector) : 
      document;
      
    if (!container) return [];
    
    const elements = container.querySelectorAll('[data-export-id]');
    const exportableItems: ExportableItem[] = [];
    
    elements.forEach(element => {
      const id = element.getAttribute('data-export-id');
      const name = element.getAttribute('data-export-name') || id;
      const icon = element.getAttribute('data-export-icon') || 'insert_drive_file';
      const type = element.getAttribute('data-export-type');
      
      if (id && name) {
        exportableItems.push({
          id,
          name,
          icon,
          type: type || undefined
        });
      }
    });
    
    return exportableItems;
  }
}
