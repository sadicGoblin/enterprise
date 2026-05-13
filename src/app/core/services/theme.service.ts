import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

/**
 * Theme service · DS Inarco SSTMA
 * Alterna entre modo claro y oscuro aplicando el atributo `data-theme` en
 * `<html>`. Persiste la elección en localStorage bajo `inarco:theme`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'inarco:theme';

  private modeSubject = new BehaviorSubject<ThemeMode>(this.readInitial());
  mode$ = this.modeSubject.asObservable();

  constructor() {
    this.applyToDom(this.modeSubject.value);
  }

  get current(): ThemeMode {
    return this.modeSubject.value;
  }

  toggle(): void {
    this.setMode(this.current === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    if (mode === this.modeSubject.value) return;
    this.modeSubject.next(mode);
    this.applyToDom(mode);
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, mode);
    } catch {
      // localStorage puede fallar en modo privado o sandbox — ignorar.
    }
  }

  private readInitial(): ThemeMode {
    try {
      const saved = localStorage.getItem(ThemeService.STORAGE_KEY) as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignorar
    }
    // Respeta preferencia del SO como default.
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignorar
    }
    return 'light';
  }

  private applyToDom(mode: ThemeMode): void {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }
}
