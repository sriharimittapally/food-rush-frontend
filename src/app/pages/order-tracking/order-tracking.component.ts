import {
  Component, OnInit, OnDestroy,
  AfterViewInit, NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil }     from 'rxjs';
import { HttpClient }             from '@angular/common/http';
import { WebsocketService }       from '../../services/websocket.service';
import { ToastService }           from '../../services/toast.service';
import { environment }            from '../../../environments/environment';
import * as L                     from 'leaflet';

interface OrderItem {
  menuItemName: string;
  quantity:     number;
  subtotal:     number;
  veg:          boolean;
}

interface TrackingOrder {
  id:                  number;
  status:              string;
  restaurantName:      string;
  customerName:        string;
  deliveryAddress:     string;
  specialInstructions: string;
  totalAmount:         number;
  createdAt:           string;
  orderItems:          OrderItem[];
}

@Component({
  selector:    'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls:   ['./order-tracking.component.scss']
})
export class OrderTrackingComponent
  implements OnInit, OnDestroy, AfterViewInit {

  order:   TrackingOrder | null = null;
  loading  = true;
  orderId!: number;

  // Map
  private map!:         L.Map;
  private riderMarker!: L.Marker;
  private restMarker!:  L.Marker;
  private homeMarker!:  L.Marker;
  private routeLine!:   L.Polyline;

  // Dummy fixed coordinates — Bangalore city center area
  private readonly RESTAURANT_COORDS: L.LatLngExpression = [12.9716, 77.5946];
  private readonly DELIVERY_COORDS:   L.LatLngExpression = [12.9816, 77.6146];
  private riderCoords = { ...this.RESTAURANT_COORDS as any };

  // rider animation
  private animFrame: any;
  private animProgress = 0;

  private destroy$ = new Subject<void>();

  readonly statusSteps = [
    { key: 'PENDING',          label: 'Order Placed',      icon: 'fa-receipt'       },
    { key: 'CONFIRMED',        label: 'Confirmed',         icon: 'fa-circle-check'  },
    { key: 'PREPARING',        label: 'Preparing',         icon: 'fa-fire-burner'   },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',  icon: 'fa-motorcycle'    },
    { key: 'DELIVERED',        label: 'Delivered',         icon: 'fa-house-chimney' }
  ];

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
    private ws:     WebsocketService,
    private toast:  ToastService,
    private zone:   NgZone
  ) {}

  ngOnInit(): void {
    this.orderId = Number(
      this.route.snapshot.paramMap.get('id')
    );
    this.loadOrder();
    this.ws.connect();
  }

  ngAfterViewInit(): void {
    // init map after view is ready
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws.disconnect();
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.map) this.map.remove();
  }

  // ─────────────────────────────────────────────
  // LOAD ORDER
  // ─────────────────────────────────────────────
  loadOrder(): void {
    this.loading = true;
    this.http.get<TrackingOrder>(
      `${environment.apiUrl}/orders/${this.orderId}`
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: order => {
        this.order   = order;
        this.loading = false;
        this.subscribeToUpdates();
        this.updateRiderForStatus(order.status);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Order not found');
        this.router.navigate(['/orders']);
      }
    });
  }

  // ─────────────────────────────────────────────
  // WEBSOCKET — live status updates
  // ─────────────────────────────────────────────
  subscribeToUpdates(): void {
    this.ws.subscribeToOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        this.zone.run(() => {
          const oldStatus = this.order?.status;
          this.order      = updated;

          if (oldStatus !== updated.status) {
            this.toast.success(
              `Order ${this.getStatusConfig(updated.status).label}!`
            );
            this.updateRiderForStatus(updated.status);
          }
        });
      });
  }

  // ─────────────────────────────────────────────
  // LEAFLET MAP
  // ─────────────────────────────────────────────
  initMap(): void {
    const el = document.getElementById('tracking-map');
    if (!el) return;

    // fix leaflet default icon path issue with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    this.map = L.map('tracking-map', {
      center:  [12.9716, 77.5946],
      zoom:    13,
      zoomControl: true
    });

    // OpenStreetMap tiles — free, no API key
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(this.map);

    // Restaurant marker
    const restIcon = L.divIcon({
      className: '',
      html: `<div class="map-marker restaurant-marker">
               <i class="fa-solid fa-store"></i>
             </div>`,
      iconSize:   [40, 40],
      iconAnchor: [20, 40]
    });

    this.restMarker = L.marker(
      this.RESTAURANT_COORDS, { icon: restIcon }
    )
    .addTo(this.map)
    .bindPopup('Restaurant');

    // Home marker
    const homeIcon = L.divIcon({
      className: '',
      html: `<div class="map-marker home-marker">
               <i class="fa-solid fa-house"></i>
             </div>`,
      iconSize:   [40, 40],
      iconAnchor: [20, 40]
    });

    this.homeMarker = L.marker(
      this.DELIVERY_COORDS, { icon: homeIcon }
    )
    .addTo(this.map)
    .bindPopup('Delivery Location');

    // Rider marker
    const riderIcon = L.divIcon({
      className: '',
      html: `<div class="map-marker rider-marker">
               <i class="fa-solid fa-motorcycle"></i>
             </div>`,
      iconSize:   [44, 44],
      iconAnchor: [22, 44]
    });

    this.riderMarker = L.marker(
      this.RESTAURANT_COORDS, { icon: riderIcon }
    ).addTo(this.map);

    // dashed route line
    this.routeLine = L.polyline(
      [this.RESTAURANT_COORDS, this.DELIVERY_COORDS],
      {
        color:     '#F9440A',
        weight:    3,
        opacity:   0.5,
        dashArray: '8, 8'
      }
    ).addTo(this.map);

    // fit map to show both markers
    this.map.fitBounds(
      L.latLngBounds([this.RESTAURANT_COORDS, this.DELIVERY_COORDS]),
      { padding: [40, 40] }
    );

    // update rider position for current status
    if (this.order) {
      this.updateRiderForStatus(this.order.status);
    }
  }

  // ─────────────────────────────────────────────
  // RIDER ANIMATION
  // ─────────────────────────────────────────────
  updateRiderForStatus(status: string): void {
    if (!this.riderMarker) return;

    if (status === 'OUT_FOR_DELIVERY') {
      this.animateRider();
    } else if (status === 'DELIVERED') {
      this.riderMarker.setLatLng(this.DELIVERY_COORDS);
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
    } else {
      this.riderMarker.setLatLng(this.RESTAURANT_COORDS);
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
  }

  animateRider(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.animProgress = 0;

    const rLat  = (this.RESTAURANT_COORDS as number[])[0];
    const rLng  = (this.RESTAURANT_COORDS as number[])[1];
    const dLat  = (this.DELIVERY_COORDS   as number[])[0];
    const dLng  = (this.DELIVERY_COORDS   as number[])[1];

    // animate over 60 seconds (realistic delivery)
    const DURATION = 60000;
    const start    = performance.now();

    const step = (now: number) => {
      const elapsed  = now - start;
      this.animProgress = Math.min(elapsed / DURATION, 1);

      const lat = rLat + (dLat - rLat) * this.animProgress;
      const lng = rLng + (dLng - rLng) * this.animProgress;

      if (this.riderMarker) {
        this.riderMarker.setLatLng([lat, lng]);
      }

      if (this.animProgress < 1) {
        this.animFrame = requestAnimationFrame(step);
      }
    };

    this.animFrame = requestAnimationFrame(step);
  }

  // ─────────────────────────────────────────────
  // STATUS HELPERS
  // ─────────────────────────────────────────────
  getStatusConfig(status: string): {
    label: string; color: string; icon: string
  } {
    const map: Record<string, any> = {
      PENDING:          { label: 'Order Placed',     color: '#F59E0B', icon: 'fa-clock'        },
      CONFIRMED:        { label: 'Confirmed',        color: '#3B82F6', icon: 'fa-circle-check' },
      PREPARING:        { label: 'Preparing',        color: '#8B5CF6', icon: 'fa-fire-burner'  },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F97316', icon: 'fa-motorcycle'   },
      DELIVERED:        { label: 'Delivered',        color: '#22C55E', icon: 'fa-house-chimney'},
      CANCELLED:        { label: 'Cancelled',        color: '#EF4444', icon: 'fa-circle-xmark' }
    };
    return map[status] || map['PENDING'];
  }

  getStepState(stepKey: string): 'done' | 'active' | 'pending' {
    const order = [
      'PENDING', 'CONFIRMED', 'PREPARING',
      'OUT_FOR_DELIVERY', 'DELIVERED'
    ];
    const currentIdx = order.indexOf(this.order?.status || 'PENDING');
    const stepIdx    = order.indexOf(stepKey);

    if (stepIdx < currentIdx)  return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }

  get isCancelled(): boolean {
    return this.order?.status === 'CANCELLED';
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
}