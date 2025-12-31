import { Injectable } from "@angular/core";
import { DBSchema, openDB } from "idb";
import { Book } from "../models/book";

interface BookDB extends DBSchema {
  books: {
    key: number;
    value: Book;
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
      },
    });
  }

  async addBook(book: Book) {
    const db = await this.useDB();
    await db.add("books", book);
  }

  async addBooks(books: Book[]) {
    const db = await this.useDB();
    const tx = db.transaction("books", "readwrite");
    for (const book of books) {
      tx.store.add(book);
    }
    await tx.done;
  }

  async getBook(id: number) {
    const db = await this.useDB();
    return db.get("books", id);
  }

  async getAllBooks() {
    const db = await this.useDB();
    return db.getAll("books");
  }

  async deleteBook(id: number) {
    const db = await this.useDB();
    await db.delete("books", id);
  }
}
