import { inject, Injectable, signal } from "@angular/core";
import { Book } from "../models/book";
import { Link } from "../models/link";
import { Audiobook } from "../models/audiobook";
import { IDBService } from "./idb";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "./file";

@Injectable({
  providedIn: "root",
})
export class StateService {
  private readonly idbService = inject(IDBService);
  private readonly fileService = inject(FileService);

  private readonly _booksHandle = signal<FileSystemDirectoryHandleWithPermissions | undefined>(
    undefined,
  );
  private readonly _audiobooksHandle = signal<FileSystemDirectoryHandleWithPermissions | undefined>(
    undefined,
  );
  private readonly _books = signal<Book[]>([]);
  private readonly _audiobooks = signal<Audiobook[]>([]);
  private readonly _links = signal<Link[]>([]);
  private readonly _permissionsGranted = signal(false);

  readonly booksHandle = this._booksHandle.asReadonly();
  readonly audiobooksHandle = this._audiobooksHandle.asReadonly();
  readonly books = this._books.asReadonly();
  readonly audiobooks = this._audiobooks.asReadonly();
  readonly links = this._links.asReadonly();
  readonly permissionsGranted = this._permissionsGranted.asReadonly();

  async init() {
    const directoryHandles = await this.idbService.getAllDirectoryHandles();
    const booksHandle = directoryHandles.find((d) => d.type === "books")?.handle;
    const audiobooksHandle = directoryHandles.find((d) => d.type === "audiobooks")?.handle;

    if (booksHandle && audiobooksHandle) {
      const booksPermission = await this.fileService.verifyPermission(booksHandle, false);
      const audiobooksPermission = await this.fileService.verifyPermission(audiobooksHandle, false);
      this._permissionsGranted.set(booksPermission && audiobooksPermission);
    }

    this._booksHandle.set(booksHandle);
    this._audiobooksHandle.set(audiobooksHandle);
    this._books.set(await this.idbService.getAllBooks());
    this._audiobooks.set(await this.idbService.getAllAudiobooks());
    this._links.set(await this.idbService.getAllLinks());
  }

  setBooksHandle(handle: FileSystemDirectoryHandleWithPermissions) {
    this._booksHandle.set(handle);
  }

  setAudiobooksHandle(handle: FileSystemDirectoryHandleWithPermissions) {
    this._audiobooksHandle.set(handle);
  }

  setBooks(books: Book[]) {
    this._books.set(books);
  }

  setAudiobooks(audiobooks: Audiobook[]) {
    this._audiobooks.set(audiobooks);
  }

  setLinks(links: Link[]) {
    this._links.set(links);
  }
}
