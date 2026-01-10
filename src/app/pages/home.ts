import { Component, ChangeDetectionStrategy, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { Router } from "@angular/router";
import { AudiobooksService } from "../services/audiobooks";
import { BooksService } from "../services/books";
import { FileService } from "../services/file";
import { IDBService } from "../services/idb";
import { StateService } from "../services/state";

@Component({
  selector: "app-home",
  imports: [MatButtonModule, MatIconModule, MatListModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon class="mat-icon-64">menu_book</mat-icon>
    <h1 class="mat-font-headline-lg">Welcome to Your Library</h1>
    <p class="mat-font-body-md">Get started by selecting your books and audiobooks directory</p>

    @if (booksDirectoryHandle() || audiobooksDirectoryHandle()) {
      <mat-card>
        <mat-list>
          @if (booksDirectoryHandle()) {
            <mat-list-item>
              <mat-icon matListItemIcon>folder</mat-icon>
              <div matListItemTitle>Books Directory</div>
              <div matListItemLine>{{ booksDirectoryHandle()?.name }}</div>
              <div matListItemMeta>
                <button matIconButton (click)="selectBooksDirectory()">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </mat-list-item>
          }
          @if (audiobooksDirectoryHandle()) {
            <mat-divider/>
            <mat-list-item>
              <mat-icon matListItemIcon>folder</mat-icon>
              <div matListItemTitle>Audiobooks Directory</div>
              <div matListItemLine>{{ audiobooksDirectoryHandle()?.name }}</div>
              <div matListItemMeta>
                <button matIconButton (click)="selectAudiobooksDirectory()">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </mat-list-item>
          }
        </mat-list>
      </mat-card>
    }

    @if (!booksDirectoryHandle()) {
      <button matButton="filled" (click)="selectBooksDirectory()">
        <mat-icon>folder_open</mat-icon>
        Select Books Directory
      </button>
      <p class="mat-font-body-sm">Choose a folder containing your books EPUB files</p>
    } @else if (!audiobooksDirectoryHandle()) {
      <button matButton="filled" (click)="selectAudiobooksDirectory()">
        <mat-icon>folder_open</mat-icon>
        Select Audiobooks Directory
      </button>
      <p class="mat-font-body-sm">Choose a folder containing your audiobooks subfolders with M4B files</p>
    } @else {
      <button matButton="filled" (click)="continue()">
        <mat-icon>arrow_forward</mat-icon>
        Continue
      </button>
    }
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

    mat-card {
      margin-top: 16px;
      min-width: min(480px, calc(100% - 32px));
    }

    mat-list {
      padding: 0;
    }

    mat-list-item {
      margin-bottom: 8px;
    }

    button {
      margin-top: 16px;
    }
  `,
})
export class Home implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly router = inject(Router);
  private readonly idbService = inject(IDBService);
  private readonly booksService = inject(BooksService);
  private readonly audiobooksService = inject(AudiobooksService);
  protected readonly stateService = inject(StateService);

  protected readonly booksDirectoryHandle = this.stateService.booksHandle;
  protected readonly audiobooksDirectoryHandle = this.stateService.audiobooksHandle;

  async ngOnInit() {
    if (!this.stateService.permissionsGranted()) return;
    if (this.stateService.books().length === 0) return;
    if (this.stateService.audiobooks().length === 0) return;
    const links = this.stateService.links();
    this.router.navigate([links.length > 0 ? "/library" : "/setup"], { replaceUrl: true });
  }

  protected async selectBooksDirectory() {
    const handle = await this.fileService.directoryPicker();
    if (handle) {
      await this.idbService.setDirectoryHandle("books", handle);
      this.stateService.setBooksHandle(handle);
    }
  }

  protected async selectAudiobooksDirectory() {
    const handle = await this.fileService.directoryPicker();
    if (handle) {
      await this.idbService.setDirectoryHandle("audiobooks", handle);
      this.stateService.setAudiobooksHandle(handle);
    }
  }

  protected async continue() {
    const booksHandle = this.booksDirectoryHandle();
    const audiobooksHandle = this.audiobooksDirectoryHandle();

    if (booksHandle && audiobooksHandle) {
      await this.booksService.saveBooks(booksHandle);
      await this.audiobooksService.saveAudiobooks(audiobooksHandle);
    }

    this.stateService.setPermissionsGranted(true);
    this.router.navigate(["/setup"], { replaceUrl: true });
  }
}
