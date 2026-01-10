import { computed, Injectable, signal } from "@angular/core";
import { Audiobook, Track } from "../models/audiobook";

@Injectable({
  providedIn: "root",
})
export class PlayerService {
  private readonly _audiobook = signal<Audiobook | undefined>(undefined);
  readonly audiobook = this._audiobook.asReadonly();
  readonly tracks = computed(() => this._audiobook()?.tracks || []);
  private readonly _track = signal<Track | undefined>(undefined);
  readonly track = this._track.asReadonly();
  private audio: HTMLAudioElement | undefined = undefined;
  private readonly _isPlaying = signal<boolean>(false);
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly duration = computed(() => 0);
  private audioSrc: string | null = null;

  setAudiobook(audiobook: Audiobook) {
    this._audiobook.set(audiobook);
    this.setTrack(audiobook.tracks[0]);
  }

  setTrack(track: Track) {
    this._track.set(track);
    this.initializeAudio();
  }

  private async initializeAudio() {
    this.destroy(false);
    const file = await this._track()?.handle.getFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.audioSrc = url;
    this.audio = new Audio(url);
    if (this._isPlaying()) {
      this.audio.play();
    }
  }

  playPause() {
    if (!this.audio) return;
    if (this.isPlaying()) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
    this._isPlaying.update((isPlaying) => !isPlaying);
  }

  seekBy(seconds: number) {
    if (!this.audio) return;

    const duration = this.audio.duration;
    const nextTime = Math.min(Math.max(0, this.audio.currentTime + seconds), duration);

    this.audio.currentTime = nextTime;
  }

  destroy(destroySignals: boolean = true) {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
    }
    if (this.audioSrc) {
      URL.revokeObjectURL(this.audioSrc);
    }

    if (destroySignals) {
      this._audiobook.set(undefined);
      this._track.set(undefined);
      this._isPlaying.set(false);
    }
  }
}
