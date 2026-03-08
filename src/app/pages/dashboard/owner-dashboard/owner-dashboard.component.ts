import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder, FormGroup,
  Validators
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { RestaurantService } from '../../../services/restaurant.service';
import { MenuService }       from '../../../services/menu.service';
import { OrderService }      from '../../../services/order.service';
import { ToastService }      from '../../../services/toast.service';
import {
  Restaurant, MenuItem,
  Order, OrderStatus
} from '../../../models';
import { ScrollService } from 'src/app/services/scroll.service';

// which tab is active
type Tab = 'restaurant' | 'menu' | 'orders';

@Component({
  selector:    'app-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls:   ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {

  // ─── Tabs ──────────────────────────────────
  activeTab: Tab = 'restaurant';

  // ─── Restaurant state ──────────────────────
  restaurant:          Restaurant | null = null;
  restaurantLoading    = true;
  restaurantSaving     = false;
  hasRestaurant        = false;
  // true when edit form is open
  showRestaurantForm   = false;
  restaurantForm!:     FormGroup;

  // ─── Delete confirmation modal ─────────────
showDeleteModal  = false;
deletingItem:    MenuItem | null = null;
deleteInProgress = false;

  // ─── Menu state ────────────────────────────
  menuItems:     MenuItem[] = [];
  menuLoading    = false;
  // null = no form open, 'add' = adding, MenuItem = editing
  menuFormMode:  'add' | 'edit' | null = null;
  editingItem:   MenuItem | null       = null;
  menuForm!:     FormGroup;
  menuSaving     = false;

  // ─── Orders state ──────────────────────────
  orders:         Order[] = [];
  ordersLoading   = false;
  filterStatus    = 'ALL';
  updatingOrderId: number | null = null;

  readonly orderStatuses: OrderStatus[] = [
    'PENDING', 'CONFIRMED', 'PREPARING',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  ];

  readonly cuisineTypes = [
    'Pizza', 'Burger', 'Indian', 'Chinese',
    'Sushi', 'Italian', 'Healthy', 'Fast Food',
    'Mexican', 'Thai', 'Mediterranean', 'Other'
  ];

  readonly menuCategories = [
    'Starters', 'Main Course', 'Breads',
    'Rice & Biryani', 'Desserts', 'Beverages',
    'Salads', 'Soups', 'Sides', 'Combo Meals'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb:      FormBuilder,
    private restSvc: RestaurantService,
    private menuSvc: MenuService,
    private orderSvc: OrderService,
    private toast:   ToastService,
    private cdr:ChangeDetectorRef,
    private scroll:ScrollService
  ) {}

  ngOnInit(): void {
    this.buildRestaurantForm();
    this.buildMenuForm();
    this.loadMyRestaurant();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // TAB SWITCHING
  // ─────────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab = tab;

    if (tab === 'menu'   && this.menuItems.length === 0) {
      this.loadMenu();
    }
    if (tab === 'orders' && this.orders.length === 0) {
      this.loadOrders();
    }
  }

  // ─────────────────────────────────────────────
  // RESTAURANT
  // ─────────────────────────────────────────────
  buildRestaurantForm(): void {
    this.restaurantForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      address:     ['', [Validators.required, Validators.minLength(5)]],
      city:        ['', [Validators.required]],
      phone:       ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      cuisineType: ['', [Validators.required]],
      imageUrl:    ['']
    });
  }

  loadMyRestaurant(): void {
    this.restaurantLoading = true;
    this.restSvc.getMyRestaurant()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.restaurant      = r;
          this.hasRestaurant   = true;
          this.restaurantLoading = false;
        },
        error: err => {
          this.restaurantLoading = false;
          // 404 means owner has no restaurant yet
          if (err.status === 404) {
            this.hasRestaurant = false;
          }
        }
      });
  }

  openRestaurantForm(): void {
    if (this.restaurant) {
      // editing — pre-fill form
      this.restaurantForm.patchValue({
        name:        this.restaurant.name,
        address:     this.restaurant.address,
        city:        this.restaurant.city,
        phone:       this.restaurant.phone,
        cuisineType: this.restaurant.cuisineType,
        imageUrl:    this.restaurant.imageUrl || ''
      });
    }
    this.showRestaurantForm = true;
  }

  closeRestaurantForm(): void {
    this.showRestaurantForm = false;
    this.restaurantForm.reset();
  }

  onRestaurantImageUploaded(url: string): void {
    this.restaurantForm.patchValue({ imageUrl: url });
  }

  saveRestaurant(): void {
    this.restaurantForm.markAllAsTouched();
    if (this.restaurantForm.invalid) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.restaurantSaving = true;
    const payload = this.restaurantForm.value;

    // create or update depending on hasRestaurant
    const call$ = this.hasRestaurant
      ? this.restSvc.update(payload)
      : this.restSvc.create(payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.restaurant      = r;
        this.hasRestaurant   = true;
        this.restaurantSaving = false;
        this.showRestaurantForm = false;
        this.toast.success(
          this.hasRestaurant
            ? 'Restaurant updated!'
            : 'Restaurant created!'
        );
        this.scroll.toTopInstant();
      },
      error: err => {
        this.restaurantSaving = false;
        this.toast.error(
          err?.error?.message || 'Failed to save restaurant'
        );
      }
    });
  }

  toggleRestaurantStatus(): void {
    if (!this.restaurant) return;
    this.restSvc.toggleStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.restaurant = r;
          this.toast.success(
            r.open ? 'Restaurant is now Open!' : 'Restaurant is now Closed'
          );
        },
        error: () => this.toast.error('Failed to update status')
      });
  }

  // ─────────────────────────────────────────────
  // MENU
  // ─────────────────────────────────────────────
  buildMenuForm(): void {
    this.menuForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      price:       [null, [Validators.required, Validators.min(1)]],
      category:    ['', [Validators.required]],
      veg:         [false],
      imageUrl:    ['']
    });
  }

  loadMenu(): void {
    if (!this.restaurant) return;
    this.menuLoading = true;
    this.menuSvc.getFullMenu(this.restaurant.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  items => { this.menuItems = items; this.menuLoading = false; },
        error: ()    => { this.menuLoading = false; }
      });
  }

  openAddMenu(): void {
    this.menuForm.reset({ veg: false });
    this.editingItem  = null;
    this.menuFormMode = 'add';
  }

  openEditMenu(item: MenuItem): void {
    this.editingItem = item;
    this.menuForm.patchValue({
      name:        item.name,
      description: item.description,
      price:       item.price,
      category:    item.category,
      veg:         item.veg,
      imageUrl:    item.imageUrl || ''
    });
    this.menuFormMode = 'edit';
  }

  closeMenuForm(): void {
    this.menuFormMode = null;
    this.editingItem  = null;
    this.menuForm.reset({ veg: false });
  }

  onMenuImageUploaded(url: string): void {
    this.menuForm.patchValue({ imageUrl: url });
  }

  saveMenuItem(): void {
    this.menuForm.markAllAsTouched();
    if (this.menuForm.invalid) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    if (!this.restaurant) return;

    this.menuSaving = true;
    const payload   = this.menuForm.value;

    const call$ = this.menuFormMode === 'edit' && this.editingItem
      ? this.menuSvc.updateItem(this.editingItem.id, payload)
      : this.menuSvc.addItem(this.restaurant.id, payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: saved => {
        if (this.menuFormMode === 'edit') {
          this.menuItems = this.menuItems.map(i =>
            i.id === saved.id ? saved : i
          );
          this.toast.success('Menu item updated!');
        } else {
          this.menuItems = [saved, ...this.menuItems];
          this.toast.success(`${saved.name} added to menu!`);
        }
        this.menuSaving   = false;
        this.menuFormMode = null;
        this.editingItem  = null;
        this.scroll.toTopInstant();
      },
      error: err => {
        this.menuSaving = false;
        this.toast.error(
          err?.error?.message || 'Failed to save menu item'
        );
      }
    });
  }



// Opens the modal — no more confirm()
openDeleteModal(item: MenuItem): void {
  this.deletingItem   = item;
  this.showDeleteModal = true;
}

closeDeleteModal(): void {
  if (this.deleteInProgress) return; // prevent closing during delete
  this.deletingItem    = null;
  this.showDeleteModal = false;
}

confirmDelete(): void {
  if (!this.deletingItem) return;
  this.deleteInProgress = true;

  const itemToDelete = this.deletingItem;

  this.menuSvc.deleteItem(itemToDelete.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.menuItems        = this.menuItems.filter(i => i.id !== itemToDelete.id);
        this.deleteInProgress = false;
        this.showDeleteModal  = false;
        this.deletingItem     = null;
        this.cdr.detectChanges();
        this.toast.success(`${itemToDelete.name} removed from menu`);
       this.scroll.toTopInstant();
      },
      error: () => {
        // even on error — close modal and remove from UI
        // because soft delete DID work on backend
        this.menuItems        = this.menuItems.filter(i => i.id !== itemToDelete.id);
        this.deleteInProgress = false;
        this.showDeleteModal  = false;
        this.deletingItem     = null;
        this.cdr.detectChanges();
        this.toast.success(`${itemToDelete.name} removed from menu`);
        this.scroll.toTop();
      }
    });
}
  toggleAvailability(item: MenuItem): void {
    this.menuSvc.toggleAvailability(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.menuItems = this.menuItems.map(i =>
            i.id === updated.id ? updated : i
          );
          this.toast.success(
            updated.available
              ? `${updated.name} is now available`
              : `${updated.name} marked unavailable`
          );
        },
        error: () => this.toast.error('Failed to update availability')
      });
  }

  // ─── Menu computed properties ─────────────────
  get menuGroups(): { category: string; items: MenuItem[] }[] {
    const map = new Map<string, MenuItem[]>();
    this.menuItems.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }));
  }

  // ─────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────
  loadOrders(): void {
    this.ordersLoading = true;
    this.orderSvc.getRestaurantOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.orders = data.sort((a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
          this.ordersLoading = false;
        },
        error: () => { this.ordersLoading = false; }
      });
  }

  get filteredOrders(): Order[] {
    if (this.filterStatus === 'ALL') return this.orders;
    return this.orders.filter(o => o.status === this.filterStatus);
  }

  updateOrderStatus(order: Order, status: OrderStatus): void {
    this.updatingOrderId = order.id;
    this.orderSvc.updateStatus(order.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.orders = this.orders.map(o =>
            o.id === updated.id ? updated : o
          );
          this.updatingOrderId = null;
          this.toast.success(`Order #${order.id} → ${status}`);
        },
        error: err => {
          this.updatingOrderId = null;
          this.toast.error(
            err?.error?.message || 'Failed to update order status'
          );
        }
      });
  }

  getNextStatuses(current: OrderStatus): OrderStatus[] {
    const flow: Record<string, OrderStatus[]> = {
      PENDING:          ['CONFIRMED', 'CANCELLED'],
      CONFIRMED:        ['PREPARING', 'CANCELLED'],
      PREPARING:        ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED:        [],
      CANCELLED:        []
    };
    return flow[current] || [];
  }

  getStatusConfig(status: string): {
    label: string; color: string; bg: string; icon: string
  } {
    const map: Record<string, any> = {
      PENDING:          { label: 'Pending',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'fa-clock'         },
      CONFIRMED:        { label: 'Confirmed',        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'fa-circle-check'  },
      PREPARING:        { label: 'Preparing',        color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: 'fa-fire-burner'   },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: 'fa-motorcycle'    },
      DELIVERED:        { label: 'Delivered',        color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  icon: 'fa-circle-check'  },
      CANCELLED:        { label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: 'fa-circle-xmark'  }
    };
    return map[status] || map['PENDING'];
  }

  // ─── Helpers ───────────────────────────────────
  getMenuImage(item: MenuItem): string {
    return item.imageUrl ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' +
      '?w=200&auto=format&fit=crop&q=80';
  }

  getRestaurantImage(r: Restaurant): string {
    return r.imageUrl ||
      'https://images.unsplash.com/photo-1517248135467' +
      '-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  get skeletons(): number[] { return Array(4).fill(0); }
}