import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  loading  = false;
  showPass = false;

  constructor(
    private fb:           FormBuilder,
    private authService:  AuthService,
    private toastService: ToastService,
    private router:       Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getters — used in template as email.invalid etc
  get email()    { return this.form.get('email')!;    }
  get password() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.toastService.success(
          `Welcome back, ${res.fullName}!` + 'Login Successful');

        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (res.role === 'RESTAURANT_OWNER') {
          this.router.navigate(['/owner/dashboard']);
        } else {
          this.router.navigate(['/restaurants']);
        }
      },
      error: (err) => {
        this.toastService.error(
          err.message || 'Invalid credentials'+ 'Login Failed');
        this.loading = false;
      }
    });
  }
}