import { Injectable, computed, inject, signal } from '@angular/core';

import { PersistedLibraryCache, ScannedFile } from '../models/library';
import { FsAccessService } from './fs-access';
import { PersistenceService } from './persistence';

@Injectable({ providedIn: 'root' })
export class LibraryStoreService {
  private readonly persistence = inject(PersistenceService);
  private readonly fs = inject(FsAccessService);

  private initialized = false;

  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly booksFolderName = signal<string | null>(null);
  readonly audiobooksFolderName = signal<string | null>(null);

  private readonly booksDirHandle = signal<FileSystemDirectoryHandle | null>(null);
  private readonly audiobooksDirHandle = signal<FileSystemDirectoryHandle | null>(null);

  readonly books = signal<ScannedFile[]>([]);
  readonly audiobooks = signal<ScannedFile[]>([]);

  readonly nowPlaying = signal<ScannedFile | null>(null);
  readonly audioObjectUrl = signal<string | null>(null);
  readonly playerErrorMessage = signal<string | null>(null);

  readonly hasCache = computed(() => this.books().length > 0 || this.audiobooks().length > 0);

  isConfigured(): boolean {
    return this.hasCache();
  }

  async initializeFromCache(): Promise<void> {
    if (this.initialized) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [booksHandle, audioHandle, booksName, audioName, cache] = await Promise.all([
        this.persistence.getBooksDirHandle(),
        this.persistence.getAudiobooksDirHandle(),
        this.persistence.getBooksFolderName(),
        this.persistence.getAudiobooksFolderName(),
        this.persistence.getLibraryCache(),
      ]);

      this.booksDirHandle.set(booksHandle);
      this.audiobooksDirHandle.set(audioHandle);
      this.booksFolderName.set(booksName);
      this.audiobooksFolderName.set(audioName);

      if (cache) {
        const normalize = (items: ScannedFile[]) =>
          items.map((item) => ({
            ...item,
            sizeBytes: item.sizeBytes ?? null,
            mimeType: item.mimeType ?? null,
            lastModifiedMs: item.lastModifiedMs ?? null,
            lastModifiedIso: item.lastModifiedIso ?? null,
          }));

        this.books.set(normalize(cache.books ?? []));
        this.audiobooks.set(normalize(cache.audiobooks ?? []));
      }

      this.loading.set(false);
      this.initialized = true;
    } catch (err) {
      this.loading.set(false);
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to load cached library.');
      this.initialized = true;
    }
  }

  async pickBooksFolder(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const handle = await this.fs.pickDirectory();
      await this.fs.ensureDirectoryReadPermission(handle);
      this.booksDirHandle.set(handle);
      this.booksFolderName.set(handle.name);
      await Promise.all([
        this.persistence.setBooksDirHandle(handle),
        this.persistence.setBooksFolderName(handle.name),
      ]);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to pick books folder.');
    }
  }

  async pickAudiobooksFolder(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const handle = await this.fs.pickDirectory();
      await this.fs.ensureDirectoryReadPermission(handle);
      this.audiobooksDirHandle.set(handle);
      this.audiobooksFolderName.set(handle.name);
      await Promise.all([
        this.persistence.setAudiobooksDirHandle(handle),
        this.persistence.setAudiobooksFolderName(handle.name),
      ]);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to pick audiobooks folder.');
    }
  }

  canScan(): boolean {
    return !!this.booksDirHandle() && !!this.audiobooksDirHandle();
  }

  async scanAndPersist(): Promise<void> {
    const booksHandle = this.booksDirHandle();
    const audioHandle = this.audiobooksDirHandle();

    if (!booksHandle || !audioHandle) {
      this.errorMessage.set('Please pick both folders before continuing.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [books, audiobooks] = await Promise.all([
        this.fs.scanForEpubs(booksHandle),
        this.fs.scanForAudiobooks(audioHandle),
      ]);

      this.books.set(books);
      this.audiobooks.set(audiobooks);

      const cache: PersistedLibraryCache = {
        schemaVersion: 1,
        booksFolderName: this.booksFolderName(),
        audiobooksFolderName: this.audiobooksFolderName(),
        scannedAtIso: new Date().toISOString(),
        books,
        audiobooks,
      };

      await this.persistence.setLibraryCache(cache);
      this.loading.set(false);
    } catch (err) {
      this.loading.set(false);
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to scan folders.');
    }
  }

  async playAudiobook(file: ScannedFile): Promise<void> {
    this.playerErrorMessage.set(null);

    const audioHandle = this.audiobooksDirHandle();
    if (!audioHandle) {
      this.playerErrorMessage.set('Audiobooks folder is not set. Go to setup and choose it again.');
      return;
    }

    try {
      await this.fs.ensureDirectoryReadPermission(audioHandle);
      const audioFile = await this.fs.getFileByRelativePath(audioHandle, file.relativePath);

      const previousUrl = this.audioObjectUrl();
      if (previousUrl) URL.revokeObjectURL(previousUrl);

      const url = URL.createObjectURL(audioFile);
      this.audioObjectUrl.set(url);
      this.nowPlaying.set(file);
    } catch (err) {
      this.playerErrorMessage.set(
        err instanceof Error ? err.message : 'Failed to open the selected audiobook.',
      );
    }
  }

  stopAudiobook(): void {
    const previousUrl = this.audioObjectUrl();
    if (previousUrl) URL.revokeObjectURL(previousUrl);

    this.audioObjectUrl.set(null);
    this.nowPlaying.set(null);
    this.playerErrorMessage.set(null);
  }

  async reset(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    await this.persistence.clearAll();

    this.booksDirHandle.set(null);
    this.audiobooksDirHandle.set(null);
    this.booksFolderName.set(null);
    this.audiobooksFolderName.set(null);
    this.books.set([]);
    this.audiobooks.set([]);

    this.loading.set(false);
  }
}
