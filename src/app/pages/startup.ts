import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LibraryStoreService } from '../services/library-store';

@Component({
  selector: 'app-startup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main>
      <h1>Book</h1>

      @if (store.loading()) {
        <p aria-live="polite">Loading your library…</p>
      } @else if (store.errorMessage()) {
        <p role="alert">{{ store.errorMessage() }}</p>
        <p>
          <a routerLink="/setup">Go to setup</a>
        </p>
      } @else {
        <p aria-live="polite">Redirecting…</p>
      }
    </main>
  `,
})
export class Startup implements OnInit {
  protected readonly store = inject(LibraryStoreService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.store.initializeFromCache();

    if (this.store.isConfigured()) {
      await this.router.navigateByUrl('/library');
      return;
    }

    await this.router.navigateByUrl('/setup');
  }
}
