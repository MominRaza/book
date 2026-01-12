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

  linkSuggestions(): Link[] {
    const books = this.stateService.books();
    const audiobooks = this.stateService.audiobooks();

    const suggestions: Link[] = [];
    for (const book of books) {
      const bookTitle = book.title.toLowerCase().replace(" one", " 1").replace(" two", " 2");

      for (const audiobook of audiobooks) {
        const audiobookName = audiobook.name.toLowerCase();

        if (bookTitle === audiobook.name.toLowerCase()) {
          suggestions.push({ bookId: book.id, audiobookId: audiobook.id });
        } else {
          const bookTitleChunks = bookTitle.split(":");
          const audiobookNameChunks = audiobookName.split(":");
          const commonChunks = bookTitleChunks.filter((chunk) =>
            audiobookNameChunks.includes(chunk),
          );
          if (
            commonChunks.length >= Math.min(3, bookTitleChunks.length, audiobookNameChunks.length)
          ) {
            suggestions.push({ bookId: book.id, audiobookId: audiobook.id });
          }
        }
      }
    }
    return suggestions;
  }
}
