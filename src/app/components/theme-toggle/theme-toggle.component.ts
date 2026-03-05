import { Component, OnInit } from '@angular/core';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <div class="theme-selector">
      <button
        class="theme-option"
        [class.active]="currentMode === 'light'"
        (click)="setTheme('light')"
        title="Light mode">
        ☀️ Light
      </button>
      <button
        class="theme-option"
        [class.active]="currentMode === 'system'"
        (click)="setTheme('system')"
        title="System preference">
        💻 Auto
      </button>
      <button
        class="theme-option"
        [class.active]="currentMode === 'dark'"
        (click)="setTheme('dark')"
        title="Dark mode">
        🌙 Dark
      </button>
    </div>
  `
})
export class ThemeToggleComponent implements OnInit {
  currentMode: ThemeMode = 'system';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.themeMode$.subscribe(mode => {
      this.currentMode = mode;
    });
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setMode(mode);
    this.currentMode = mode;
  }
}
