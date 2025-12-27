import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LibraryStoreService } from '../services/library-store';

@Component({
  selector: 'app-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Initial Setup</h1>
      <p>Pick your Books folder (EPUB) and Audiobooks folder (M4B).</p>

      @if (store.errorMessage()) {
        <p role="alert">{{ store.errorMessage() }}</p>
      }

      <section aria-labelledby="books-heading">
        <h2 id="books-heading">Books Folder</h2>
        <button type="button" (click)="pickBooks()" [disabled]="store.loading()">
          Choose books folder
        </button>
        <p>
          Selected:
          <strong>{{ store.booksFolderName() ?? 'None' }}</strong>
        </p>
      </section>

      <section aria-labelledby="audio-heading">
        <h2 id="audio-heading">Audiobooks Folder</h2>
        <button type="button" (click)="pickAudiobooks()" [disabled]="store.loading()">
          Choose audiobooks folder
        </button>
        <p>
          Selected:
          <strong>{{ store.audiobooksFolderName() ?? 'None' }}</strong>
        </p>
      </section>

      <div>
        <button type="button" (click)="confirm()" [disabled]="!canContinue()">
          OK
        </button>
        <button type="button" (click)="reset()" [disabled]="store.loading()">
          Clear saved setup
        </button>
      </div>

      @if (store.loading()) {
        <p aria-live="polite">Working…</p>
      }

      @if (store.hasCache()) {
        <p>
          Cached: {{ store.books().length }} books, {{ store.audiobooks().length }} audiobooks
        </p>
      }
    </main>
  `,
})
export class Setup {
  protected readonly store = inject(LibraryStoreService);
  private readonly router = inject(Router);

  protected readonly canContinue = computed(() => this.store.canScan() && !this.store.loading());

  protected async pickBooks(): Promise<void> {
    await this.store.pickBooksFolder();
  }

  protected async pickAudiobooks(): Promise<void> {
    await this.store.pickAudiobooksFolder();
  }

  protected async confirm(): Promise<void> {
    await this.store.scanAndPersist();

    if (this.store.errorMessage()) return;

    await this.router.navigateByUrl('/library');
  }

  protected async reset(): Promise<void> {
    await this.store.reset();
  }
}
