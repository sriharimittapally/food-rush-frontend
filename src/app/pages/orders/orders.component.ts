import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router }        from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderService }  from '../../services/order.service';
import { ToastService }  from '../../services/toast.service';
import { Order }         from '../../models';

@Component({
  selector:    'app-orders',
  templateUrl: './orders.component.html',
  styleUrls:   ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

  orders:  Order[] = [];
  loading  = true;

  // which order's details are expanded
  expandedOrderId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private orderSvc: OrderService,
    private toast:    ToastService,
    private router:   Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderSvc.getMyOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  data => {
          // show newest orders first
          this.orders  = data.sort((a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  toggleExpand(id: number): void {
    this.expandedOrderId =
      this.expandedOrderId === id ? null : id;
  }

  cancelOrder(orderId: number): void {
    this.orderSvc.cancelOrder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          // update the order in the list
          this.orders = this.orders.map(o =>
            o.id === orderId ? updated : o
          );
          this.toast.success('Order cancelled successfully');
        },
        error: err => {
          this.toast.error(
            err?.error?.message || 'Cannot cancel this order'
          );
        }
      });
  }

  // status badge config
  getStatusConfig(status: string): {
    label: string; color: string; bg: string; icon: string
  } {
    const map: Record<string, any> = {
      PENDING:          { label: 'Pending',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'fa-clock'         },
      CONFIRMED:        { label: 'Confirmed',        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'fa-circle-check'  },
      PREPARING:        { label: 'Preparing',        color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: 'fa-fire-burner'   },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: 'fa-motorcycle'    },
      DELIVERED:        { label: 'Delivered',        color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  icon: 'fa-circle-check'  },
      CANCELLED:        { label: 'Cancelled',        color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: 'fa-circle-xmark'  },
    };
    return map[status] || map['PENDING'];
  }

  canCancel(status: string): boolean {
    return status === 'PENDING';
  }

  browsRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }

  get skeletons(): number[] { return Array(3).fill(0); }
}