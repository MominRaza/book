import { Component, ChangeDetectionStrategy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-home",
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon class="mat-icon-64">menu_book</mat-icon>
    <h1 class="mat-font-headline-lg">Welcome to Your Library</h1>
    <p class="mat-font-body-md">Start your reading journey by selecting your books directory</p>
    <button matButton="filled">
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
export class HomePage {}
