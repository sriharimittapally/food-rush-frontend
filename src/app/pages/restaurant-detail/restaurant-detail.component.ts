import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router }       from '@angular/router';
import { Subject, takeUntil }           from 'rxjs';
import { RestaurantService } from '../../services/restaurant.service';
import { MenuService }       from '../../services/menu.service';
import { CartService }       from '../../services/cart.service';
import { ToastService }      from '../../services/toast.service';
import { AuthService }       from '../../services/auth.service';
import { Restaurant, MenuItem } from '../../models';

@Component({
  selector:    'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls:   ['./restaurant-detail.component.scss']
})
export class RestaurantDetailComponent implements OnInit, OnDestroy {

  restaurant: Restaurant | null = null;
  allItems:   MenuItem[]        = [];
  activeCategory = 'All';
  vegOnly        = false;
  loading        = true;
  menuLoading    = true;

  // cart conflict modal — shown when user tries to add
  // item from a DIFFERENT restaurant than what is in cart
  showConflictModal = false;
  pendingItem: MenuItem | null  = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route:   ActivatedRoute,
    private router:  Router,
    public  auth:    AuthService,
    private restSvc: RestaurantService,
    private menuSvc: MenuService,
    public  cart:    CartService,
    private toast:   ToastService
  ) {}

  ngOnInit(): void {
    // get restaurant id from URL → /restaurants/:id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/restaurants']); return; }

    this.loadRestaurant(id);
    this.loadMenu(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data loading ──────────────────────────────
  loadRestaurant(id: number): void {
    this.loading = true;
    this.restSvc.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r  => { this.restaurant = r; this.loading = false; },
        error: () => { this.loading = false; this.router.navigate(['/restaurants']); }
      });
  }

  loadMenu(id: number): void {
    this.menuLoading = true;
    // load all available menu items for this restaurant
    this.menuSvc.getAvailableMenu(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  items => { this.allItems = items; this.menuLoading = false; },
        error: ()    => { this.menuLoading = false; }
      });
  }

  // ─── Computed properties ───────────────────────

  // unique category list built from menu items
  get categories(): string[] {
    const cats = [...new Set(this.allItems.map(i => i.category))];
    return ['All', ...cats];
  }

  // items filtered by active category and veg toggle
  get filteredItems(): MenuItem[] {
    let items = [...this.allItems];

    if (this.activeCategory !== 'All') {
      items = items.filter(i => i.category === this.activeCategory);
    }

    if (this.vegOnly) {
      items = items.filter(i => i.veg);
    }

    return items;
  }

  // items grouped by category for display
  get groupedItems(): { category: string; items: MenuItem[] }[] {
    const filtered = this.filteredItems;

    if (this.activeCategory !== 'All') {
      return [{ category: this.activeCategory, items: filtered }];
    }

    // group by category
    const map = new Map<string, MenuItem[]>();
    filtered.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });

    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }));
  }

  get skeletonItems(): number[] { return Array(6).fill(0); }

  // ─── Cart actions ──────────────────────────────
  addToCart(item: MenuItem): void {
    // check if user is logged in
    if (!this.auth.isLoggedIn()) {
      this.toast.warning('Please login to add items to cart');
      this.router.navigate(['/login']);
      return;
    }

    // check if user is a customer
    if (!this.auth.isCustomer()) {
      this.toast.warning('Only customers can place orders');
      return;
    }

    // check if cart already has items from a DIFFERENT restaurant
    const cartRestaurantId = this.cart.getRestaurantId();
    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
      // show conflict modal instead of adding directly
      this.pendingItem       = item;
      this.showConflictModal = true;
      return;
    }

    // safe to add
    this.cart.addItem(item);
    this.toast.success(`${item.name} added to cart!`);
  }

  removeFromCart(item: MenuItem): void {
    this.cart.removeItem(item.id);
  }

  // called when user clicks "Clear cart & add" in conflict modal
  clearAndAdd(): void {
    if (!this.pendingItem) return;
    this.cart.clearCart();
    this.cart.addItem(this.pendingItem);
    this.toast.success(`${this.pendingItem.name} added to cart!`);
    this.pendingItem       = null;
    this.showConflictModal = false;
  }

  // called when user clicks "Keep existing cart" in conflict modal
  cancelConflict(): void {
    this.pendingItem       = null;
    this.showConflictModal = false;
  }

  // ─── Helpers ───────────────────────────────────
  getRestaurantImage(r: Restaurant): string {
    return r.imageUrl ||
      'https://images.unsplash.com/photo-1517248135467' +
      '-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';
  }

  getMenuItemImage(item: MenuItem): string {
    return item.imageUrl ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' +
      '?w=400&auto=format&fit=crop&q=80';
  }

  // quantity of this item currently in cart
  getQty(itemId: number): number {
    return this.cart.getItemQuantity(itemId);
  }

  goBack(): void {
    this.router.navigate(['/restaurants']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}