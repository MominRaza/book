import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { IDBService } from "../services/idb";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "../services/file";
import { MatButtonModule } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Book } from "../models/book";
import { BlobImage } from "../directives/blob-image";
import { AuthorName } from "../pipes/auther-name";
import { MatIconModule } from "@angular/material/icon";
import { BooksService } from "../services/books";
import { MatRippleModule } from "@angular/material/core";
import { BookTitle } from "../pipes/book-title";

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
    @if (!hasPermission()) {
      <div class="no-permission">
        <p class="mat-font-body-lg">
          Allow permission to access selected folder — {{ directoryHandle()?.name }}.
        </p>
        <button matButton="filled" (click)="requestPermission()">Request Permission</button>
      </div>
    } @else {
      <mat-toolbar>
        <span>Your Library</span>
        <div [style.flex]="1"></div>
        <button matIconButton>
          <mat-icon aria-label="Refresh Library" (click)="refesh()">refresh</mat-icon>
        </button>
      </mat-toolbar>
      <div class="books">
        <div class="grid">
          @for (book of books(); track book.identifier) {
            <div>
              <div matRipple class="book mat-corner-lg" [routerLink]="book.identifier">
                <img blobImg class="mat-corner-md mat-shadow-2" [src]="book.coverImage" [alt]="'Cover of ' + book.title" />
                <h2 class="mat-font-title-sm">{{ book.title | bookTitle }}</h2>
                <p class="mat-font-body-sm">{{ book.author | authorName }}</p>
              </div>
            </div>
          } @empty {
            <p>No books found in this folder.</p>
          }
        </div>
      </div>
    }
  `,
  styleUrl: "./library.css",
})
export class LibraryPage implements OnInit {
  private readonly idbService = inject(IDBService);
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);
  private readonly booksService = inject(BooksService);
  protected hasPermission = signal(false);
  protected directoryHandle = signal<FileSystemDirectoryHandleWithPermissions | null>(null);
  protected books = signal<Book[]>([]);

  async ngOnInit() {
    const directoryHandle = await this.idbService.getDirectoryHandle("books");
    if (directoryHandle) {
      const permission = await this.fileService.verifyPermission(directoryHandle, false);
      this.hasPermission.set(permission);
      this.directoryHandle.set(directoryHandle);
      if (permission) this.loadBooks();
    } else {
      this.router.navigate(["/"], { replaceUrl: true });
    }
  }

  async requestPermission() {
    const directoryHandle = this.directoryHandle();
    if (!directoryHandle) return;
    const permission = await this.fileService.verifyPermission(directoryHandle);
    this.hasPermission.set(permission);
    if (permission) this.loadBooks();
  }

  private async loadBooks() {
    const directoryHandle = this.directoryHandle();
    if (!directoryHandle) return;
    this.books.set(await this.idbService.getAllBooks());
  }

  protected async refesh() {
    const directoryHandle = this.directoryHandle();
    if (!directoryHandle) return;
    await this.booksService.saveBooks(directoryHandle);
    this.loadBooks();
  }
}
