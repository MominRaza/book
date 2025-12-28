import { Injectable } from "@angular/core";
import { DBSchema, IDBPDatabase, openDB } from "idb";

import { PersistedLibraryCache } from "../models/library";

type KvKey =
  | "booksDirHandle"
  | "audiobooksDirHandle"
  | "booksFolderName"
  | "audiobooksFolderName"
  | "libraryCacheV1";

interface BookDbSchema extends DBSchema {
  kv: {
    key: KvKey;
    value: FileSystemDirectoryHandle | string | PersistedLibraryCache | null | undefined;
  };
}

@Injectable({ providedIn: "root" })
export class PersistenceService {
  private dbPromise: Promise<IDBPDatabase<BookDbSchema>> | null = null;

  private isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
    return (
      !!value &&
      typeof value === "object" &&
      "kind" in value &&
      (value as { kind?: unknown }).kind === "directory" &&
      "entries" in value
    );
  }

  private isLibraryCache(value: unknown): value is PersistedLibraryCache {
    return (
      !!value &&
      typeof value === "object" &&
      "schemaVersion" in value &&
      ((value as { schemaVersion?: unknown }).schemaVersion === 1 ||
        (value as { schemaVersion?: unknown }).schemaVersion === 2)
    );
  }

  private getDb(): Promise<IDBPDatabase<BookDbSchema>> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = openDB<BookDbSchema>("book-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });

    return this.dbPromise;
  }

  async getBooksDirHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.getDb();
    const value = await db.get("kv", "booksDirHandle");
    return this.isDirectoryHandle(value) ? value : null;
  }

  async getAudiobooksDirHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.getDb();
    const value = await db.get("kv", "audiobooksDirHandle");
    return this.isDirectoryHandle(value) ? value : null;
  }

  async setBooksDirHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
    const db = await this.getDb();
    await db.put("kv", handle, "booksDirHandle");
  }

  async setAudiobooksDirHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
    const db = await this.getDb();
    await db.put("kv", handle, "audiobooksDirHandle");
  }

  async getBooksFolderName(): Promise<string | null> {
    const db = await this.getDb();
    const value = await db.get("kv", "booksFolderName");
    return typeof value === "string" ? value : null;
  }

  async getAudiobooksFolderName(): Promise<string | null> {
    const db = await this.getDb();
    const value = await db.get("kv", "audiobooksFolderName");
    return typeof value === "string" ? value : null;
  }

  async setBooksFolderName(name: string | null): Promise<void> {
    const db = await this.getDb();
    await db.put("kv", name, "booksFolderName");
  }

  async setAudiobooksFolderName(name: string | null): Promise<void> {
    const db = await this.getDb();
    await db.put("kv", name, "audiobooksFolderName");
  }

  async getLibraryCache(): Promise<PersistedLibraryCache | null> {
    const db = await this.getDb();
    const value = await db.get("kv", "libraryCacheV1");
    return this.isLibraryCache(value) ? value : null;
  }

  async setLibraryCache(cache: PersistedLibraryCache | null): Promise<void> {
    const db = await this.getDb();
    await db.put("kv", cache, "libraryCacheV1");
  }

  async clearAll(): Promise<void> {
    const db = await this.getDb();
    await Promise.all([
      db.delete("kv", "booksDirHandle"),
      db.delete("kv", "audiobooksDirHandle"),
      db.delete("kv", "booksFolderName"),
      db.delete("kv", "audiobooksFolderName"),
      db.delete("kv", "libraryCacheV1"),
    ]);
  }
}
