import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Role } from '../../models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;
  loading       = false;
  showPass      = false;
  selectedRole: Role = 'CUSTOMER';

  roles: {
    value: Role;
    label: string;
    desc: string;
  }[] = [
    {
      value: 'CUSTOMER',
      label: 'Customer',
      desc: 'Browse and order food'
    },
    {
      value: 'RESTAURANT_OWNER',
      label: 'Restaurant Owner',
      desc: 'List and manage your restaurant'
    }
  ];

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
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email:    ['', [Validators.required, Validators.email]],
      phone:    ['', [Validators.required,
                      Validators.pattern('^[0-9]{10}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role:     ['CUSTOMER', Validators.required]
    });
  }

  // Getters — used in template
  get fullName() { return this.form.get('fullName')!; }
  get email()    { return this.form.get('email')!;    }
  get phone()    { return this.form.get('phone')!;    }
  get password() { return this.form.get('password')!; }

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.form.patchValue({ role });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.register(this.form.value).subscribe({
      next: (res) => {
        this.toastService.success(
          `Account created! Welcome, ${res.fullName}!`,
          'Registration Successful');

        if (res.role === 'RESTAURANT_OWNER') {
          this.router.navigate(['/owner/dashboard']);
        } else {
          this.router.navigate(['/restaurants']);
        }
      },
      error: (err) => {
        this.toastService.error(
          err.message || 'Registration failed', 'Error');
        this.loading = false;
      }
    });
  }
}