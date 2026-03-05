import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Order,
  OrderRequest,
  UpdateOrderStatusRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private api   = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Customer ─────────────────────────────
  placeOrder(req: OrderRequest): Observable<Order> {
    return this.http.post<Order>(
      `${this.api}/orders/place`, req);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.api}/orders/my-orders`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(
      `${this.api}/orders/${id}`);
  }

  cancelOrder(id: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.api}/orders/${id}/cancel`, {});
  }

  // ─── Owner ────────────────────────────────
  getRestaurantOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.api}/restaurant-owner/orders`);
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.api}/restaurant-owner/orders/status`,
      { params: { status } }
    );
  }

  updateStatus(
    id: number,
    req: UpdateOrderStatusRequest
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.api}/restaurant-owner/orders/${id}/status`, req);
  }

  // ─── Admin ────────────────────────────────
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.api}/admin/orders`);
  }
}