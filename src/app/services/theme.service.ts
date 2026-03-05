import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'dark' | 'light' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private renderer: Renderer2;
  private readonly STORAGE_KEY = 'food_theme';

  // What the user explicitly chose
  private themeModeSubject =
    new BehaviorSubject<ThemeMode>(this.getSavedMode());
  themeMode$ = this.themeModeSubject.asObservable();

  // What is actually applied (resolved system → dark/light)
  private activeThemeSubject =
    new BehaviorSubject<'dark' | 'light'>(this.resolveTheme());
  activeTheme$ = this.activeThemeSubject.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.applyTheme();

    // Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (this.themeModeSubject.value === 'system') {
          this.applyTheme();
        }
      });
  }

  // ─── Set Mode ─────────────────────────────────────────

  setMode(mode: ThemeMode): void {
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.themeModeSubject.next(mode);
    this.applyTheme();
  }

  // ─── Apply to <html> ──────────────────────────────────

  private applyTheme(): void {
    const resolved = this.resolveTheme();
    this.activeThemeSubject.next(resolved);

    const html = document.documentElement;
    if (resolved === 'dark') {
      this.renderer.setAttribute(html, 'data-theme', 'dark');
      this.renderer.removeClass(html, 'light-theme');
      this.renderer.addClass(html, 'dark-theme');
    } else {
      this.renderer.setAttribute(html, 'data-theme', 'light');
      this.renderer.removeClass(html, 'dark-theme');
      this.renderer.addClass(html, 'light-theme');
    }
  }

  // ─── Resolve system → actual theme ───────────────────

  private resolveTheme(): 'dark' | 'light' {
    const mode = this.getSavedMode();
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
    }
    return mode as 'dark' | 'light';
  }

  private getSavedMode(): ThemeMode {
    return (localStorage.getItem(this.STORAGE_KEY) as ThemeMode) || 'system';
  }

  getCurrentMode(): ThemeMode  { return this.themeModeSubject.value; }
  isDark(): boolean            { return this.activeThemeSubject.value === 'dark'; }
}