import { computed, Injectable, signal } from "@angular/core";
import { Book } from "../models/book";
import { EPUBType } from "../models/epub";

@Injectable({
  providedIn: "root",
})
export class ReaderService {
  readonly book = signal<Book | undefined>(undefined);
  readonly epub = signal<EPUBType | undefined>(undefined);
  readonly toc = computed(() => this.epub()?.toc);

  goTo(href: string): void {}
}
