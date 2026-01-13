import { inject, Injectable } from "@angular/core";
import { StateService } from "./state";
import { Link } from "../models/link";
import { Track } from "../models/audiobook";
import { TOC } from "../models/epub";

@Injectable({
  providedIn: "root",
})
export class LinksService {
  private readonly stateService = inject(StateService);

  createNewLink(bookId: string, audiobookId: string): Link {
    const book = this.stateService.books().find((b) => b.id === bookId);
    const audiobook = this.stateService.audiobooks().find((a) => a.id === audiobookId);
    if (!book || !audiobook) throw new Error("Book or Audiobook not found");
    return { bookId, audiobookId, chapterMap: this.chapterMap(audiobook.tracks, book.toc) };
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

  chapterMap(tracks: Track[], toc: TOC[]): Link["chapterMap"] {
    const flatTOC: TOC[] = [];
    const flattenTOC = (entries: TOC[]) => {
      for (const entry of entries) {
        flatTOC.push(entry);
        if (entry.subitems) {
          flattenTOC(entry.subitems);
        }
      }
    };
    flattenTOC(toc);

    const normalize = (text: string) =>
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(" one", " 1")
        .replace(" i:", " 1:")
        .replace(" two", " 2")
        .replace(" ii", " 2")
        .replace(/^chapter\s(\d+):\s/, "$1 ");

    const map: Link["chapterMap"] = {};
    for (const track of tracks) {
      const trackName = normalize(track.name);

      for (const tocEntry of flatTOC) {
        const tocLabel = normalize(tocEntry.label);

        if (
          trackName === tocLabel ||
          tocLabel.includes(trackName) ||
          trackName.includes(tocLabel)
        ) {
          map[track.id] = tocEntry.href;
          break;
        }
      }
    }

    return map;
  }
}
