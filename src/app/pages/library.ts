import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FileSystemDirectoryHandleWithPermissions } from "../services/file";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Book } from "../models/book";
import { BlobImage } from "../directives/blob-image";
import { AuthorName } from "../pipes/auther-name";
import { MatIconModule } from "@angular/material/icon";
import { MatRippleModule } from "@angular/material/core";
import { BookTitle } from "../pipes/book-title";
import { Link } from "../models/link";
import { Audiobook } from "../models/audiobook";
import { StateService } from "../services/state";

@Component({
  selector: "app-library",
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    BlobImage,
    AuthorName,
    MatRippleModule,
    RouterLink,
    BookTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar>
      <span>Your Library</span>
      <div [style.flex]="1"></div>
      <button matIconButton>
        <mat-icon aria-label="Setup" routerLink="/setup">settings</mat-icon>
      </button>
    </mat-toolbar>
    <div class="main-content">
      <h2>Books</h2>
      <div class="grid">
        @for (book of books(); track book.id) {
          <div>
            <div matRipple class="book mat-corner-lg" [routerLink]="book.id">
              <div class="cover-container">
                <img blobImg class="mat-corner-md mat-shadow-2" [src]="book.coverImage" [alt]="'Cover of ' + book.title" />
                @if (audiobookLinked(book.id)) {
                  <mat-icon>headphones</mat-icon>
                }
              </div>
              <p class="mat-font-title-sm">{{ book.title | bookTitle }}</p>
              <p class="mat-font-body-sm">{{ book.author | authorName }}</p>
            </div>
          </div>
        }
      </div>
      <h2>Audiobooks</h2>
      <div class="grid">
        @for (audiobook of audiobooks(); track audiobook.id) {
          <div>
            <div matRipple class="book mat-corner-lg" [routerLink]="audiobook.id">
              <div class="cover-container">
                <img blobImg class="mat-corner-md mat-shadow-2" [src]="" [alt]="'Cover of ' + audiobook.name" />
              </div>
              <p class="mat-font-title-sm">{{ audiobook.name | bookTitle }}</p>
              <p class="mat-font-body-sm">{{ audiobook.tracks.length }} tracks</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: "./library.css",
  host: { class: "main" },
})
export class Library {
  private readonly stateService = inject(StateService);
  protected hasPermission = signal(false);
  protected directoryHandle = signal<FileSystemDirectoryHandleWithPermissions | null>(null);
  protected books = this.stateService.books;
  protected audiobooks = this.stateService.audiobooks;
  protected links = this.stateService.links;

  protected audiobookLinked(bookId: string): boolean {
    return this.links().some((link) => link.bookId === bookId);
  }
}
