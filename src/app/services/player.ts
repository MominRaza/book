import { computed, Injectable, signal } from "@angular/core";
import { Audiobook, Track } from "../models/audiobook";

@Injectable({
  providedIn: "root",
})
export class PlayerService {
  readonly audiobook = signal<Audiobook | undefined>(undefined);
  readonly tracks = computed(() => this.audiobook()?.tracks || []);
  readonly track = signal<Track | undefined>(undefined);
  private audio: HTMLAudioElement | undefined = undefined;
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number | undefined>(undefined);
  private audioSrc: string | undefined = undefined;
  readonly hasNextTrack = computed(() => this.track()?.order !== this.tracks().length);
  readonly hasPreviousTrack = computed(() => this.track()?.order !== 1);
  readonly volume = signal<number>(0.75);

  setAudiobook(audiobook: Audiobook) {
    this.audiobook.set(audiobook);
    this.setTrack(audiobook.tracks[0]);
  }

  setTrack(track: Track) {
    this.track.set(track);
    this.initializeAudio();
  }

  private async initializeAudio() {
    this.destroy(false);
    const file = await this.track()?.handle.getFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.audioSrc = url;
    this.audio = new Audio(url);
    this.audio.volume = this.volume();
    if (this.isPlaying()) {
      this.audio.play();
    }

    this.audio.addEventListener("loadedmetadata", () => {
      this.duration.set(this.audio?.duration);
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime.set(this.audio?.currentTime || 0);
    });

    this.audio.addEventListener("ended", () => {
      if (this.hasNextTrack()) {
        this.seekTrack(1);
      } else {
        this.isPlaying.set(false);
      }
    });
  }

  playPause() {
    if (!this.audio) return;
    if (this.isPlaying()) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
    this.isPlaying.update((isPlaying) => !isPlaying);
  }

  seekBy(seconds: number) {
    if (!this.audio) return;

    const duration = this.audio.duration;
    const nextTime = Math.min(Math.max(0, this.audio.currentTime + seconds), duration);

    this.audio.currentTime = nextTime;
  }

  seekTrack(direction: 1 | -1) {
    const tracks = this.tracks();
    const currentTrack = this.track();
    if (!currentTrack) return;
    const track = tracks.find((t) => t.order === currentTrack.order + direction);
    if (track) {
      this.setTrack(track);
    }
  }

  setVolume(event: Event) {
    const volume = (event.target as HTMLInputElement).valueAsNumber;
    this.volume.set(volume);
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  setCurrentTime(event: Event) {
    const time = (event.target as HTMLInputElement).valueAsNumber;
    if (this.audio) {
      this.audio.currentTime = time;
    }
    this.currentTime.set(time);
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
      this.audiobook.set(undefined);
      this.track.set(undefined);
      this.isPlaying.set(false);
      this.currentTime.set(0);
      this.duration.set(undefined);
    }
  }
}
