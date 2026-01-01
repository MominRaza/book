import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FileService } from "../services/file";
import { Router } from "@angular/router";

@Component({
  selector: "app-home",
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon class="mat-icon-64">menu_book</mat-icon>
    <h1 class="mat-font-headline-lg">Welcome to Your Library</h1>
    <p class="mat-font-body-md">Start your reading journey by selecting your books directory</p>
    <div class="button-group">
      <button [matButton]="epubFiles().length > 0 ? 'outlined' : 'filled'" (click)="selectBooksDirectory()">
        <mat-icon>folder_open</mat-icon>
        @if (epubFiles().length > 0) { Change } @else { Select } Books Directory
      </button>
      @if (epubFiles().length > 0) {
        <button matButton="filled" (click)="continue()">
          <mat-icon>save</mat-icon>
          Continue
        </button>
      }
    </div>
    <p class="mat-font-body-sm">
      @if (epubFiles().length > 0) {
        {{ epubFiles().length }} EPUB files found.
      } @else {
        Choose a folder containing your EPUB books
      }
    </p>
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
    .button-group {
      display: flex;
      gap: 16px;
    }
    button {
      margin-top: 16px;
    }
  `,
})
export class HomePage {
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);
  private directoryHandle = signal<FileSystemDirectoryHandle | null>(null);
  protected epubFiles = signal<FileSystemFileHandle[]>([]);

  async selectBooksDirectory() {
    const directoryHandle = await this.fileService.directoryPicker();
    if (directoryHandle === null) return;
    const hasPermission = await this.fileService.verifyPermission(directoryHandle);
    if (hasPermission) {
      this.epubFiles.set(await this.fileService.readFiles(directoryHandle, ".epub"));
      this.directoryHandle.set(directoryHandle);
    }
  }

  continue() {
    this.router.navigate(["/library"], { replaceUrl: true });
  }
}
