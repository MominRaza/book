import { Component, ElementRef, inject, input, OnDestroy, OnInit, signal } from "@angular/core";
import { EPUBType, Metadata, TOC } from "../models/epub";
import { Sidebar } from "./sidebar";
import { EpubService } from "../services/epub";

type FoliateElement = HTMLElement & {
  open: (book: unknown) => void;
  goTo: (target: { index: number }) => void;
  prev: () => void;
  next: () => void;
  setStyles: (styles: string) => void;
  destroy: () => void;
};

@Component({
  selector: "foliate-renderer",
  imports: [Sidebar],
  template: `
    <button [class.show]="showSidebar()" (click)="showSidebar.set(!showSidebar())">Toggle Sidebar</button>
    <app-sidebar [metadata]="metadata()" [coverUrl]="coverUrl()" [toc]="toc()" [show]="showSidebar()" (goTo)="showSidebar.set(!showSidebar()); goTo($event)" />
  `,
  styles: `
    :host {
      outline: none;
    }
    button {
      position: absolute;
      top: 1rem;
      left: 1rem;
      z-index: 1;
      transition: left 0.3s ease-in-out;

      &.show {
        left: calc(10px + var(--sidebar-width));
      }
    }
  `,
  host: {
    tabindex: "0",
    "(keydown)": "onKeydown($event)",
  },
})
export class FoliateRenderer implements OnInit, OnDestroy {
  file = input.required<File>();
  epubService = inject(EpubService);
  private readonly elementRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private foliate?: FoliateElement;
  private epub?: EPUBType;
  private readonly attachedDocs = new Set<Document>();
  metadata = signal<Metadata | undefined>(undefined);
  coverUrl = signal<string | undefined>(undefined);
  toc = signal<TOC[] | undefined>(undefined);
  showSidebar = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    this.epub = await this.epubService.getEpub(this.file());
    this.metadata.set(this.epub.metadata);
    this.toc.set(this.epub.toc);
    console.log(this.epub.toc);
    const coverBlob = await this.epub.getCover();
    if (coverBlob) this.coverUrl.set(URL.createObjectURL(coverBlob));

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

    this.foliate.open(this.epub);
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
    this.elementRef.nativeElement.appendChild(this.foliate);
    this.elementRef.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
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

  goToPrevious(): void {
    this.foliate?.prev();
  }

  goToNext(): void {
    this.foliate?.next();
  }

  private onClick(index: number, event: MouseEvent): void {
    const a = (event.target as HTMLElement).closest("a[href]");
    if (!a) return;
    event.preventDefault();
    let href = a.getAttribute("href");
    if (href === null) return;
    if (this.epub?.isExternal?.(href)) {
      globalThis.open(href, "_blank");
      return;
    }
    href = this.epub?.sections[index].resolveHref(href) ?? href;
    this.goTo(href);
  }

  goTo(href: string): void {
    const resolved = this.epub?.resolveHref(href);
    if (resolved) this.foliate?.goTo(resolved);
  }

  ngOnDestroy(): void {
    for (const doc of this.attachedDocs) {
      doc.removeEventListener("keydown", this.onKeydown);
    }
    this.attachedDocs.clear();
    this.foliate?.destroy();
    this.elementRef.nativeElement.innerHTML = "";
  }
}
