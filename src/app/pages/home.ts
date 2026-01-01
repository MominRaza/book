import { Component, ChangeDetectionStrategy, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FileService } from "../services/file";
import { Router } from "@angular/router";
import { IDBService } from "../services/idb";
import { BooksService } from "../services/books";

@Component({
  selector: "app-home",
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon class="mat-icon-64">menu_book</mat-icon>
    <h1 class="mat-font-headline-lg">Welcome to Your Library</h1>
    <p class="mat-font-body-md">Start your reading journey by selecting your books directory</p>
    <button matButton="filled" (click)="selectBooksDirectory()">
      <mat-icon>folder_open</mat-icon>
      Select Books Directory
    </button>
    <p class="mat-font-body-sm">Choose a folder containing your EPUB books</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
    }

    button {
      margin-top: 16px;
    }
  `,
})
export class HomePage implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);
  private readonly idbService = inject(IDBService);
  private readonly booksService = inject(BooksService);

  async ngOnInit() {
    const directoryHandle = await this.idbService.getDirectoryHandle("books");
    if (directoryHandle) this.router.navigate(["/library"], { replaceUrl: true });
  }

  async selectBooksDirectory() {
    const directoryHandle = await this.fileService.directoryPicker();
    if (directoryHandle === null) return;

    await this.booksService.saveBooks(directoryHandle);

    await this.idbService.setDirectoryHandle("books", directoryHandle);
    this.router.navigate(["/library"], { replaceUrl: true });
  }
}
