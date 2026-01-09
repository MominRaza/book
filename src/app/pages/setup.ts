import { Component, input } from "@angular/core";
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
import { Handles } from "../resolver/handles";
import { TruncatedTooltip } from "../directives/truncated-tooltip";

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
  ],
  template: `
    <mat-toolbar>
      <span>Setup Books & Audiobooks Links</span>
      <div [style.flex]="1"></div>
      <button [matButton]="'filled'">
        <mat-icon>check</mat-icon> Save
      </button>
    </mat-toolbar>
    <div class="main-content">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Books</mat-card-title>
        </mat-card-header>
        <mat-list>
          @for (book of books(); track book.identifier) {
            <mat-list-item>
              <div matListItemTitle>{{ book.title | bookTitle }}</div>
              <div matListItemLine>{{ book.author | authorName }}</div>
              <div matListItemMeta>
              </div>
            </mat-list-item>
          }
        </mat-list>
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
              </div>
            </mat-list-item>
          }
        </mat-list>
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

    mat-card:first-of-type {
      flex: 2;
    }

    h2 {
      margin-inline-start: 1rem;
      margin-block-end: 0.5rem;
    }
  `,
  host: { class: "main" },
})
export class Setup {
  protected readonly handles = input.required<Handles>();
  protected readonly books = input.required<Book[]>();
  protected readonly audiobooks = input.required<Audiobook[]>();
}
