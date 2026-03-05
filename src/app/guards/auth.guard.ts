import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // Not logged in → go to login
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check role if route requires one
    const requiredRoles: Role[] = route.data['roles'];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.authService.getRole();
      if (!userRole || !requiredRoles.includes(userRole)) {
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
}