import { computed, inject, Injectable, Injector, signal } from "@angular/core";
import { Audiobook, Track } from "../models/audiobook";
import { ReaderService } from "./reader";
import { Link } from "../models/link";

@Injectable({
  providedIn: "root",
})
export class PlayerService {
  private readonly injector = inject(Injector);
  readonly audiobook = signal<Audiobook | undefined>(undefined);
  private readonly link = signal<Link | undefined>(undefined);
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
  readonly playbackRate = signal<number>(1);
  readonly sync = signal<boolean>(true);
  readonly canSync = computed(() => this.sync() && this.href() !== undefined);
  private readonly href = computed(() => this.link()?.chapterMap?.[this.track()?.id ?? ""]);

  setAudiobook(audiobook: Audiobook) {
    this.audiobook.set(audiobook);
    this.setTrack(audiobook.tracks[0]);
  }

  setLink(link: Link) {
    this.link.set(link);
  }

  setTrack(track: Track, byReader: boolean = false) {
    this.track.set(track);
    this.initializeAudio();

    if (this.sync() && !byReader) {
      this.syncReader();
    }
  }

  private async initializeAudio() {
    this.destroy(false);
    const file = await this.track()?.handle.getFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.audioSrc = url;
    this.audio = new Audio(url);
    this.audio.volume = this.volume();
    this.audio.playbackRate = this.playbackRate();
    if (this.isPlaying()) {
      this.audio.play();
    }

    this.audio.addEventListener("loadedmetadata", () => {
      this.duration.set(this.audio?.duration);
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime.set(this.audio?.currentTime || 0);
      if (this.canSync()) {
        this.injector.get(ReaderService).goToFraction(this.currentTime() / (this.duration() || 1));
      }
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

  setVolume(volume: number) {
    this.volume.set(volume);
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  setPlaybackRate(rate: number) {
    this.playbackRate.set(rate);
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  setCurrentTime(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
    this.currentTime.set(time);
  }

  setCurrentTimeByFraction(fraction: number) {
    if (!this.canSync()) return;
    const time = fraction * (this.duration() || 1);
    if (this.audio) {
      this.audio.currentTime = time;
    }
    this.currentTime.set(time);
  }

  toggleSync() {
    this.sync.update((s) => !s);
    if (this.sync()) {
      this.syncReader();
    }
  }

  syncPlayer(href: string) {
    if (!this.sync()) return;
    const chapterMap = this.link()?.chapterMap;
    if (!chapterMap) return;

    const trackId = Object.keys(chapterMap).find((id) => chapterMap[id] === href);
    if (!trackId) return;

    const track = this.tracks().find((t) => t.id === trackId);
    if (track && track !== this.track()) {
      this.setTrack(track, true);
    }
  }

  private syncReader() {
    const href = this.href();
    if (href) this.injector.get(ReaderService).goTo(href, true);
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
