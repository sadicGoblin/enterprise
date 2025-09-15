import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

/**
 * Interface for column definition used in Excel export
 */
export interface ExportColumn {
  /** Field name in the data source */
  field: string;
  /** Column header text to display */
  header: string;
  /** Optional width for the Excel column */
  width?: number;
  /** Optional format function to transform data before exporting */
  format?: (value: any, row?: any) => any;
}

/**
 * Configuration options for Excel export
 */
export interface ExportOptions {
  /** Filename for the exported Excel (without extension) */
  fileName?: string;
  /** Sheet name in the Excel file */
  sheetName?: string;
  /** Enable header styling */
  styleHeader?: boolean;
  /** Custom header style overrides */
  headerStyle?: {
    font?: Partial<ExcelJS.Font>;
    fill?: Partial<ExcelJS.Fill>;
    alignment?: Partial<ExcelJS.Alignment>;
  };
  /** Auto-size columns based on content */
  autoSizeColumns?: boolean;
  /** Maximum column width when auto-sizing (default: 30) */
  maxColumnWidth?: number;
}

/**
 * Configuration options for PNG export
 */
export interface PngExportOptions {
  /** Filename for the exported PNG (without extension) */
  fileName?: string;
  /** Scale factor for image quality (default: 2) */
  scale?: number;
  /** Background color for the image (default: '#ffffff') */
  backgroundColor?: string;
  /** Enable CORS for external resources (default: true) */
  useCORS?: boolean;
  /** Falsed content (default: true) */
  allowTaint?: boolean;
  /** Custom width for the capture */
  width?: number;
  /** Custom height for the capture */
  height?: number;
}

/**
 * Generic service to export data to Excel with configurable columns
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }
  
  /**
   * Exports data to Excel with specified columns
   * @param data Array of data objects to export
   * @param columns Array of column definitions to include in export
   * @param options Export configuration options
   */
  exportToExcel(data: any[], columns: ExportColumn[], options?: ExportOptions): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const defaultOptions: ExportOptions = {
      fileName: 'Export',
      sheetName: 'Data',
      styleHeader: true,
      autoSizeColumns: true,
      maxColumnWidth: 30
    };

    const exportOptions = { ...defaultOptions, ...options };

    // Create new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(exportOptions.sheetName);

    // Define columns for worksheet
    const excelColumns = columns.map(column => {
      return {
        header: column.header,
        key: column.field,
        width: column.width || 20
      };
    });

    worksheet.columns = excelColumns;

    // Apply header styling if enabled
    if (exportOptions.styleHeader) {
      const headerRow = worksheet.getRow(1);
      
      // Apply bold white text on dark background
      headerRow.font = { 
        bold: true, 
        color: { argb: 'FFFFFF' } 
      };
      
      // Apply fill color
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C2C41' }
      };
      
      // Center align text
      headerRow.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };
      
      // Apply custom style overrides if provided
      if (exportOptions.headerStyle?.font) {
        Object.assign(headerRow.font, exportOptions.headerStyle.font);
      }
      
      if (exportOptions.headerStyle?.fill) {
        Object.assign(headerRow.fill, exportOptions.headerStyle.fill);
      }
      
      if (exportOptions.headerStyle?.alignment) {
        Object.assign(headerRow.alignment, exportOptions.headerStyle.alignment);
      }
    }

    // Add data rows
    data.forEach(item => {
      const row: Record<string, any> = {};
      columns.forEach(column => {
        // Get value using property path (supports nested properties)
        let value = this.getPropertyValue(item, column.field);
        
        // Apply format function if provided
        if (column.format) {
          value = column.format(value, item);
        }
        
        row[column.field] = value;
      });
      worksheet.addRow(row);
    });

    // Auto-size columns if enabled
    if (exportOptions.autoSizeColumns) {
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column['eachCell']?.({ includeEmpty: true }, (cell: any) => {
          const columnWidth = cell.value ? cell.value.toString().length : 10;
          if (columnWidth > maxLength) {
            maxLength = columnWidth;
          }
        });
        column.width = Math.min(maxLength + 2, exportOptions.maxColumnWidth || 30);
      });
    }

    // Generate and download file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = exportOptions.fileName || 'Export';
      saveAs(blob, `${fileName}_${date}.xlsx`);
    }).catch(error => {
      console.error('Error exporting to Excel:', error);
    });
  }
  
  /**
   * Gets property value from an object with support for nested properties
   * @param obj Object to extract value from
   * @param path Property path (e.g. 'user.name')
   * @returns Property value or null if not found
   */
  private getPropertyValue(obj: any, path: string): any {
    if (!obj || !path) return null;
    
    // Handle nested properties (e.g., 'user.name')
    const properties = path.split('.');
    let value = obj;
    
    for (const prop of properties) {
      if (value === null || value === undefined) {
        return null;
      }
      
      value = value[prop];
    }
    
    return value;
  }

  /**
   * Exports an HTML element as PNG image
   * @param element HTML element to capture
   * @param options PNG export configuration options
   */
  async exportElementToPNG(element: HTMLElement, options?: PngExportOptions): Promise<void> {
    try {
      if (!element) {
        console.error('No element provided for PNG export');
        return;
      }

      const defaultOptions: PngExportOptions = {
        fileName: 'Export',
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      };

      const exportOptions = { ...defaultOptions, ...options };

      // Configure html2canvas options
      const canvasOptions: any = {
        scale: exportOptions.scale,
        useCORS: exportOptions.useCORS,
        allowTaint: exportOptions.allowTaint,
        backgroundColor: exportOptions.backgroundColor,
        scrollX: 0,
        scrollY: 0
      };

      // Add custom dimensions if provided
      if (exportOptions.width) {
        canvasOptions.width = exportOptions.width;
      } else {
        canvasOptions.width = element.scrollWidth;
      }

      if (exportOptions.height) {
        canvasOptions.height = exportOptions.height;
      } else {
        canvasOptions.height = element.scrollHeight;
      }

      // Capture the element
      const canvas = await html2canvas(element, canvasOptions);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const date = new Date().toISOString().split('T')[0];
          const fileName = exportOptions.fileName || 'Export';
          saveAs(blob, `${fileName}_${date}.png`);
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  }

  /**
   * Exports an element by selector as PNG image
   * @param selector CSS selector for the element to capture
   * @param options PNG export configuration options
   */
  async exportElementBySelectorToPNG(selector: string, options?: PngExportOptions): Promise<void> {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.error(`Element with selector '${selector}' not found`);
      return;
    }
    
    await this.exportElementToPNG(element, options);
  }
}
