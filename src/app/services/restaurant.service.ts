import { Injectable }         from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }         from 'rxjs';
import { environment }        from '../../environments/environment';
import { Restaurant, RestaurantRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private pub   = `${environment.apiUrl}/restaurants/public`;
  private owner = `${environment.apiUrl}/restaurant-owner`;
  private adm   = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ─── Public (no auth needed) ──────────────
  getAll(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.pub}/all`);
  }

  getById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.pub}/${id}`);
  }

  search(keyword: string): Observable<Restaurant[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Restaurant[]>(
      `${this.pub}/search`, { params });
  }

  getByCity(city: string): Observable<Restaurant[]> {
    const params = new HttpParams().set('city', city);
    return this.http.get<Restaurant[]>(
      `${this.pub}/city`, { params });
  }

  // ─── Owner (JWT required) ─────────────────
  getMyRestaurant(): Observable<Restaurant> {
    return this.http.get<Restaurant>(
      `${this.owner}/my-restaurant`);
  }

  create(req: RestaurantRequest): Observable<Restaurant> {
    return this.http.post<Restaurant>(
      `${this.owner}/create`, req);
  }

  update(req: RestaurantRequest): Observable<Restaurant> {
    return this.http.put<Restaurant>(
      `${this.owner}/update`, req);
  }

  toggleStatus(): Observable<Restaurant> {
    return this.http.patch<Restaurant>(
      `${this.owner}/toggle-status`, {});
  }

  // ─── Admin ────────────────────────────────
  deleteRestaurant(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.adm}/restaurants/${id}`);
  }
}