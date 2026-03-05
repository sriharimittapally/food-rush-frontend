import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService }  from '../../services/auth.service';
import { CartService }  from '../../services/cart.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { AuthResponse } from '../../models';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  isScrolled   = false;
  isMenuOpen   = false;
  cartCount    = 0;
  currentMode: ThemeMode = 'system';
  currentUser: AuthResponse | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public  authService:  AuthService,
    private cartService:  CartService,
    private themeService: ThemeService,
    private router:       Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => this.cartCount = n);

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.currentUser = u);

    this.themeService.themeMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(m => this.currentMode = m);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onScroll(): void { this.isScrolled = window.scrollY > 10; }

  setTheme(m: ThemeMode): void { this.themeService.setMode(m); }
  logout(): void { this.authService.logout(); this.isMenuOpen = false; }
  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }

  getInitial(): string {
    return this.currentUser?.fullName?.charAt(0)?.toUpperCase() ?? 'U';
  }
  getFirstName(): string {
    return this.currentUser?.fullName?.split(' ')[0] ?? 'User';
  }
}