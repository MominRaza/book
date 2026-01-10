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
  private readonly audio = signal<HTMLAudioElement | undefined>(undefined);
  private readonly _isPlaying = signal<boolean>(false);
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly duration = computed(() => this.audio()?.duration);

  setAudiobook(audiobook: Audiobook) {
    this._audiobook.set(audiobook);
    this._track.set(audiobook.tracks[0]);
    this.initializeAudio();
  }

  private async initializeAudio() {
    const file = await this.track()?.handle.getFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    this.audio.set(audio);
    this._isPlaying.set(false);
  }

  playPause() {
    const audio = this.audio();
    if (!audio) return;
    if (this.isPlaying()) {
      audio.pause();
    } else {
      audio.play();
    }
    this._isPlaying.update((isPlaying) => !isPlaying);
  }

  seekBy(seconds: number) {
    const audio = this.audio();
    if (!audio) return;

    const duration = audio.duration;
    const nextTime = Math.min(Math.max(0, audio.currentTime + seconds), duration);

    audio.currentTime = nextTime;
  }
}
