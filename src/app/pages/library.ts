import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LibraryStoreService } from '../services/library-store';
import { AudiobooksSection } from '../components/audiobooks-section';
import { BooksSection } from '../components/books-section';

@Component({
  selector: 'app-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BooksSection, AudiobooksSection],
  template: `
    <main>
      <h1>Your Library</h1>

      <p>
        <a routerLink="/setup">Change folders</a>
      </p>

      <app-books-section />
      <app-audiobooks-section />

      @if (!store.hasCache()) {
        <p>
          No cached library found.
          <button type="button" (click)="goSetup()">Go to setup</button>
        </p>
      }
    </main>
  `,
})
export class Library {
  protected readonly store = inject(LibraryStoreService);
  private readonly router = inject(Router);

  protected async goSetup(): Promise<void> {
    await this.router.navigateByUrl('/setup');
  }
}
