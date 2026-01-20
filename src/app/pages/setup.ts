import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Router } from "@angular/router";

import { TruncatedTooltip } from "../directives/truncated-tooltip";
import { Audiobook } from "../models/audiobook";
import { Book } from "../models/book";
import { Link } from "../models/link";
import { AuthorName } from "../pipes/auther-name";
import { IDBService } from "../services/idb";
import { LinksService } from "../services/links";
import { StateService } from "../services/state";

@Component({
  selector: "app-setup",
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
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
              <div matListItemTitle [matTooltip]="book.title" truncatedTooltip>{{ book.title }}</div>
              <div matListItemLine>{{ book.author | authorName }}</div>
              <div matListItemMeta>
                @let audiobook = linkedAudiobook(book.id);
                <button
                  matIconButton
                  [matMenuTriggerFor]="audiobooksMenu"
                  [matMenuTriggerData]="{ bookId: book.id, linkedAudiobookId: audiobook?.id }"
                  [matTooltip]="audiobook ? audiobook.name : 'Link Audiobook'">
                  <mat-icon>{{ audiobook ? 'link' : 'link_off' }}</mat-icon>
                </button>
                @let suggestedAudiobookId = this.bookToAudiobookMap().get(book.id);
                @if (!audiobook && suggestedAudiobookId) {
                  <button
                    matIconButton
                    class="suggestion-button"
                    [matTooltip]="audiobookById(suggestedAudiobookId)?.name"
                    (click)="link(book.id, suggestedAudiobookId)">
                    <mat-icon>lightbulb</mat-icon>
                    <mat-icon>check</mat-icon>
                  </button>
                }
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
                <span>{{ audiobook.name }}</span>
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
              <div matListItemTitle [matTooltip]="audiobook.name" truncatedTooltip>{{ audiobook.name }}</div>
              <div matListItemLine>{{ audiobook.tracks.length }} tracks</div>
              <div matListItemMeta>
                @let book = linkedBook(audiobook.id);
                <button
                  matIconButton
                  [matMenuTriggerFor]="booksMenu"
                  [matMenuTriggerData]="{ audiobookId: audiobook.id, linkedBookId: book?.id }"
                  [matTooltip]="book ? book.title : 'Link Book'">
                  <mat-icon>{{ book ? 'link' : 'link_off' }}</mat-icon>
                </button>
                @let suggestedBookId = this.audiobookToBookMap().get(audiobook.id);
                @if (!book && suggestedBookId) {
                  <button
                    matIconButton
                    class="suggestion-button"
                    [matTooltip]="bookById(suggestedBookId)?.title"
                    (click)="link(suggestedBookId, audiobook.id)">
                    <mat-icon>lightbulb</mat-icon>
                    <mat-icon>check</mat-icon>
                  </button>
                }
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
                <span>{{ book.title }}</span>
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

    .suggestion-button {
      mat-icon:last-of-type {
        display: none;
      }
      &:hover mat-icon {
        &:last-of-type {
          display: inline;
        }
        &:first-of-type {
          display: none;
        }
      }
    }
  `,
  host: { class: "main" },
})
export class Setup implements OnInit {
  private readonly idbService = inject(IDBService);
  private readonly router = inject(Router);
  private readonly stateService = inject(StateService);
  private readonly linksService = inject(LinksService);

  protected readonly books = this.stateService.books;
  protected readonly audiobooks = this.stateService.audiobooks;

  protected readonly links = this.stateService.links;
  private readonly linkSuggestions = signal<Link[]>([]);
  protected readonly bookToAudiobookMap = computed(
    () => new Map(this.linkSuggestions().map((ls) => [ls.bookId, ls.audiobookId])),
  );
  protected readonly audiobookToBookMap = computed(
    () => new Map(this.linkSuggestions().map((ls) => [ls.audiobookId, ls.bookId])),
  );

  ngOnInit(): void {
    if (
      !this.stateService.permissionsGranted() ||
      (this.books().length === 0 && this.audiobooks().length === 0)
    ) {
      this.router.navigate(["../"], { replaceUrl: true });
    }

    this.linkSuggestions.set(this.linksService.linkSuggestions());
  }

  protected linkedAudiobook(bookId: string): Audiobook | undefined {
    const link = this.links().find((link) => link.bookId === bookId);
    if (!link) return;
    return this.audiobookById(link.audiobookId);
  }

  protected linkedBook(audiobookId: string): Book | undefined {
    const link = this.links().find((link) => link.audiobookId === audiobookId);
    if (!link) return;
    return this.bookById(link.bookId);
  }

  protected bookById(bookId: string): Book | undefined {
    return this.books().find((book) => book.id === bookId);
  }

  protected audiobookById(audiobookId: string): Audiobook | undefined {
    return this.audiobooks().find((audiobook) => audiobook.id === audiobookId);
  }

  protected link(bookId: string, audiobookId: string): void {
    const existingLinks = this.links().filter(
      (link) => link.bookId !== bookId && link.audiobookId !== audiobookId,
    );
    this.stateService.setLinks([
      ...existingLinks,
      this.linksService.createNewLink(bookId, audiobookId),
    ]);
  }

  protected async saveLinks(): Promise<void> {
    await this.idbService.setLinks(this.links());
    this.router.navigate(["/library"]);
  }
}
