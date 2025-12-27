import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LibraryStoreService } from '../services/library-store';
import { FileDebug } from './file-debug';

@Component({
  selector: 'app-books-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileDebug],
  styles: [
    `li {
      border: 1px solid GrayText;
      border-radius: 0.75rem;
      padding: 0.75rem;
      margin: 0.5rem 0;
    }

    li>button {
      margin-right: 0.75rem;
    }
    `,
  ],
  template: `
    <section aria-labelledby="books-heading">
      <h2 id="books-heading">Books (.epub)</h2>

      @if (store.books().length === 0) {
        <p>No books found.</p>
      } @else {
        <ul>
          @for (file of store.books(); track file.relativePath) {
            <li>
              <button type="button" (click)="read(file.relativePath)">Read</button>
              <strong>{{ file.relativePath }}</strong>
              <app-file-debug [file]="file" />
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class BooksSection {
  protected readonly store = inject(LibraryStoreService);
  private readonly router = inject(Router);

  protected async read(relativePath: string): Promise<void> {
    await this.router.navigate(['/reader'], { queryParams: { path: relativePath } });
  }
}
