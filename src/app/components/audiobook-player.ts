import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LibraryStoreService } from '../services/library-store';

@Component({
  selector: 'app-audiobook-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.player-dock]': 'true',
    '[class.hidden]': '!store.audioObjectUrl()',
  },
  styles: [
    `:host(.player-dock){
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 1000;
      width: min(28rem, calc(100vw - 2rem));
    }

    :host(.hidden){
      display: none !important;
    }

    .player-card{
      border: 1px solid GrayText;
      border-radius: 1rem;
      padding: 0.75rem;
      background: Canvas;
    }

    .player-audio{
      width: 100%;
    }

    .player-actions{
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .player-error{
      margin-top: 0.5rem;
    }

    .player-title{ margin: 0; }
    .player-track{ margin: 0.5rem 0; }
    .player-track-label{ display: inline-block; margin-right: 0.5rem; opacity: 0.8; }
    `,
  ],
  template: `
    @if (store.audioObjectUrl()) {
      <section class="player-card" aria-labelledby="player-heading">
        <h3 id="player-heading" class="player-title">Now Playing</h3>

        @if (store.playerErrorMessage()) {
          <p class="player-error" role="alert">{{ store.playerErrorMessage() }}</p>
        }

        <p class="player-track">
          <span class="player-track-label">Track</span>
          <strong class="player-track-name">{{ store.nowPlaying()?.relativePath }}</strong>
        </p>

        <audio class="player-audio" controls autoplay [src]="store.audioObjectUrl()"></audio>

        <div class="player-actions">
          <button type="button" (click)="store.stopAudiobook()">Stop</button>
        </div>
      </section>
    }
  `,
})
export class AudiobookPlayer {
  protected readonly store = inject(LibraryStoreService);
}
