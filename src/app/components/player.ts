import { Component, inject, OnDestroy, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSliderModule } from "@angular/material/slider";
import { PlayerService } from "../services/player";
import { Time } from "../pipes/time";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";

@Component({
  selector: "app-player",
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatMenuModule,
    Time,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    @if (expanded()) {
      <div class="player mat-bg-surface-container">
        <div>
          <p class="mat-font-title-md ellipsis">{{ playerService.track()?.name }}</p>
          <p class="mat-font-body-sm ellipsis">{{ playerService.audiobook()?.name }}</p>
        </div>
        <div class="controls">
          <button matIconButton (click)="playerService.seekTrack(-1)" [disabled]="!playerService.hasPreviousTrack()">
            <mat-icon>skip_previous</mat-icon>
          </button>
          <button matIconButton (click)="playerService.seekBy(-30)">
            <mat-icon>replay_30</mat-icon>
          </button>
          <button matIconButton (click)="playerService.playPause()">
            <mat-icon>{{playerService.isPlaying() ? 'pause' : 'play_arrow'}}</mat-icon>
          </button>
          <button matIconButton (click)="playerService.seekBy(30)">
            <mat-icon>forward_30</mat-icon>
          </button>
          <button matIconButton (click)="playerService.seekTrack(1)" [disabled]="!playerService.hasNextTrack()">
            <mat-icon>skip_next</mat-icon>
          </button>
        </div>
        <div class="progress-container">
          <span>{{ playerService.currentTime() | time }}</span>
          @let duration = playerService.duration() || 0;
          <mat-slider [max]="duration" [step]="0">
            <input matSliderThumb [value]="playerService.currentTime()" (input)="playerService.setCurrentTime($event.target.valueAsNumber)" />
          </mat-slider>
          <span>{{ duration | time }}</span>
        </div>
        <div class="controls">
          <button matIconButton (click)="playerService.toggleSync()">
            <mat-icon>{{ playerService.sync() ? 'sync' : 'sync_disabled' }}</mat-icon>
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
                {{ track.name }}
              </button>
            }
          </mat-menu>
          <button
            matIconButton
            [matMenuTriggerFor]="speedMenu"
            [matTooltip]="'Playback speed: ' + playerService.playbackRate() + 'x'">
            <mat-icon>speed</mat-icon>
          </button>
          <button matIconButton [matMenuTriggerFor]="volumeMenu">
            <mat-icon>{{ playerService.volume() === 0 ? 'volume_off' : playerService.volume() < 0.5 ? 'volume_down' : 'volume_up' }}</mat-icon>
          </button>
          <button matIconButton (click)="expanded.set(false)">
            <mat-icon>expand_more</mat-icon>
          </button>
        </div>
      </div>
    } @else {
      <div class="player-compact mat-corner-xl mat-bg-surface-container" [matTooltip]="playerService.track()?.name">
        <button matIconButton [color]="'primary'" (click)="playerService.playPause()">
          <mat-icon>{{playerService.isPlaying() ? 'pause' : 'play_arrow'}}</mat-icon>
        </button>
        @if (playerService.isPlaying()) {
          <span class="time">
            {{ playerService.currentTime() | time }} / {{ playerService.duration() ?? 0 | time }}
          </span>
        }
        @if (playerService.isPlaying()) {
          <button
            matIconButton
            [matMenuTriggerFor]="speedMenu"
            [matTooltip]="'Playback speed: ' + playerService.playbackRate() + 'x'">
            <mat-icon>speed</mat-icon>
          </button>
          <button matIconButton [matMenuTriggerFor]="volumeMenu">
            <mat-icon>{{ playerService.volume() === 0 ? 'volume_off' : playerService.volume() < 0.5 ? 'volume_down' : 'volume_up' }}</mat-icon>
          </button>
        }
        <button matIconButton (click)="expanded.set(true)">
          <mat-icon>expand_less</mat-icon>
        </button>
      </div>
    }

    <mat-menu class="speed-menu" #speedMenu="matMenu">
      @for (rate of playbackRates; track rate) {
        <button mat-menu-item (click)="playerService.setPlaybackRate(rate)">
          @if (rate === playerService.playbackRate()) {
            <mat-icon>check</mat-icon>
          }
          <span>{{ rate }}x</span>
        </button>
      }
      <mat-divider />
      <mat-slider class="slider" [min]="0.5" [max]="3.5" [step]="0.1" [discrete]="true">
        <input matSliderThumb [value]="playerService.playbackRate()" (input)="playerService.setPlaybackRate($event.target.valueAsNumber)" />
      </mat-slider>
    </mat-menu>

    <mat-menu class="volume-menu" #volumeMenu="matMenu">
      <mat-slider class="slider" [min]="0" [max]="1" [step]="0.02" [discrete]="true" [displayWith]="displayVolume">
        <input matSliderThumb [value]="playerService.volume()" (input)="playerService.setVolume($event.target.valueAsNumber)" />
      </mat-slider>
    </mat-menu>
  `,
  styles: `
    .player {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.25rem;
      padding-inline-start: 0.5rem;
      display: grid;
      grid-template-columns: minmax(100px, 250px) auto 1fr auto;
      align-items: center;
      gap: 1.5rem;
    }

    .controls {
      display: flex;
    }

    .progress-container {
      display: flex;
      align-items: center;
      height: 2.5rem;
    }

    .progress-container mat-slider {
      flex: 1;
      margin-inline: 1rem;
    }

    .player-compact {
      position: absolute;
      bottom: 0;
      right: 0;
      margin: 0.25rem;
      display: flex;
      align-items: center;
    }

    .player-compact .time {
      padding-inline: 0.25rem;
    }

    ::ng-deep .speed-menu .mat-mdc-menu-content {
      padding-bottom: 0;
    }

    mat-divider {
      margin-bottom: 0 !important;
    }

    ::ng-deep .volume-menu {
      overflow: visible !important;
    }

    ::ng-deep .volume-menu .mat-mdc-menu-content {
      padding: 0;
    }

    .slider {
      margin-inline: 21px;
    }
  `,
  host: { "[style.display]": 'playerService.audiobook() ? "block" : "none"' },
})
export class Player implements OnDestroy {
  protected readonly playerService = inject(PlayerService);
  protected readonly expanded = signal(false);
  protected readonly playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  protected displayVolume(value: number): string {
    return Math.round(value * 100).toString();
  }

  ngOnDestroy(): void {
    this.playerService.destroy();
  }
}
