import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem, MenuItemRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuService {

  private pub   = `${environment.apiUrl}/restaurants/public`;
  private owner = `${environment.apiUrl}/restaurant-owner`;

  constructor(private http: HttpClient) {}

  // ─── Public ───────────────────────────────
  getFullMenu(restaurantId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.pub}/${restaurantId}/menu/all`);
  }

  getAvailableMenu(restaurantId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.pub}/${restaurantId}/menu/available`);
  }

  getByCategory(
    restaurantId: number,
    category: string
  ): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.pub}/${restaurantId}/menu/category/${category}`);
  }

  getVegItems(restaurantId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.pub}/${restaurantId}/menu/veg`);
  }

  // ─── Owner ────────────────────────────────
  addItem(
    restaurantId: number,
    req: MenuItemRequest
  ): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.owner}/${restaurantId}/menu/add`, req);
  }

  updateItem(
    itemId: number,
    req: MenuItemRequest
  ): Observable<MenuItem> {
    return this.http.put<MenuItem>(
      `${this.owner}/menu/${itemId}/update`, req);
  }

  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.owner}/menu/${itemId}/delete`);
  }

  toggleAvailability(itemId: number): Observable<MenuItem> {
    return this.http.patch<MenuItem>(
      `${this.owner}/menu/${itemId}/toggle-availability`, {});
  }
}