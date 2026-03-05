import { NgModule }                from '@angular/core';
import { BrowserModule }           from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule }            from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule }            from 'ngx-toastr';

import { AppRoutingModule }        from './app-routing.module';
import { AppComponent }            from './app.component';
import { JwtInterceptor }          from './interceptors/jwt.interceptor';
import { ErrorInterceptor }        from './interceptors/error.interceptor';

import { NavbarComponent }
  from './components/navbar/navbar.component';
import { FooterComponent }
  from './components/footer/footer.component';
import { ThemeToggleComponent }
  from './components/theme-toggle/theme-toggle.component';

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
import { ImageUploadComponent } from './components/image-upload/image-upload.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    ThemeToggleComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    RestaurantsComponent,
    RestaurantDetailComponent,
    CartComponent,
    OrdersComponent,
    ProfileComponent,
    OwnerDashboardComponent,
    AdminDashboardComponent,
    ImageUploadComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      positionClass:           'toast-bottom-right',
      timeOut:                 3500,
      closeButton:             true,
      progressBar:             true,
      progressAnimation:       'decreasing',
      preventDuplicates:       true,
      maxOpened:               4,
      newestOnTop:             true,
    }),
  ],
  providers: [
    {
      provide:  HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi:    true
    },
    {
      provide:  HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi:    true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}