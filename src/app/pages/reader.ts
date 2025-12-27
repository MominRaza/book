import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { FsAccessService } from '../services/fs-access';
import { LibraryStoreService } from '../services/library-store';

type FoliateRendererElement = HTMLElement & {
  open: (book: unknown) => void | Promise<void>;
  firstSection?: () => void | Promise<unknown>;
  goTo?: (target: unknown) => void | Promise<unknown>;
  next?: (distance?: number) => void | Promise<unknown>;
  prev?: (distance?: number) => void | Promise<unknown>;
  destroy?: () => void;
};

type ZipEntry = { filename: string; uncompressedSize?: number };

@Component({
  selector: 'app-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
  template: `
    <main>
      <p>
        <a routerLink="/library">Back to library</a>
      </p>

      <h1>Reader</h1>

      @if (errorMessage()) {
        <p role="alert">{{ errorMessage() }}</p>
      } @else if (loading()) {
        <p aria-live="polite">Loading book…</p>
      }

      <div class="reader-toolbar" role="toolbar" aria-label="Reader navigation">
        <button
          type="button"
          class="nav-button"
          [disabled]="loading() || !isRendererReady()"
          (click)="goPrev()"
          aria-controls="reader-region"
        >
          Prev
        </button>
        <button
          type="button"
          class="nav-button"
          [disabled]="loading() || !isRendererReady()"
          (click)="goNext()"
          aria-controls="reader-region"
        >
          Next
        </button>
      </div>

      <div
        id="reader-region"
        #host
        class="reader-host"
        aria-label="EPUB reader"
        tabindex="0"
      ></div>
    </main>
  `,
  styles: [
    `
      .reader-toolbar {
        display: flex;
        gap: 0.5rem;
        margin-block: 0.75rem;
      }

      .nav-button {
        border: 1px solid GrayText;
        border-radius: 0.5rem;
        background: transparent;
        padding: 0.35rem 0.75rem;
        color: inherit;
        font: inherit;
      }

      .nav-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .reader-host {
        border: 1px solid GrayText;
        border-radius: 0.75rem;
        height: 70vh;
        overflow: hidden;
      }

      .reader-host:focus {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
    `,
  ],
})
export class Reader implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(LibraryStoreService);
  private readonly fs = inject(FsAccessService);

  protected readonly loading = signal<boolean>(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isRendererReady = signal<boolean>(false);

  private readonly hostRef = viewChild.required<ElementRef<HTMLElement>>('host');
  private rendererEl: FoliateRendererElement | null = null;

  private async createZipLoader(file: File): Promise<{
    loadText: (filename: string) => Promise<string | null>;
    loadBlob: (filename: string, type?: string) => Promise<Blob | null>;
    getSize: (filename: string) => number;
  }> {
    const zip = await import('foliate-js/vendor/zip.js');
    zip.configure({ useWebWorkers: false });

    const reader = new zip.ZipReader(new zip.BlobReader(file));
    const entries: ZipEntry[] = await reader.getEntries();
    const byName = new Map<string, ZipEntry>(entries.map((e) => [e.filename, e]));

    const getEntry = (filename: string) => byName.get(filename) ?? null;

    const loadText = async (filename: string) => {
      const entry = getEntry(filename);
      if (!entry) return null;
      // zip.js entries support getData(writer)
      const anyEntry = entry as unknown as { getData: (writer: unknown) => Promise<string> };
      return anyEntry.getData(new zip.TextWriter());
    };

    const loadBlob = async (filename: string, type?: string) => {
      const entry = getEntry(filename);
      if (!entry) return null;
      const anyEntry = entry as unknown as {
        getData: (writer: unknown) => Promise<Blob>;
      };
      return anyEntry.getData(new zip.BlobWriter(type));
    };

    const getSize = (filename: string) => getEntry(filename)?.uncompressedSize ?? 0;

    return { loadText, loadBlob, getSize };
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.isRendererReady.set(false);

    try {
      const relativePath = this.route.snapshot.queryParamMap.get('path');
      if (!relativePath) {
        throw new Error('Missing book path. Go back and choose a book.');
      }

      await this.store.initializeFromCache();

      const booksDir = this.store.getBooksDirectoryHandle();
      if (!booksDir) {
        throw new Error('Books folder is not set. Go to setup and choose it again.');
      }

      await this.fs.ensureDirectoryReadPermission(booksDir);
      const bookFile = await this.fs.getFileByRelativePath(booksDir, relativePath);

      const host = this.hostRef().nativeElement;
      host.replaceChildren();

      const { EPUB } = await import('foliate-js/epub.js');
      const loader = await this.createZipLoader(bookFile);
      const book = await new EPUB(loader).init();

      const isFixed =
        !!book &&
        typeof book === 'object' &&
        'rendition' in book &&
        (book as { rendition?: { layout?: unknown } }).rendition?.layout === 'pre-paginated';

      if (isFixed) {
        await import('foliate-js/fixed-layout.js');
        this.rendererEl = document.createElement('foliate-fxl') as FoliateRendererElement;
      } else {
        await import('foliate-js/paginator.js');
        this.rendererEl = document.createElement('foliate-paginator') as FoliateRendererElement;
      }

      // NOTE: this element is created dynamically, so Angular's emulated CSS won't target it.
      // Set size inline so it reliably shows up.
      (this.rendererEl as unknown as HTMLElement).style.display = 'block';
      (this.rendererEl as unknown as HTMLElement).style.width = '100%';
      (this.rendererEl as unknown as HTMLElement).style.height = '100%';

      host.append(this.rendererEl);
      await this.rendererEl.open(book);

      // Foliate renderers don't automatically navigate on `open()`.
      // We must explicitly go to a section, otherwise the shadow DOM stays empty.
      if (typeof this.rendererEl.firstSection === 'function') {
        await this.rendererEl.firstSection();
      } else if (typeof this.rendererEl.goTo === 'function') {
        await this.rendererEl.goTo({ index: 0 });
      } else {
        throw new Error('Reader renderer did not expose navigation methods.');
      }

      this.isRendererReady.set(true);
      // Make keyboard navigation discoverable immediately.
      host.focus();

      this.loading.set(false);
    } catch (err) {
      this.loading.set(false);
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to load EPUB.');
    }
  }

  protected goNext(): void {
    const renderer = this.rendererEl;
    if (!renderer) return;
    if (typeof renderer.next === 'function') {
      void renderer.next();
    }
  }

  protected goPrev(): void {
    const renderer = this.rendererEl;
    if (!renderer) return;
    if (typeof renderer.prev === 'function') {
      void renderer.prev();
    }
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isRendererReady() || this.loading()) return;
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    if (target instanceof HTMLElement) {
      const tagName = target.tagName.toLowerCase();
      const isTypingTarget =
        target.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select';
      if (isTypingTarget) return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goPrev();
    }
  }

  ngOnDestroy(): void {
    try {
      this.rendererEl?.destroy?.();
    } catch {
      // ignore
    }
    this.rendererEl = null;
    this.isRendererReady.set(false);
  }
}
