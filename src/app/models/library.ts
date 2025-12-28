import type { Metadata } from "./epub";

export type LibraryFileKind = "book" | "audiobook";

export interface ScannedFile {
  kind: LibraryFileKind;
  name: string;
  relativePath: string;

  // File metadata (from FileSystemFileHandle.getFile())
  sizeBytes: number | null;
  mimeType: string | null;
  lastModifiedMs: number | null;
  lastModifiedIso: string | null;

  // Only populated for `kind: 'book'` (EPUB)
  epubMetadata?: Metadata | null;
  coverBlob?: Blob | null;
}

export interface PersistedLibraryCache {
  // v1 existed with only name/relativePath; keep reading it for backwards compatibility.
  schemaVersion: 1 | 2;
  booksFolderName: string | null;
  audiobooksFolderName: string | null;
  scannedAtIso: string;
  books: ScannedFile[];
  audiobooks: ScannedFile[];
}
