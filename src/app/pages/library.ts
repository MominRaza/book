import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LibraryStoreService } from '../services/library-store';

@Component({
  selector: 'app-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JsonPipe],
  template: `
    <main>
      <h1>Your Library</h1>

      <p>
        <a routerLink="/setup">Change folders</a>
      </p>

      <section aria-labelledby="books-heading">
        <h2 id="books-heading">Books (.epub)</h2>
        @if (store.books().length === 0) {
          <p>No books found.</p>
        } @else {
          <ul>
            @for (file of store.books(); track file.relativePath) {
              <li>
                <strong>{{ file.relativePath }}</strong>
                <pre>{{ file | json }}</pre>
              </li>
            }
          </ul>
        }
      </section>

      <section aria-labelledby="audio-heading">
        <h2 id="audio-heading">Audiobooks (.m4b)</h2>

        <section aria-labelledby="player-heading">
          <h3 id="player-heading">Player</h3>
          @if (store.playerErrorMessage()) {
            <p role="alert">{{ store.playerErrorMessage() }}</p>
          }

          @if (store.audioObjectUrl()) {
            <p>
              Now playing:
              <strong>{{ store.nowPlaying()?.relativePath }}</strong>
            </p>
            <audio controls autoplay [src]="store.audioObjectUrl()"></audio>
            <p>
              <button type="button" (click)="stop()">Stop</button>
            </p>
          } @else {
            <p>Select an audiobook to play.</p>
          }
        </section>

        @if (store.audiobooks().length === 0) {
          <p>No audiobooks found.</p>
        } @else {
          <ul>
            @for (file of store.audiobooks(); track file.relativePath) {
              <li>
                <button type="button" (click)="play(file)">Play</button>
                <strong>{{ file.relativePath }}</strong>
                <pre>{{ file | json }}</pre>
              </li>
            }
          </ul>
        }
      </section>

      @if (!store.hasCache()) {
        <p>
          No cached library found.
          <button type="button" (click)="goSetup()">Go to setup</button>
        </p>
      }
    </main>
  `,
})
export class Library {
  protected readonly store = inject(LibraryStoreService);
  private readonly router = inject(Router);

  protected async goSetup(): Promise<void> {
    await this.router.navigateByUrl('/setup');
  }

  protected async play(file: Parameters<LibraryStoreService['playAudiobook']>[0]): Promise<void> {
    await this.store.playAudiobook(file);
  }

  protected stop(): void {
    this.store.stopAudiobook();
  }
}
