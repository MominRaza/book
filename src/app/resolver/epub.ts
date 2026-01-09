import { RedirectCommand, ResolveFn, Router } from "@angular/router";
import { EPUBType } from "../models/epub";
import { IDBService } from "../services/idb";
import { inject } from "@angular/core";
import { EpubService } from "../services/epub";

export const epubResolver: ResolveFn<EPUBType> = async (route) => {
  const idbService = inject(IDBService);
  const epubService = inject(EpubService);
  const router = inject(Router);

  const bookId = route.paramMap.get("bookId")!;
  const book = await idbService.getBook(bookId);
  if (!book) return new RedirectCommand(router.parseUrl("../"));

  const file = await book.handle.getFile();
  const epub = await epubService.getEpub(file);
  return epub;
};
