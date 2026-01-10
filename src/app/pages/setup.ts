import { Component, inject, input, linkedSignal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Audiobook } from "../models/audiobook";
import { Book } from "../models/book";
import { AuthorName } from "../pipes/auther-name";
import { BookTitle } from "../pipes/book-title";
import { TruncatedTooltip } from "../directives/truncated-tooltip";
import { Link } from "../models/link";
import { MatMenuModule } from "@angular/material/menu";
import { IDBService } from "../services/idb";
import { Router } from "@angular/router";

@Component({
  selector: "app-setup",
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    BookTitle,
    AuthorName,
    MatCardModule,
    MatListModule,
    MatTooltipModule,
    TruncatedTooltip,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar>
      <span>Setup Books & Audiobooks Links</span>
      <div [style.flex]="1"></div>
      <button [matButton]="'filled'" [disabled]="links().length === 0" (click)="saveLinks()">
        <mat-icon>check</mat-icon> Save
      </button>
    </mat-toolbar>
    <div class="main-content">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Books</mat-card-title>
        </mat-card-header>
        <mat-list>
          @for (book of books(); track book.id) {
            <mat-list-item>
              <div matListItemTitle [matTooltip]="book.title | bookTitle" truncatedTooltip>{{ book.title | bookTitle }}</div>
              <div matListItemLine>{{ book.author | authorName }}</div>
              <div matListItemMeta>
                @let audiobook = linkedAudiobook(book.id);
                <button
                  matIconButton
                  [matMenuTriggerFor]="audiobooksMenu"
                  [matMenuTriggerData]="{ bookId: book.id, linkedAudiobookId: audiobook?.id }"
                  [matTooltip]="audiobook ? (audiobook?.name | bookTitle) : 'Link Audiobook'">
                  <mat-icon>{{ audiobook ? 'link' : 'link_off' }}</mat-icon>
                </button>
              </div>
            </mat-list-item>
          }
        </mat-list>
        <mat-menu #audiobooksMenu="matMenu">
          <ng-template matMenuContent let-bookId="bookId" let-linkedAudiobookId="linkedAudiobookId">
            @for (audiobook of audiobooks(); track audiobook.id) {
              <button mat-menu-item (click)="link(bookId, audiobook.id)">
                @if (linkedAudiobookId === audiobook.id) {
                  <mat-icon>check</mat-icon>
                }
                <span>{{ audiobook.name | bookTitle }}</span>
              </button>
            }
          </ng-template>
        </mat-menu>
      </mat-card>
      <mat-card>
        <mat-card-header>
          <mat-card-title>Audiobooks</mat-card-title>
        </mat-card-header>
        <mat-list>
          @for (audiobook of audiobooks(); track audiobook.id) {
            <mat-list-item>
              <div matListItemTitle [matTooltip]="audiobook.name | bookTitle" truncatedTooltip>{{ audiobook.name | bookTitle }}</div>
              <div matListItemLine>{{ audiobook.tracks.length }} tracks</div>
              <div matListItemMeta>
                @let book = linkedBook(audiobook.id);
                <button
                  matIconButton
                  [matMenuTriggerFor]="booksMenu"
                  [matMenuTriggerData]="{ audiobookId: audiobook.id, linkedBookId: book?.id }"
                  [matTooltip]="book ? (book?.title | bookTitle) : 'Link Book'">
                  <mat-icon>{{ book ? 'link' : 'link_off' }}</mat-icon>
                </button>
              </div>
            </mat-list-item>
          }
        </mat-list>
        <mat-menu #booksMenu="matMenu">
          <ng-template matMenuContent let-audiobookId="audiobookId" let-linkedBookId="linkedBookId">
            @for (book of books(); track book.id) {
              <button mat-menu-item (click)="link(book.id, audiobookId)">
                @if (linkedBookId === book.id) {
                  <mat-icon>check</mat-icon>
                }
                <span>{{ book.title | bookTitle }}</span>
              </button>
            }
          </ng-template>
        </mat-menu>
      </mat-card>
    </div>
  `,
  styles: `
    .main-content {
      display: flex;
      gap: 1rem;
    }

    mat-card {
      width: 0;
      flex: 1;
    }

    h2 {
      margin-inline-start: 1rem;
      margin-block-end: 0.5rem;
    }
  `,
  host: { class: "main" },
})
export class Setup {
  private readonly idbService = inject(IDBService);
  private readonly router = inject(Router);

  protected readonly books = input.required<Book[]>();
  protected readonly audiobooks = input.required<Audiobook[]>();
  protected readonly _links = input.required<Link[]>({ alias: "links" });

  protected readonly links = linkedSignal(this._links);

  protected linkedAudiobook(bookId: string): Audiobook | undefined {
    const link = this.links().find((link) => link.bookId === bookId);
    if (!link) return;
    return this.audiobooks().find((audiobook) => audiobook.id === link.audiobookId);
  }

  protected linkedBook(audiobookId: string): Book | undefined {
    const link = this.links().find((link) => link.audiobookId === audiobookId);
    if (!link) return;
    return this.books().find((book) => book.id === link.bookId);
  }

  protected link(bookId: string, audiobookId: string): void {
    const existingLinks = this.links().filter(
      (link) => link.bookId !== bookId && link.audiobookId !== audiobookId,
    );
    this.links.set([...existingLinks, { bookId, audiobookId }]);
  }

  protected async saveLinks(): Promise<void> {
    await this.idbService.setLinks(this.links());
    this.router.navigate(["/library"]);
  }
}
