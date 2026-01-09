import { inject } from "@angular/core";
import { RedirectCommand, ResolveFn, Router } from "@angular/router";
import { Audiobook } from "../models/audiobook";
import { IDBService } from "../services/idb";

export const audiobooksResolver: ResolveFn<Audiobook[]> = async () => {
  const idbService = inject(IDBService);
  const router = inject(Router);

  const audiobooks = await idbService.getAllAudiobooks();
  if (!audiobooks || audiobooks.length === 0) return new RedirectCommand(router.parseUrl("../"));
  return audiobooks;
};
