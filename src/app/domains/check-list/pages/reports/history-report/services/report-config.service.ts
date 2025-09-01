import { Injectable } from '@angular/core';
import { ReportConfig, ColorConfig, GlobalReportsConfig } from '../models/report-config.model';
import { REPORTS_CONFIG } from '../configs/reports.config';

@Injectable({
  providedIn: 'root'
})
export class ReportConfigService {
  private config: GlobalReportsConfig = REPORTS_CONFIG;

  /**
   * Get a report configuration by its index name
   * @param reportIndexName The unique identifier of the report
   * @returns The report configuration or undefined if not found
   */
  getReportConfig(reportIndexName: string): ReportConfig | undefined {
    return this.config.reports.find(report => report.indexName === reportIndexName);
  }

  /**
   * Get the default color palette
   * @returns Array of color hexadecimal codes
   */
  getDefaultColors(): string[] {
    return this.config.defaultColors || [];
  }

  /**
   * Get the color for a specific value in a report
   * @param reportIndexName The report identifier
   * @param fieldName The field name (estado, tipo, etc)
   * @param value The value to find the color for
   * @returns The color hexadecimal code or undefined if not found
   */
  getColorForValue(reportIndexName: string, value: string): string | undefined {
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
   * @param reportIndexName The report identifier
   * @returns Array of field names to show in summary
   */
  getSummaryValues(reportIndexName: string): string[] {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.summaryValues || [];
  }

  /**
   * Get the principal value field name for a report
   * @param reportIndexName The report identifier
   * @returns The principal field name
   */
  getPrincipalValue(reportIndexName: string): string | undefined {
    const reportConfig = this.getReportConfig(reportIndexName);
    return reportConfig?.principalValue;
  }
}
