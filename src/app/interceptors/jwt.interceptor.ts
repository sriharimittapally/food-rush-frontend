import { Injectable }      from '@angular/core';
import {
  HttpRequest, HttpHandler,
  HttpEvent, HttpInterceptor
} from '@angular/common/http';
import { Observable }      from 'rxjs';
import { AuthService }     from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(
    request:  HttpRequest<any>,
    next:     HttpHandler
  ): Observable<HttpEvent<any>> {

    // ── SKIP Cloudinary — it does not accept Authorization header
    if (request.url.includes('cloudinary.com')) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}