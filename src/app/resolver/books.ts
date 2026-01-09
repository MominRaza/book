import { inject } from "@angular/core";
import { RedirectCommand, ResolveFn, Router } from "@angular/router";
import { Book } from "../models/book";
import { IDBService } from "../services/idb";

export const booksResolver: ResolveFn<Book[]> = async () => {
  const idbService = inject(IDBService);
  const router = inject(Router);

  const books = await idbService.getAllBooks();
  if (!books || books.length === 0) return new RedirectCommand(router.parseUrl("../"));
  return books;
};
