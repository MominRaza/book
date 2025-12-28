import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";

import { LibraryStoreService } from "../services/library-store";
import type { ScannedFile } from "../models/library";

@Component({
  selector: "app-books-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: 1rem;
        padding: 0;
        list-style: none;
        margin: 0.75rem 0 0;
      }

      .card {
        border: 1px solid GrayText;
        border-radius: 0.9rem;
        overflow: clip;
        background: Canvas;
        color: CanvasText;
      }

      .cardInner {
        display: grid;
        grid-template-columns: 5rem 1fr;
        gap: 0.75rem;
        padding: 0.75rem;
        align-items: start;
      }

      .cover {
        width: 5rem;
        height: 7rem;
        border: 1px solid GrayText;
        border-radius: 0.5rem;
        background: Field;
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .meta {
        min-width: 0;
      }

      .title {
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        word-break: break-word;
      }

      .byline {
        margin: 0.15rem 0 0;
        color: GrayText;
      }

      .path {
        margin: 0.5rem 0 0;
        color: GrayText;
        font-size: 0.9rem;
        word-break: break-word;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        padding: 0 0.75rem 0.75rem;
      }

      .actions button {
        width: 100%;
      }
    `,
  ],
  template: `
    <section aria-labelledby="books-heading">
      <h2 id="books-heading">Books (.epub)</h2>

      @if (store.books().length === 0) {
        <p>No books found.</p>
      } @else {
        <ul class="grid" role="list" aria-label="Books">
          @for (file of store.books(); track file.relativePath) {
            <li class="card">
              <div class="cardInner">
                <div class="cover" aria-hidden="true">
                  @if (coverUrl(file)) {
                    <img [src]="coverUrl(file)" [alt]="coverAlt(file)" />
                  } @else {
                    <span>Cover</span>
                  }
                </div>

                <div class="meta">
                  <p class="title">{{ titleFor(file) }}</p>
                  @if (authorFor(file)) {
                    <p class="byline">{{ authorFor(file) }}</p>
                  }
                  <p class="path">{{ file.relativePath }}</p>
                </div>
              </div>

              <div class="actions">
                <button type="button" (click)="read(file.relativePath)" [attr.aria-label]="readLabel(file)">
                  Read
                </button>
              </div>
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
  private readonly destroyRef = inject(DestroyRef);

  private readonly coverUrlByPath = signal<Map<string, string>>(new Map());

  constructor() {
    effect(() => {
      const books = this.store.books();

      this.coverUrlByPath.update((previous) => {
        const next = new Map(previous);
        const stillPresent = new Set<string>();

        for (const book of books) {
          stillPresent.add(book.relativePath);
          const existingUrl = next.get(book.relativePath);
          const blob = book.coverBlob ?? null;

          if (!blob) {
            if (existingUrl) {
              URL.revokeObjectURL(existingUrl);
              next.delete(book.relativePath);
            }
            continue;
          }

          if (!existingUrl) {
            next.set(book.relativePath, URL.createObjectURL(blob));
          }
        }

        for (const [path, url] of next) {
          if (!stillPresent.has(path)) {
            URL.revokeObjectURL(url);
            next.delete(path);
          }
        }

        return next;
      });
    });

    this.destroyRef.onDestroy(() => {
      for (const url of this.coverUrlByPath().values()) {
        URL.revokeObjectURL(url);
      }
      this.coverUrlByPath.set(new Map());
    });
  }

  protected titleFor(file: ScannedFile): string {
    const title = file.epubMetadata?.title?.trim();
    return title && title.length > 0 ? title : file.name;
  }

  protected authorFor(file: ScannedFile): string | null {
    const author = file.epubMetadata?.author?.name?.trim();
    return author && author.length > 0 ? author : null;
  }

  protected coverUrl(file: ScannedFile): string | null {
    return this.coverUrlByPath().get(file.relativePath) ?? null;
  }

  protected coverAlt(file: ScannedFile): string {
    return `Cover of ${this.titleFor(file)}`;
  }

  protected readLabel(file: ScannedFile): string {
    return `Read ${this.titleFor(file)}`;
  }

  protected async read(relativePath: string): Promise<void> {
    await this.router.navigate(["/reader"], { queryParams: { path: relativePath } });
  }
}
