import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, LoginRequest,
         RegisterRequest, Role } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API   = 'http://localhost:8080/api/auth';
  private readonly TOKEN = 'food_token';
  private readonly USER  = 'food_user';

  // BehaviorSubject so all components react to auth changes
  private currentUserSubject =
    new BehaviorSubject<AuthResponse | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ─── Register ───────────────────────────────────────

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, request)
      .pipe(tap(res => this.storeAuth(res)));
  }

  // ─── Login ──────────────────────────────────────────

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, request)
      .pipe(tap(res => this.storeAuth(res)));
  }

  // ─── Logout ─────────────────────────────────────────

  logout(): void {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.USER);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ─── Helpers ────────────────────────────────────────

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN, res.token);
    localStorage.setItem(this.USER, JSON.stringify(res));
    this.currentUserSubject.next(res);
  }

  private getStoredUser(): AuthResponse | null {
    const user = localStorage.getItem(this.USER);
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): Role | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  isCustomer(): boolean        { return this.getRole() === 'CUSTOMER'; }
  isRestaurantOwner(): boolean { return this.getRole() === 'RESTAURANT_OWNER'; }
  isAdmin(): boolean           { return this.getRole() === 'ADMIN'; }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }
}