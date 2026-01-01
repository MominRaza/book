import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { IDBService } from "../services/idb";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "../services/file";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Book } from "../models/book";
import { BlobImage } from "../directives/blob-image";
import { AuthorName } from "../pipes/auther-name";

@Component({
  selector: "app-library",
  imports: [MatButtonModule, MatToolbarModule, BlobImage, AuthorName],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar>
      <span>Your Library</span>
    </mat-toolbar>
    @if (!hasPermission()) {
      <div class="no-permission">
        <p class="mat-font-body-lg">
          Allow permission to access selected folder — {{ directoryHandle()?.name }}.
        </p>
        <button matButton="filled" (click)="requestPermission()">Request Permission</button>
      </div>
    } @else {
      <div>
        @for (book of books(); track book.identifier) {
          <div>
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
    .no-permission {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      text-align: center;
    }
  `,
})
export class LibraryPage implements OnInit {
  private readonly idbService = inject(IDBService);
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);
  protected hasPermission = signal(false);
  protected directoryHandle = signal<FileSystemDirectoryHandleWithPermissions | null>(null);
  protected epubFiles = signal<FileSystemFileHandle[]>([]);
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
    this.epubFiles.set(await this.fileService.readFiles(directoryHandle, ".epub"));
    this.books.set(await this.idbService.getAllBooks());
  }
}
