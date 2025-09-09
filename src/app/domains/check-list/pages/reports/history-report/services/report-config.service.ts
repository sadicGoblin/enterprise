import { Injectable } from '@angular/core';
import { ReportConfig, ColorConfig, GlobalReportsConfig } from '../models/report-config.model';

// Importamos todas las configuraciones disponibles
import { REPORTS_CONFIG } from '../configs/reports.config';
import { REPORTS_CONFIG as CUSTOM_PLANS_CONFIG } from '../configs/custom_plans.config';
import { REPORTS_CONFIG as REPINCIDENTS_CONFIG } from '../configs/repincidents.config';
import { REPORTS_CONFIG as INSPSTTMA_CONFIG } from '../configs/inspsttma.config';

@Injectable({
  providedIn: 'root'
})
export class ReportConfigService {
  // Default config is the history report config
  private config: GlobalReportsConfig = REPORTS_CONFIG;
  
  // Map of all available report configurations
  private configMap: Record<string, GlobalReportsConfig> = {
    'history-report': REPORTS_CONFIG,
    'custom-plans': CUSTOM_PLANS_CONFIG,
    'repincidents': REPINCIDENTS_CONFIG,
    'inspsttma': INSPSTTMA_CONFIG
  };
  
  // Current active report type
  private currentReportType: string = 'history-report';

  /**
   * Set the current report type to load the appropriate configuration
   * @param reportType The report type identifier (e.g., 'custom-plans', 'repincidents')
   */
  setReportType(reportType: string): void {
    if (this.configMap[reportType]) {
      this.currentReportType = reportType;
      this.config = this.configMap[reportType];
      console.log(`Report type changed to: ${reportType}`);
    } else {
      console.warn(`Unknown report type: ${reportType}, using default config`);
      this.currentReportType = 'history-report';
      this.config = this.configMap['history-report'];
    }
  }

  /**
   * Get the current active report type
   * @returns The current report type identifier
   */
  getCurrentReportType(): string {
    return this.currentReportType;
  }

  /**
   * Get a report configuration by its index name
   * @param reportIndexName The unique identifier of the report
   * @returns The report configuration or undefined if not found
   */
  getReportConfig(reportIndexName?: string): ReportConfig | undefined {
    if (reportIndexName) {
      return this.config.reports.find(report => report.indexName === reportIndexName);
    }
    
    // If no reportIndexName provided, return the first report configuration
    // from the current active config
    return this.config.reports[0];
  }

  /**
   * Get the default color palette for the current report type
   * @returns Array of color hexadecimal codes
   */
  getDefaultColors(): string[] {
    return this.config.defaultColors || [];
  }

  /**
   * Get the color for a specific value in a report
   * @param value The value to find the color for
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns The color hexadecimal code or undefined if not found
   */
  getColorForValue(value: string, reportIndexName?: string): string | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    if (!reportConfig || !reportConfig.chartColors) {
      return undefined;
    }

    const colorConfig = reportConfig.chartColors.find(item => 
      item.indexItem.toLowerCase() === value.toLowerCase()
    );
    
    return colorConfig?.color;
  }

  /**
   * Get all summary values that should be displayed for a report
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns Array of field names to show in summary
   */
  getSummaryValues(reportIndexName?: string): string[] {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.summaryValues || [];
  }

  /**
   * Get the principal value field name for a report
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns The principal field name
   */
  getPrincipalValue(reportIndexName?: string): string | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.principalValue;
  }
  
  /**
   * Get the positive value for the principal field
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns The positive value string or undefined
   */
  getPrincipalValuePositive(reportIndexName?: string): string | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.principalValuePositive;
  }
  
  /**
   * Get columns for export
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns Array of column names or undefined
   */
  getColumnsExport(reportIndexName?: string): string[] | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.columnsExport;
  }
  
  /**
   * Get table columns
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns Array of column names or undefined
   */
  getColumnsTable(reportIndexName?: string): string[] | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.columnsTable;
  }
  
  /**
   * Get filter columns
   * @param reportIndexName Optional report identifier (if not provided, uses first config from current type)
   * @returns Array of column names or undefined
   */
  getColumnsFilter(reportIndexName?: string): string[] | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.columnsFilter;
  }
}
