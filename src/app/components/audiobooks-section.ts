import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LibraryStoreService } from '../services/library-store';
import { AudiobookPlayer } from './audiobook-player';
import { FileDebug } from './file-debug';

@Component({
  selector: 'app-audiobooks-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AudiobookPlayer, FileDebug],
  styles: [
    `li {
      border: 1px solid GrayText;
      border-radius: 0.75rem;
      padding: 0.75rem;
      margin: 0.5rem 0;
    }

    li>button {
      margin-right: 0.75rem;
    }
    `,
  ],
  template: `
    <section aria-labelledby="audio-heading">
      <h2 id="audio-heading">Audiobooks (.m4b)</h2>

      <app-audiobook-player />

      @if (store.audiobooks().length === 0) {
        <p>No audiobooks found.</p>
      } @else {
        <ul>
          @for (file of store.audiobooks(); track file.relativePath) {
            <li>
              <button type="button" (click)="store.playAudiobook(file)">Play</button>
              <strong>{{ file.relativePath }}</strong>
              <app-file-debug [file]="file" />
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class AudiobooksSection {
  protected readonly store = inject(LibraryStoreService);
}
