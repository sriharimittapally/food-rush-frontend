import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler,
  HttpEvent, HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService,
              private router: Router) {}

  intercept(request: HttpRequest<any>,
            next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Token expired — auto logout
        if (error.status === 401) {
          this.authService.logout();
        }

        // Forbidden — redirect
        if (error.status === 403) {
          this.router.navigate(['/']);
        }

        const message = error.error?.message
                     || error.error?.error
                     || 'Something went wrong';
        return throwError(() => new Error(message));
      })
    );
  }
}