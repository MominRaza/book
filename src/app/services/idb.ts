import { Injectable } from "@angular/core";
import { DBSchema, openDB } from "idb";

import { Audiobook } from "../models/audiobook";
import { Book } from "../models/book";
import { Link } from "../models/link";
import { FileSystemDirectoryHandleWithPermissions } from "./file";

interface BookDB extends DBSchema {
  books: {
    key: string;
    value: Book;
  };
  directoryHandles: {
    key: string;
    value: { type: string; handle: FileSystemDirectoryHandleWithPermissions };
  };
  audiobooks: {
    key: string;
    value: Audiobook;
  };
  links: {
    key: string;
    value: Link;
  };
}

@Injectable({
  providedIn: "root",
})
export class IDBService {
  private useDB() {
    return openDB<BookDB>("book-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("books")) {
          db.createObjectStore("books", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("directoryHandles")) {
          db.createObjectStore("directoryHandles", { keyPath: "type" });
        }
        if (!db.objectStoreNames.contains("audiobooks")) {
          db.createObjectStore("audiobooks", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("links")) {
          db.createObjectStore("links", { keyPath: "bookId" });
        }
      },
    });
  }

  async addBooks(books: Book[]) {
    const db = await this.useDB();
    const tx = db.transaction("books", "readwrite");
    for (const book of books) {
      tx.store.put(book);
    }
    await tx.done;
  }

  async getBook(id: string) {
    const db = await this.useDB();
    return db.get("books", id);
  }

  async getAllBooks() {
    const db = await this.useDB();
    return db.getAll("books");
  }

  async addAudiobooks(audiobooks: Audiobook[]) {
    const db = await this.useDB();
    const tx = db.transaction("audiobooks", "readwrite");
    for (const audiobook of audiobooks) {
      tx.store.put(audiobook);
    }
    await tx.done;
  }

  async getAudiobook(id: string) {
    const db = await this.useDB();
    return db.get("audiobooks", id);
  }

  async getAllAudiobooks() {
    const db = await this.useDB();
    return db.getAll("audiobooks");
  }

  async setLinks(links: Link[]) {
    const db = await this.useDB();
    const tx = db.transaction("links", "readwrite");
    await tx.store.clear();
    for (const link of links) {
      tx.store.put(link);
    }
    await tx.done;
  }

  async getLink(bookId: string) {
    const db = await this.useDB();
    return db.get("links", bookId);
  }

  async getAllLinks() {
    const db = await this.useDB();
    return db.getAll("links");
  }

  async setDirectoryHandle(type: string, handle: FileSystemDirectoryHandleWithPermissions) {
    const db = await this.useDB();
    await db.put("directoryHandles", { type, handle });
  }

  async getAllDirectoryHandles() {
    const db = await this.useDB();
    return db.getAll("directoryHandles");
  }
}
