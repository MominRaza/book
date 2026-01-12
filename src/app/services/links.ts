import { inject, Injectable } from "@angular/core";
import { StateService } from "./state";
import { Link } from "../models/link";

@Injectable({
  providedIn: "root",
})
export class LinksService {
  private readonly stateService = inject(StateService);

  createNewLink(bookId: string, audiobookId: string): Link {
    const book = this.stateService.books().find((b) => b.id === bookId);
    const audiobook = this.stateService.audiobooks().find((a) => a.id === audiobookId);
    if (!book || !audiobook) throw new Error("Book or Audiobook not found");
    return { bookId, audiobookId, chapterMap: {} };
  }
}
