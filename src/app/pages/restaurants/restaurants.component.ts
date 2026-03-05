import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router }       from '@angular/router';
import { FormControl }                  from '@angular/forms';
import {
  Subject, takeUntil,
  debounceTime, distinctUntilChanged
} from 'rxjs';
import { RestaurantService } from '../../services/restaurant.service';
import { Restaurant }        from '../../models';

@Component({
  selector:    'app-restaurants',
  templateUrl: './restaurants.component.html',
  styleUrls:   ['./restaurants.component.scss']
})
export class RestaurantsComponent implements OnInit, OnDestroy {

  allRestaurants:      Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];
  loading       = true;
  searchCtrl    = new FormControl('');
  activeStatus: 'all' | 'open' = 'all';
  activeCuisine = 'All';
  sortBy        = 'rating';

  cuisines = [
    'All', 'Pizza', 'Burger', 'Indian',
    'Chinese', 'Sushi', 'Italian', 'Healthy', 'Fast Food'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private svc:    RestaurantService,
    private route:  ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // load all restaurants from backend
    this.loadAll();

    // live search with 350ms debounce
    this.searchCtrl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    // handle ?search= and ?category= from home page
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['search'])   {
          this.searchCtrl.setValue(params['search']);
        }
        if (params['category']) {
          this.activeCuisine = params['category'];
        }
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll(): void {
    this.loading = true;
    this.svc.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allRestaurants      = data;
          this.filteredRestaurants = data;
          this.loading             = false;
          this.applyFilters();
        },
        error: () => { this.loading = false; }
      });
  }

  applyFilters(): void {
    let result = [...this.allRestaurants];
    const q    = (this.searchCtrl.value || '').toLowerCase().trim();

    // filter by search text
    if (q) {
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisineType || '').toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    }

    // filter by cuisine
    if (this.activeCuisine !== 'All') {
      result = result.filter(r =>
        (r.cuisineType || '').toLowerCase()
          .includes(this.activeCuisine.toLowerCase())
      );
    }

    // filter by open status
    if (this.activeStatus === 'open') {
      result = result.filter(r => r.open);
    }

    // sort
    if (this.sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredRestaurants = result;
  }

  setStatus(s: 'all' | 'open'): void {
    this.activeStatus = s;
    this.applyFilters();
  }

  setCuisine(c: string): void {
    this.activeCuisine = c;
    this.applyFilters();
  }

  setSort(s: string): void {
    this.sortBy = s;
    this.applyFilters();
  }

  clearAll(): void {
    this.searchCtrl.setValue('');
    this.activeCuisine = 'All';
    this.activeStatus  = 'all';
    this.sortBy        = 'rating';
    this.applyFilters();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/restaurants', id]);
  }

  getImage(r: Restaurant): string {
    return r.imageUrl ||
      'https://images.unsplash.com/photo-1517248135467' +
      '-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';
  }

  // used for skeleton loading grid
  get skeletons(): number[] { return Array(8).fill(0); }

  // tells template if any filter is active
  get hasActiveFilters(): boolean {
    return this.activeCuisine !== 'All' ||
           this.activeStatus  !== 'all' ||
           !!(this.searchCtrl.value);
  }
}