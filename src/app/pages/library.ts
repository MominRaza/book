import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { IDBService } from "../services/idb";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "../services/file";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Book } from "../models/book";
import { BlobImage } from "../directives/blob-image";
import { AuthorName } from "../pipes/auther-name";
import { MatIconModule } from "@angular/material/icon";
import { BooksService } from "../services/books";

@Component({
  selector: "app-library",
  imports: [MatButtonModule, MatToolbarModule, MatIconModule, BlobImage, AuthorName],
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
        <div class="spacer"></div>
        <button matIconButton>
          <mat-icon aria-label="Refresh Library" (click)="refesh()">refresh</mat-icon>
        </button>
      </mat-toolbar>
      <div class="books">
        @for (book of books(); track book.identifier) {
          <div class="book">
            <img blobImg [src]="book.coverImage" [alt]="'Cover of ' + book.title" />
            <h2>{{ book.title }}</h2>
            <p>{{ book.author | authorName }}</p>
          </div>
        } @empty {
          <p>No books found in this folder.</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .spacer {
      flex: 1;
    }

    .no-permission {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      text-align: center;
    }

    .books {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
      padding: 16px;
    }

    .book {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }

    .book img {
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `,
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
