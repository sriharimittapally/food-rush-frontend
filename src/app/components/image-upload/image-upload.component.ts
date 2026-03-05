import {
  Component, Input, Output,
  EventEmitter, ViewChild, ElementRef
} from '@angular/core';
import { CloudinaryService }
  from '../../services/cloudinary.service';

@Component({
  selector:    'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls:   ['./image-upload.component.scss']
})
export class ImageUploadComponent {

  // Pass the folder based on context:
  // 'foodrush/restaurants' | 'foodrush/menu-items'
  // | 'foodrush/profiles'
  @Input()  folder     = 'foodrush/restaurants';
  @Input()  currentUrl = '';
  @Input()  height     = '200px';

  // Emits the Cloudinary URL back to parent
  @Output() uploaded = new EventEmitter<string>();

  @ViewChild('fi')
  fi!: ElementRef<HTMLInputElement>;

  uploading = false;
  preview   = '';
  error     = '';

  constructor(
    private cloudinary: CloudinaryService
  ) {}

  open(): void {
    this.fi.nativeElement.click();
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement)
      .files?.[0];
    if (!file) return;

    this.error = '';

    // Validate
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select an image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image must be under 5MB.';
      return;
    }

    // Show preview instantly
    const reader = new FileReader();
    reader.onload = e =>
      this.preview = e.target?.result as string;
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    this.uploading = true;
    this.cloudinary.upload(file, this.folder)
      .subscribe({
        next: (url: string) => {
          this.uploading = false;
          // Send URL to parent — parent saves it to form
          this.uploaded.emit(url);
        },
        error: () => {
          this.uploading = false;
          this.preview   = '';
          this.error     = 'Upload failed. Please try again.';
        }
      });
  }
}