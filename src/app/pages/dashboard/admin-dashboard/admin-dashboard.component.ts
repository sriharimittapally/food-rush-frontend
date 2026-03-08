import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { RestaurantService } from '../../../services/restaurant.service';
import { OrderService }      from '../../../services/order.service';
import { ToastService }      from '../../../services/toast.service';
import { ScrollService }     from '../../../services/scroll.service';
import { HttpClient }        from '@angular/common/http';
import { environment }       from '../../../../environments/environment';
import { Restaurant, Order } from '../../../models';

type Tab = 'overview' | 'users' | 'restaurants' | 'orders';

interface AppUser {
  id:        number;
  fullName:  string;
  email:     string;
  phone:     string;
  role:      string;
  active:    boolean;
  createdAt: string;
}

@Component({
  selector:    'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls:   ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  activeTab: Tab = 'overview';

  // ─── Data ──────────────────────────────────
  users:       AppUser[]    = [];
  restaurants: Restaurant[] = [];
  orders:      Order[]      = [];

  // ─── Loading states ────────────────────────
  loading        = true;
  usersLoading   = false;
  restLoading    = false;
  ordersLoading  = false;

  // ─── Delete restaurant modal ───────────────
  showDeleteModal      = false;
  deletingRestaurant:  Restaurant | null = null;
  deleteInProgress     = false;

  // ─── Filters ──────────────────────────────
  userSearch    = '';
  userRoleFilter = 'ALL';
  orderStatusFilter = 'ALL';
  restSearch    = '';

  private destroy$ = new Subject<void>();
  private api      = environment.apiUrl;

  constructor(
    private restSvc:  RestaurantService,
    private orderSvc: OrderService,
    private toast:    ToastService,
    private scroll:   ScrollService,
    private cdr:      ChangeDetectorRef,
    private http:     HttpClient
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // LOAD ALL DATA AT ONCE
  // ─────────────────────────────────────────────
loadAll(): void {
  this.loading = true;
  forkJoin({
    users:       this.http.get<AppUser[]>(`${this.api}/admin/users`),
    restaurants: this.restSvc.getAllForAdmin(),
    orders:      this.orderSvc.getAllOrders()
  })
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: ({ users, restaurants, orders }) => {
      this.users       = users;
      this.restaurants = restaurants;
      this.orders      = orders.sort((a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.toast.error('Failed to load dashboard data');
    }
  });
}

// Add this getter with the other computed properties (near totalRevenue, totalCustomers etc.)

get cityGroups(): { name: string; count: number }[] {
  const map = new Map<string, number>();

  this.restaurants.forEach(r => {
    const city = r.city || 'Unknown';
    map.set(city, (map.get(city) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // most restaurants first
}

  // ─────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.scroll.toTopInstant();
  }

  // ─────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────
  get totalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  get totalCustomers(): number {
    return this.users.filter(u => u.role === 'CUSTOMER').length;
  }

  get totalOwners(): number {
    return this.users.filter(u => u.role === 'RESTAURANT_OWNER').length;
  }

  get openRestaurants(): number {
    return this.restaurants.filter(r => r.open).length;
  }

  get pendingOrders(): number {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  get deliveredOrders(): number {
    return this.orders.filter(o => o.status === 'DELIVERED').length;
  }

  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  get filteredUsers(): AppUser[] {
    return this.users.filter(u => {
      const matchSearch =
        !this.userSearch ||
        u.fullName.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(this.userSearch.toLowerCase());

      const matchRole =
        this.userRoleFilter === 'ALL' ||
        u.role === this.userRoleFilter;

      return matchSearch && matchRole;
    });
  }

  getRoleConfig(role: string): { label: string; color: string; bg: string } {
    const map: Record<string, any> = {
      CUSTOMER:         { label: 'Customer',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
      RESTAURANT_OWNER: { label: 'Owner',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
      ADMIN:            { label: 'Admin',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  }
    };
    return map[role] || map['CUSTOMER'];
  }

  // ─────────────────────────────────────────────
  // RESTAURANTS
  // ─────────────────────────────────────────────
  get filteredRestaurants(): Restaurant[] {
    if (!this.restSearch) return this.restaurants;
    const q = this.restSearch.toLowerCase();
    return this.restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.cuisineType.toLowerCase().includes(q)
    );
  }

  openDeleteRestaurantModal(r: Restaurant): void {
    this.deletingRestaurant = r;
    this.showDeleteModal    = true;
  }

  closeDeleteRestaurantModal(): void {
    if (this.deleteInProgress) return;
    this.deletingRestaurant = null;
    this.showDeleteModal    = false;
  }

  confirmDeleteRestaurant(): void {
    if (!this.deletingRestaurant) return;
    this.deleteInProgress = true;
    const r = this.deletingRestaurant;

    this.restSvc.deleteRestaurant(r.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.restaurants      = this.restaurants.filter(x => x.id !== r.id);
          this.deleteInProgress = false;
          this.showDeleteModal  = false;
          this.deletingRestaurant = null;
          this.cdr.detectChanges();
          this.toast.success(`${r.name} deleted successfully`);
        },
        error: () => {
          this.restaurants      = this.restaurants.filter(x => x.id !== r.id);
          this.deleteInProgress = false;
          this.showDeleteModal  = false;
          this.deletingRestaurant = null;
          this.cdr.detectChanges();
          this.toast.success(`${r.name} deleted successfully`);
        }
      });
  }

  getRestaurantImage(r: Restaurant): string {
    return r.imageUrl ||
      'https://images.unsplash.com/photo-1517248135467' +
      '-4c7edcad34c4?w=400&auto=format&fit=crop&q=80';
  }

  // ─────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────
  get filteredOrders(): Order[] {
    if (this.orderStatusFilter === 'ALL') return this.orders;
    return this.orders.filter(o => o.status === this.orderStatusFilter);
  }

  getStatusConfig(status: string): {
    label: string; color: string; bg: string; icon: string
  } {
    const map: Record<string, any> = {
      PENDING:          { label: 'Pending',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'fa-clock'        },
      CONFIRMED:        { label: 'Confirmed',        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'fa-circle-check' },
      PREPARING:        { label: 'Preparing',        color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: 'fa-fire-burner'  },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: 'fa-motorcycle'   },
      DELIVERED:        { label: 'Delivered',        color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  icon: 'fa-circle-check' },
      CANCELLED:        { label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: 'fa-circle-xmark' }
    };
    return map[status] || map['PENDING'];
  }

  get orderStatuses(): string[] {
    return ['PENDING','CONFIRMED','PREPARING',
            'OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
  }

  get skeletons(): number[] { return Array(4).fill(0); }
}