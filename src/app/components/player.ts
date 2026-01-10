import { Component, inject, OnDestroy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { PlayerService } from "../services/player";
import { TrackName } from "../pipes/track-name";
import { BookTitle } from "../pipes/book-title";

@Component({
  selector: "app-player",
  imports: [MatButtonModule, MatIconModule, MatSliderModule, MatMenuModule, TrackName, BookTitle],
  template: `
    <div class="progress-container">
      <span>0:00</span>
      <mat-slider class="progress-bar" [max]="playerService.duration() || 0">
        <input matSliderThumb/>
      </mat-slider>
      <span>{{ playerService.duration() }}</span>
    </div>
    <div class="player-container">
      <img src="" />
      <span>{{ playerService.track()?.name | trackName }}</span>
      <span>{{ playerService.audiobook()?.name | bookTitle }}</span>
      <button matIconButton (click)="playerService.seekTrack(-1)" [disabled]="!playerService.hasPreviousTrack()">
        <mat-icon>skip_previous</mat-icon>
      </button>
      <button matIconButton (click)="playerService.seekBy(-10)">
        <mat-icon>replay_10</mat-icon>
      </button>
      <button matIconButton (click)="playerService.playPause()">
        <mat-icon>{{playerService.isPlaying() ? 'pause' : 'play_arrow'}}</mat-icon>
      </button>
      <button matIconButton (click)="playerService.seekBy(10)">
        <mat-icon>forward_10</mat-icon>
      </button>
      <button matIconButton (click)="playerService.seekTrack(1)" [disabled]="!playerService.hasNextTrack()">
        <mat-icon>skip_next</mat-icon>
      </button>
      <button matIconButton [matMenuTriggerFor]="playlistMenu">
        <mat-icon>playlist_play</mat-icon>
      </button>
      <mat-menu #playlistMenu="matMenu">
        @for (track of playerService.tracks(); track track.id) {
          <button mat-menu-item (click)="playerService.setTrack(track)">
            @if (track.id === playerService.track()?.id) {
              <mat-icon>play_arrow</mat-icon>
            }
            {{track.name | trackName}}
          </button>
        }
      </mat-menu>
      <button matIconButton [matMenuTriggerFor]="volumeMenu">
        <mat-icon>{{ playerService.volume() === 0 ? 'volume_off' : playerService.volume() < 0.5 ? 'volume_down' : 'volume_up' }}</mat-icon>
      </button>
      <mat-menu #volumeMenu="matMenu">
        <mat-slider [min]="0" [max]="1" [step]="0.02">
          <input matSliderThumb [value]="playerService.volume()" (input)="playerService.setVolume($event)" />
        </mat-slider>
      </mat-menu>
      <button matIconButton>
        <mat-icon>expand_more</mat-icon>
      </button>
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: black;
    }

    .progress-container {
      display: flex;
      align-items: center;
      padding-inline: 0.75rem;
    }

    .progress-bar {
      flex: 1;
      margin-inline: 1.25rem;
    }
  `,
  host: { "[style.display]": 'playerService.audiobook() ? "block" : "none"' },
})
export class Player implements OnDestroy {
  protected readonly playerService = inject(PlayerService);

  ngOnDestroy(): void {
    this.playerService.destroy();
  }
}
