import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient }    from '@angular/common/http';
import { AuthService }   from '../../services/auth.service';
import { ToastService }  from '../../services/toast.service';
import { ScrollService } from '../../services/scroll.service';
import { environment }   from '../../../environments/environment';

interface UserProfile {
  id:        number;
  fullName:  string;
  email:     string;
  phone:     string;
  role:      string;
  imageUrl?: string;
  active:    boolean;
  createdAt: string;
}

@Component({
  selector:    'app-profile',
  templateUrl: './profile.component.html',
  styleUrls:   ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  profile:  UserProfile | null = null;
  loading   = true;
  activeTab: 'info' | 'password' = 'info';

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  saving         = false;
  changingPwd    = false;
  showCurrentPwd = false;
  showNewPwd     = false;
  showConfirmPwd = false;

  private destroy$ = new Subject<void>();
  private api      = environment.apiUrl;

  constructor(
    private fb:     FormBuilder,
    private http:   HttpClient,
    private auth:   AuthService,
    private toast:  ToastService,
    private scroll: ScrollService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone:    ['', [Validators.required,
                      Validators.pattern(/^[0-9]{10}$/)]],
      imageUrl: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword:     ['', [Validators.required,
                             Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  loadProfile(): void {
  this.loading = true;
  this.http.get<UserProfile>(`${this.api}/user/profile`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: p => {
        this.profile = p;
        this.loading = false;
        this.profileForm.patchValue({
          fullName: p.fullName,
          phone:    p.phone,
          imageUrl: p.imageUrl || ''
        });
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load profile');
      }
    });
}

  onImageUploaded(url: string): void {
    this.profileForm.patchValue({ imageUrl: url });
  }

  saveProfile(): void {
  this.profileForm.markAllAsTouched();
  if (this.profileForm.invalid) {
    this.toast.error('Please fill in all required fields');
    return;
  }

  this.saving = true;
  this.http.put<UserProfile>(
    `${this.api}/user/profile/update`,
    this.profileForm.value
  )
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: updated => {
      this.profile = updated;
      this.saving  = false;
      this.toast.success('Profile updated successfully!');
    },
    error: err => {
      this.saving = false;
      this.toast.error(err?.message || 'Failed to update profile');
    }
  });
}
  changePassword(): void {
  this.passwordForm.markAllAsTouched();
  if (this.passwordForm.invalid) {
    if (this.passwordForm.errors?.['mismatch']) {
      this.toast.error('New passwords do not match');
    } else {
      this.toast.error('Please fill in all fields');
    }
    return;
  }

  this.changingPwd = true;
  const { currentPassword, newPassword, confirmPassword } =
  this.passwordForm.value;

  this.http.patch(
  `${this.api}/user/change-password`,
  { currentPassword, newPassword, confirmPassword },
  { responseType: 'text' }   
)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: () => {
      this.changingPwd = false;
      this.passwordForm.reset();
      this.toast.success('Password changed successfully!');
    },
    error: err => {
      this.changingPwd = false;
      this.toast.error(err?.message || 'Failed to change password');
    }
  });
}
  getRoleConfig(): { label: string; color: string; bg: string; icon: string } {
    const map: Record<string, any> = {
      CUSTOMER:         { label: 'Customer',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  icon: 'fa-user'          },
      RESTAURANT_OWNER: { label: 'Owner',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  icon: 'fa-store'         },
      ADMIN:            { label: 'Admin',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: 'fa-shield-halved' }
    };
    return map[this.profile?.role || 'CUSTOMER'];
  }

  getInitial(): string {
    return this.profile?.fullName?.charAt(0)?.toUpperCase() || '?';
  }

  getAvatar(): string | null {
    return this.profile?.imageUrl || null;
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}