import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { HomeComponent }
  from './pages/home/home.component';
import { LoginComponent }
  from './pages/login/login.component';
import { RegisterComponent }
  from './pages/register/register.component';
import { RestaurantsComponent }
  from './pages/restaurants/restaurants.component';
import { RestaurantDetailComponent }
  from './pages/restaurant-detail/restaurant-detail.component';
import { CartComponent }
  from './pages/cart/cart.component';
import { OrdersComponent }
  from './pages/orders/orders.component';
import { ProfileComponent }
  from './pages/profile/profile.component';
import { OwnerDashboardComponent }
  from './pages/dashboard/owner-dashboard/owner-dashboard.component';
import { AdminDashboardComponent }
  from './pages/dashboard/admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  // Public
  { path: '',           component: HomeComponent },
  { path: 'login',      component: LoginComponent },
  { path: 'register',   component: RegisterComponent },
  { path: 'restaurants',     component: RestaurantsComponent },
  { path: 'restaurants/:id', component: RestaurantDetailComponent },

  // Customer only
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },

  // Restaurant Owner
  {
    path: 'owner/dashboard',
    component: OwnerDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['RESTAURANT_OWNER'] }
  },

  // Admin
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },

  // Fallback
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}