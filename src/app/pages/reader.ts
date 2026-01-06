import { Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from "@angular/core";
import { EPUBType, Metadata, TOC } from "../models/epub";
import { EpubService } from "../services/epub";
import { IDBService } from "../services/idb";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ActivatedRoute, Router } from "@angular/router";

type FoliateElement = HTMLElement & {
  open: (book: unknown) => void;
  goTo: (target: { index: number }) => void;
  prev: () => void;
  next: () => void;
  setStyles: (styles: string) => void;
  destroy: () => void;
};

@Component({
  selector: "app-reader",
  imports: [MatSidenavModule, MatButtonModule, MatIconModule, MatListModule, MatToolbarModule],
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer>
        <div class="cover-metadata">
          <img [src]="coverUrl()" />
          <div class="metadata">
            <h1>{{ metadata()?.title }}</h1>
            <p>{{ metadata()?.author?.name }}</p>
          </div>
        </div>
        <mat-nav-list>
          @for (item of toc(); track $index) {
            <a mat-list-item (click)="goTo(item.href); drawer.close()">
              {{ item.label }}
            </a>
            @if (item.subitems) {
              <mat-nav-list>
              @for (subitem of item.subitems; track $index) {
                <a mat-list-item class="subitem" (click)="goTo(subitem.href); drawer.close()">
                  {{ subitem.label }}
                </a>
              }
              </mat-nav-list>
            }
          }
        </mat-nav-list>
      </mat-drawer>
      <mat-drawer-content>
        <mat-toolbar>
          <button matIconButton (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <div [style.flex]="1"></div>
          <button matIconButton>
            <mat-icon>settings</mat-icon>
          </button>
          <button matIconButton (click)="goBack()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-toolbar>
        <div tabindex="0" (keydown)="onKeydown($event)" class="foliate-container" #foliateContainer></div>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styleUrl: "./reader.css",
})
export class ReaderPage implements OnInit, OnDestroy {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  epubService = inject(EpubService);
  private readonly elementRef = viewChild.required<ElementRef<HTMLElement>>("foliateContainer");
  private readonly idbService = inject(IDBService);
  private foliate?: FoliateElement;
  private epub?: EPUBType;
  private readonly attachedDocs = new Set<Document>();
  metadata = signal<Metadata | undefined>(undefined);
  coverUrl = signal<string | undefined>(undefined);
  toc = signal<TOC[] | undefined>(undefined);
  showSidebar = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    const bookId = this.activatedRoute.snapshot.paramMap.get("bookId");
    if (!bookId) {
      this.goBack();
      return;
    }
    const book = await this.idbService.getBook(bookId);
    if (!book) {
      this.goBack();
      return;
    }
    const file = await book.handle.getFile();
    this.epub = await this.epubService.getEpub(file);
    this.metadata.set(this.epub.metadata);
    this.toc.set(this.epub.toc);
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
    this.elementRef().nativeElement.appendChild(this.foliate);
    this.elementRef().nativeElement.focus();
  }

  goBack(): void {
    this.router.navigate(["/library"], { replaceUrl: true });
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
    this.elementRef().nativeElement.innerHTML = "";
  }
}
