import { Injectable }      from '@angular/core';
import {
  HttpRequest, HttpHandler,
  HttpEvent, HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router }      from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}

  intercept(
    request:  HttpRequest<any>,
    next:     HttpHandler
  ): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // 401 — token expired → logout
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        // DO NOT redirect on 403 — let components handle it

        const message =
          error.error?.message ||
          error.error?.error   ||
          error.message        ||
          'Something went wrong';

        // ✅ Always return a proper Error object
        const err: any  = new Error(message);
        err.status       = error.status;
        err.error        = error.error;
        return throwError(() => err);
      })
    );
  }
}