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
      '#1E88E5', '#42A5F5', '#90CAF9',
      '#26A69A', '#4DB6AC', '#80CBC4',
      '#7CB342', '#9CCC65', '#C5E1A5',
      '#FFB300', '#FFD54F', '#FFE082',
      '#F4511E', '#FF8A65', '#FFAB91'
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
      completed: '#26A69A', // Verde de la paleta
      pending: '#F4511E'    // Rojo de la paleta
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
