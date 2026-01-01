import { Injectable } from "@angular/core";
import { DBSchema, openDB } from "idb";
import { Book } from "../models/book";
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
}

@Injectable({
  providedIn: "root",
})
export class IDBService {
  private useDB() {
    return openDB<BookDB>("book-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("books")) {
          db.createObjectStore("books", { keyPath: "identifier" });
        }
        if (!db.objectStoreNames.contains("directoryHandles")) {
          db.createObjectStore("directoryHandles", { keyPath: "type" });
        }
      },
    });
  }

  async addBook(book: Book) {
    const db = await this.useDB();
    await db.put("books", book);
  }

  async addBooks(books: Book[]) {
    const db = await this.useDB();
    const tx = db.transaction("books", "readwrite");
    for (const book of books) {
      tx.store.put(book);
    }
    await tx.done;
  }

  async getBook(identifier: string) {
    const db = await this.useDB();
    return db.get("books", identifier);
  }

  async getAllBooks() {
    const db = await this.useDB();
    return db.getAll("books");
  }

  async deleteBook(identifier: string) {
    const db = await this.useDB();
    await db.delete("books", identifier);
  }

  async setDirectoryHandle(type: string, handle: FileSystemDirectoryHandleWithPermissions) {
    const db = await this.useDB();
    await db.put("directoryHandles", { type, handle });
  }

  async getDirectoryHandle(type: string) {
    const db = await this.useDB();
    return (await db.get("directoryHandles", type))?.handle;
  }
}
