import { Component, ElementRef, inject, OnDestroy, OnInit, viewChild } from "@angular/core";
import { EPUBType } from "../models/epub";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Location } from "@angular/common";
import { MatExpansionModule } from "@angular/material/expansion";
import { StateService } from "../services/state";
import { Router } from "@angular/router";
import { Player } from "../components/player";
import { ReaderService } from "../services/reader";
import { Sidebar } from "../components/sidebar";

type FoliateElement = HTMLElement & {
  open: (book: EPUBType) => void;
  goTo: (target: { index: number }) => void;
  prev: () => void;
  next: () => void;
  setStyles: (styles: string) => void;
  destroy: () => void;
};

@Component({
  selector: "app-reader",
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatExpansionModule,
    Player,
    Sidebar,
  ],
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer>
        <app-sidebar (close)="drawer.close()" />
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
          <button matIconButton (click)="location.back()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-toolbar>
        <div tabindex="0" (keydown)="onKeydown($event)" class="foliate-container" #foliateContainer></div>
        <app-player />
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styleUrl: "./reader.css",
})
export class Reader implements OnInit, OnDestroy {
  protected readonly readerService = inject(ReaderService);
  protected readonly location = inject(Location);
  private readonly stateService = inject(StateService);
  private readonly router = inject(Router);

  private readonly elementRef = viewChild.required<ElementRef<HTMLElement>>("foliateContainer");
  private foliate?: FoliateElement;
  protected readonly epub = this.readerService.epub;
  private readonly attachedDocs = new Set<Document>();

  async ngOnInit(): Promise<void> {
    if (!this.stateService.permissionsGranted()) {
      this.router.navigate(["../../"], { replaceUrl: true });
    }

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
    this.elementRef().nativeElement.appendChild(this.foliate);
    this.elementRef().nativeElement.focus();
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
    if (this.epub()?.isExternal(href)) {
      globalThis.open(href, "_blank");
      return;
    }
    href = this.epub()?.sections[index].resolveHref(href) ?? href;
    this.goTo(href);
  }

  goTo(href: string): void {
    const resolved = this.epub()?.resolveHref(href);
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
