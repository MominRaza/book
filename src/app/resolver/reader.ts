import { inject } from "@angular/core";
import { RedirectCommand, ResolveFn, Router } from "@angular/router";

import { EpubService } from "../services/epub";
import { IDBService } from "../services/idb";
import { PlayerService } from "../services/player";
import { ReaderService } from "../services/reader";
import { StateService } from "../services/state";

export const readerResolver: ResolveFn<void> = async (route) => {
  const idbService = inject(IDBService);
  const epubService = inject(EpubService);
  const router = inject(Router);
  const readerService = inject(ReaderService);
  const playerService = inject(PlayerService);
  const stateService = inject(StateService);

  if (!stateService.permissionsGranted()) return new RedirectCommand(router.parseUrl("../../"));

  const bookId = route.paramMap.get("bookId")!;
  const book = await idbService.getBook(bookId);
  if (!book) return new RedirectCommand(router.parseUrl("../"));
  readerService.book.set(book);

  const file = await book.handle.getFile();
  const epub = await epubService.getEpub(file);
  readerService.epub.set(epub);

  const link = await idbService.getLink(bookId);
  if (link?.audiobookId) {
    const audiobook = await idbService.getAudiobook(link.audiobookId);
    if (audiobook) {
      playerService.setAudiobook(audiobook);
      playerService.setLink(link);
    }
  }
  return;
};
