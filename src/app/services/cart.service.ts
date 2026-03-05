import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, MenuItem } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly cartKey = 'food_cart';

  private cartSubject =
    new BehaviorSubject<CartItem[]>(this.loadCart());

  private cartCountSubject =
    new BehaviorSubject<number>(this.loadCart().reduce(
      (s, i) => s + i.quantity, 0));

  // ✅ Public observables
  cart$:      Observable<CartItem[]> = this.cartSubject.asObservable();
  cartCount$: Observable<number>     = this.cartCountSubject.asObservable();

  constructor() {
    // Keep count in sync whenever cart changes
    this.cartSubject.subscribe(items => {
      const total = items.reduce((s, i) => s + i.quantity, 0);
      this.cartCountSubject.next(total);
    });
  }

  // ─── Add Item ─────────────────────────────────────

  addItem(menuItem: MenuItem): void {
    const cart  = [...this.cartSubject.value];
    const index = cart.findIndex(i => i.menuItem.id === menuItem.id);

    if (index > -1) {
      cart[index] = {
        ...cart[index],
        quantity: cart[index].quantity + 1
      };
    } else {
      cart.push({ menuItem, quantity: 1 });
    }

    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  // ─── Remove / Decrease ────────────────────────────

  removeItem(menuItemId: number): void {
    const cart  = [...this.cartSubject.value];
    const index = cart.findIndex(i => i.menuItem.id === menuItemId);
    if (index === -1) return;

    if (cart[index].quantity > 1) {
      cart[index] = {
        ...cart[index],
        quantity: cart[index].quantity - 1
      };
    } else {
      cart.splice(index, 1);
    }

    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  // ─── Delete entire item ───────────────────────────

  deleteItem(menuItemId: number): void {
    const cart = this.cartSubject.value
      .filter(i => i.menuItem.id !== menuItemId);
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  // ─── Clear cart ───────────────────────────────────

  clearCart(): void {
    this.cartSubject.next([]);
    localStorage.removeItem(this.cartKey);
  }

  // ─── Getters ──────────────────────────────────────

  getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  getTotal(): number {
    return this.cartSubject.value.reduce(
      (sum, i) => sum + i.menuItem.price * i.quantity, 0
    );
  }

  getItemCount(): number {
    return this.cartCountSubject.value;
  }

  getRestaurantId(): number | null {
    const cart = this.cartSubject.value;
    return cart.length ? cart[0].menuItem.restaurantId : null;
  }

  isInCart(menuItemId: number): boolean {
    return this.cartSubject.value
      .some(i => i.menuItem.id === menuItemId);
  }

  getItemQuantity(menuItemId: number): number {
    const item = this.cartSubject.value
      .find(i => i.menuItem.id === menuItemId);
    return item ? item.quantity : 0;
  }

  // ─── Persist ──────────────────────────────────────

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
  }

  private loadCart(): CartItem[] {
    try {
      const saved = localStorage.getItem(this.cartKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}