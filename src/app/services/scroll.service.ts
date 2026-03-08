import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollService {

  toTop(): void {
    // try all possible scrollable containers
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });

    // find any scrollable parent and reset it too
    const scrollable = document.querySelector('.od-root') as HTMLElement;
    if (scrollable) {
      scrollable.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toElement(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toTopInstant(): void {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}