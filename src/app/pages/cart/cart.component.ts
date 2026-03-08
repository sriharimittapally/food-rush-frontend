import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router }                       from '@angular/router';
import { FormControl, Validators }      from '@angular/forms';
import { Subject, takeUntil }           from 'rxjs';
import { CartService }  from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService }  from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CartItem }     from '../../models';

@Component({
  selector:    'app-cart',
  templateUrl: './cart.component.html',
  styleUrls:   ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {

  items:   CartItem[] = [];
  placing = false;    // true while API call is in progress
  // ─── Order success modal ───────────────────
showSuccessModal = false;
placedOrderId:   number | null = null;
  // delivery address — required
  addressCtrl = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);

  // special instructions — optional
  instructionsCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    public  cart:   CartService,
    private orders: OrderService,
    private auth:   AuthService,
    private toast:  ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // subscribe to cart items so UI updates live
    this.cart.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => this.items = items);

    // if cart is empty redirect to restaurants
    if (this.items.length === 0) {
      this.router.navigate(['/restaurants']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Cart operations ───────────────────────────
  increase(item: CartItem): void {
    this.cart.addItem(item.menuItem);
  }

  decrease(item: CartItem): void {
    this.cart.removeItem(item.menuItem.id);
  }

  remove(item: CartItem): void {
    this.cart.deleteItem(item.menuItem.id);
    this.toast.info(`${item.menuItem.name} removed from cart`);

    // if cart becomes empty after removal go back
    if (this.items.length === 0) {
      this.router.navigate(['/restaurants']);
    }
  }

  clearCart(): void {
    this.cart.clearCart();
    this.toast.info('Cart cleared');
    this.router.navigate(['/restaurants']);
  }

  // ─── Price calculations ────────────────────────
  get subtotal(): number {
    return this.items.reduce(
      (sum, i) => sum + i.menuItem.price * i.quantity, 0
    );
  }

  // free delivery always in this app
  get deliveryFee(): number { return 0; }

  get total(): number { return this.subtotal + this.deliveryFee; }

  get itemCount(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  // ─── Place order ───────────────────────────────
placeOrder(): void {
  // validate address
  this.addressCtrl.markAsTouched();
  if (this.addressCtrl.invalid) {
    this.toast.error('Please enter a valid delivery address');
    return;
  }

  if (this.items.length === 0) {
    this.toast.error('Your cart is empty');
    return;
  }

  const restaurantId = this.cart.getRestaurantId();
  if (!restaurantId) return;

  this.placing = true;

  const orderRequest = {
    restaurantId,
    items: this.items.map(i => ({
      menuItemId: i.menuItem.id,
      quantity:   i.quantity
    })),
    deliveryAddress:     this.addressCtrl.value!.trim(),
    specialInstructions: this.instructionsCtrl.value?.trim() || ''
  };

  this.orders.placeOrder(orderRequest)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: order => {
        this.placing = false;
        this.cart.clearCart();

        // ← show success modal instead of redirect
        this.placedOrderId    = order.id;
        this.showSuccessModal  = true;
      },
      error: err => {
        this.placing = false;
        this.toast.error(
          err?.error?.message || 'Failed to place order. Try again.'
        );
      }
    });
}

  // ─── Helpers ───────────────────────────────────
  getImage(item: CartItem): string {
    return item.menuItem.imageUrl ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' +
      '?w=200&auto=format&fit=crop&q=80';
  }

  goToRestaurant(): void {
    const id = this.cart.getRestaurantId();
    if (id) this.router.navigate(['/restaurants', id]);
    else     this.router.navigate(['/restaurants']);
  }

  goToTracking(): void {
  this.router.navigate(['/orders/track', this.placedOrderId]);
}

goToOrders(): void {
  this.router.navigate(['/orders']);
}
}

