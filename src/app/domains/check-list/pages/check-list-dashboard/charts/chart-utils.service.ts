import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartUtilsService {

  constructor() { }

  /**
   * Genera una paleta de colores para los gráficos
   */
  generateChartColors(count: number): string[] {
    const baseColors = [
      '#3B82F6', // Azul principal - actividades asignadas
      '#10B981', // Verde principal - actividades completadas
      '#F43F5E', // Rojo principal - actividades pendientes
      '#8B5CF6', // Morado
      '#F59E0B', // Naranja
      '#6366F1', // Indigo
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#64748B'  // Slate
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }

  /**
   * Devuelve colores para gráficos de estado (completado/pendiente)
   */
  getStatusColors(): { completed: string, pending: string } {
    return {
      completed: '#10B981', // Verde principal del ejemplo
      pending: '#EF4444'    // Rojo del ejemplo
    };
  }

  /**
   * Ajusta la transparencia de un color
   * @param color Color en formato hexadecimal (#RRGGBB)
   * @param alpha Valor de transparencia (0-1)
   */
  adjustAlpha(color: string, alpha: number): string {
    // Convertir color hex a RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
