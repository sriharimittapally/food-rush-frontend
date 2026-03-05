import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { map }         from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {

  private readonly url =
    `https://api.cloudinary.com/v1_1/` +
    `${environment.cloudinary.cloudName}/image/upload`;

  constructor(private http: HttpClient) {}

  // ─── Single method — used everywhere in app ──
  upload(file: File, folder: string): Observable<string> {
    const fd = new FormData();
    fd.append('file',          file);
    fd.append('upload_preset', environment.cloudinary.uploadPreset);
    fd.append('folder',        folder);
    fd.append('quality',       'auto');
    fd.append('fetch_format',  'auto');

    return this.http
      .post<any>(this.url, fd)
      .pipe(map(res => res.secure_url as string));
  }

  // ─── Folder shortcuts ────────────────────────
  uploadRestaurantImage(file: File): Observable<string> {
    return this.upload(file, 'foodrush/restaurants');
  }

  uploadMenuItemImage(file: File): Observable<string> {
    return this.upload(file, 'foodrush/menu-items');
  }

  uploadProfileImage(file: File): Observable<string> {
    return this.upload(file, 'foodrush/profiles');
  }
}