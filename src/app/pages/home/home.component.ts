import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService }       from '../../services/auth.service';
import { RestaurantService } from '../../services/restaurant.service';
import { Restaurant }        from '../../models';

@Component({
  selector:    'app-home',
  templateUrl: './home.component.html',
  styleUrls:   ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  restaurants: Restaurant[] = [];
  loading      = true;
  searchQuery  = '';

  private destroy$ = new Subject<void>();

  stats = [
    { value: '500+',   label: 'Restaurants',     icon: 'fa-store'             },
    { value: '50K+',   label: 'Happy Customers', icon: 'fa-users'             },
    { value: '28 min', label: 'Avg. Delivery',   icon: 'fa-clock'             },
    { value: '4.8',    label: 'Avg. Rating',     icon: 'fa-star'              },
  ];

  categories = [
    { name: 'Pizza',     icon: 'fa-pizza-slice',       color: '#FF4500', bg: 'rgba(255,69,0,0.12)'    },
    { name: 'Burgers',   icon: 'fa-burger',             color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    { name: 'Sushi',     icon: 'fa-fish',               color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
    { name: 'Indian',    icon: 'fa-bowl-food',          color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
    { name: 'Chinese',   icon: 'fa-utensils',           color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
    { name: 'Desserts',  icon: 'fa-ice-cream',          color: '#EC4899', bg: 'rgba(236,72,153,0.12)'  },
    { name: 'Healthy',   icon: 'fa-leaf',               color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
    { name: 'Fast Food', icon: 'fa-fire-flame-curved',  color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  ];

  steps = [
    { num: '01', icon: 'fa-location-dot', title: 'Choose Location',
      desc: 'Enter your delivery address to find restaurants near you.' },
    { num: '02', icon: 'fa-utensils',     title: 'Browse Menu',
      desc: 'Explore menus, check ratings and add items to your cart.' },
    { num: '03', icon: 'fa-credit-card',  title: 'Place Order',
      desc: 'Review your cart and confirm your order in seconds.' },
    { num: '04', icon: 'fa-motorcycle',   title: 'Fast Delivery',
      desc: 'Track your order live as it heads straight to your door.' },
  ];

  constructor(
    public  auth:   AuthService,
    private svc:    RestaurantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // load top 6 restaurants for featured section
    this.svc.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  data => {
          this.restaurants = data.slice(0, 6);
          this.loading     = false;
        },
        error: () => { this.loading = false; }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/restaurants'], {
      queryParams: { search: this.searchQuery.trim() }
    });
  }

  goCategory(name: string): void {
    this.router.navigate(['/restaurants'], {
      queryParams: { category: name }
    });
  }

  // fallback image if restaurant has no imageUrl
  getImage(r: Restaurant): string {
    return r.imageUrl ||
      'https://images.unsplash.com/photo-1517248135467' +
      '-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';
  }

  get skeletons(): number[] { return Array(6).fill(0); }
}