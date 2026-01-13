import { computed, inject, Injectable, signal } from "@angular/core";
import { Book } from "../models/book";
import { EPUBType } from "../models/epub";
import { PlayerService } from "./player";

type FoliateElement = HTMLElement & {
  open: (book: EPUBType) => void;
  goTo: (target: { index: number; anchor?: number }) => void;
  prev: () => void;
  next: () => void;
  setStyles: (styles: string) => void;
  destroy: () => void;
};

@Injectable({
  providedIn: "root",
})
export class ReaderService {
  private readonly playerService = inject(PlayerService);
  readonly book = signal<Book | undefined>(undefined);
  readonly epub = signal<EPUBType | undefined>(undefined);

  private readonly currentIndex = signal<number>(0);
  private readonly currentPage = signal<number>(1);
  private readonly pageSize = signal<number>(1);
  private readonly totalPages = computed(() => Math.round(1 / this.pageSize()));

  private foliate?: FoliateElement;
  private readonly attachedDocs = new Set<Document>();

  async initFoliate() {
    await import("foliate-js/paginator.js");
    this.foliate = document.createElement("foliate-paginator") as FoliateElement;

    this.foliate.addEventListener("load", (event) => {
      const detail = (event as CustomEvent<{ doc: Document; index: number }>).detail;
      const doc = detail.doc;
      const index = detail.index;
      if (!doc || this.attachedDocs.has(doc)) return;
      this.attachedDocs.add(doc);
      doc.addEventListener("keydown", this.onKeydown.bind(this));
      doc.addEventListener("click", this.onClick.bind(this, index));
    });
    this.foliate.addEventListener("relocate", this.onRelocate.bind(this));

    const epub = this.epub();
    if (!epub) return;
    this.foliate.open(epub);
    this.foliate.setStyles(`
      :root { color-scheme: light dark }
      @media (prefers-color-scheme: dark) { a:link { color: lightblue } }
      p, li, blockquote, dd { line-height: 1.4; text-align: justify; hyphens: auto; widows: 2 }
      [align="left"] { text-align: left }
      [align="right"] { text-align: right }
      [align="center"] { text-align: center }
      [align="justify"] { text-align: justify }
      pre { white-space: pre-wrap !important }
    `);
    this.foliate.next();

    return this.foliate;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        this.goToPrevious();
        break;
      case "ArrowRight":
        event.preventDefault();
        this.goToNext();
        break;
    }
  }

  private goToPrevious(): void {
    this.foliate?.prev();
  }

  private goToNext(): void {
    this.foliate?.next();
  }

  private onClick(index: number, event: MouseEvent): void {
    const a = (event.target as HTMLElement).closest("a[href]");
    if (!a) return;
    event.preventDefault();
    let href = a.getAttribute("href");
    if (href === null) return;
    if (this.epub()?.isExternal(href)) {
      globalThis.open(href, "_blank");
      return;
    }
    href = this.epub()?.sections[index].resolveHref(href) ?? href;
    this.goTo(href);
  }

  goTo(href: string, byPlayer: boolean = false): void {
    const resolved = this.epub()?.resolveHref(href);
    if (resolved) {
      this.foliate?.goTo(resolved);
      if (!byPlayer) this.playerService.syncPlayer(href);
    }
  }

  private onRelocate(event: Event): void {
    const detail = (
      event as CustomEvent<{ index: number; fraction: number; size: number; reason: string }>
    ).detail;
    this.currentIndex.set(detail.index);
    this.pageSize.set(detail.size);
    this.currentPage.set(Math.round(detail.fraction / detail.size));

    if (detail.reason === "page") {
      this.playerService.setCurrentTimeByFraction(detail.fraction);
    }
  }

  goToFraction(fraction: number): void {
    const currentPage = this.currentPage();
    const desiredPage = Math.min(Math.round(fraction * this.totalPages()), this.totalPages() - 1);

    if (desiredPage === currentPage) return;

    const anchor = (fraction >= 0.5 ? desiredPage + 1 : desiredPage) * this.pageSize();
    this.foliate?.goTo({ index: this.currentIndex(), anchor });
  }

  destroy(): void {
    for (const doc of this.attachedDocs) {
      doc.removeEventListener("keydown", this.onKeydown);
    }
    this.attachedDocs.clear();
    this.foliate?.destroy();
  }
}
