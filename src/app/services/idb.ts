import { Injectable } from "@angular/core";
import { DBSchema, openDB } from "idb";
import { Book } from "../models/book";
import { FileSystemDirectoryHandleWithPermissions } from "./file";
import { Audiobook } from "../models/audiobook";
import { Link } from "../models/link";

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

  async addAudiobooks(groups: Audiobook[]) {
    const db = await this.useDB();
    const tx = db.transaction("audiobooks", "readwrite");
    for (const group of groups) {
      tx.store.put(group);
    }
    await tx.done;
  }

  async getAllAudiobooks() {
    const db = await this.useDB();
    return db.getAll("audiobooks");
  }

  async setLink(bookId: string, audiobookId: string) {
    const db = await this.useDB();
    await db.put("links", { bookId, audiobookId });
  }

  async deleteLink(bookId: string) {
    const db = await this.useDB();
    await db.delete("links", bookId);
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

  async getDirectoryHandle(type: string) {
    const db = await this.useDB();
    return (await db.get("directoryHandles", type))?.handle;
  }

  async getAllDirectoryHandles() {
    const db = await this.useDB();
    return db.getAll("directoryHandles");
  }
}
