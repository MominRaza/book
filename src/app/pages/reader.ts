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

type FoliateLoadEventDetail = {
  doc: Document;
  index: number;
};

const XLINK_NS = 'http://www.w3.org/1999/xlink';

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
  private book: unknown | null = null;
  private readonly docsWithLinkHandler = new WeakSet<Document>();

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
      this.book = book;

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

      this.rendererEl.addEventListener('load', (event: Event) => {
        const detail = (event as CustomEvent<FoliateLoadEventDetail>).detail;
        if (!detail?.doc || typeof detail.index !== 'number') return;
        this.installLinkInterceptor(detail.doc, detail.index);
      });

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

  private installLinkInterceptor(doc: Document, index: number): void {
    if (this.docsWithLinkHandler.has(doc)) return;
    this.docsWithLinkHandler.add(doc);

    doc.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element | null;
        if (!target || typeof target !== 'object' || !('nodeType' in target) || target.nodeType !== 1) return;

        const linkEl = target.closest('a, area');
        if (!linkEl) return;

        const hrefRaw =
          linkEl.getAttribute('href') ??
          linkEl.getAttribute('xlink:href') ??
          linkEl.getAttributeNS?.(XLINK_NS, 'href');
        if (!hrefRaw) return;

        // Ignore purely in-page anchors; Foliate's resolver can handle them, but
        // preventing default for empty anchors can break some books.
        // Still handle explicit fragments like "chapter.xhtml#id".
        if (hrefRaw.trim() === '#') return;

        event.preventDefault();

        const book = this.book as
          | {
              sections?: Array<{ id?: string; resolveHref?: (href: string) => string }>;
              resolveHref?: (href: string) => Promise<unknown> | unknown;
              isExternal?: (href: string) => boolean;
            }
          | null;

        const section = book?.sections?.[index];
        const href = section?.resolveHref ? section.resolveHref(hrefRaw) : hrefRaw;

        const isExternal =
          (typeof book?.isExternal === 'function' && book.isExternal(href)) ||
          /^(?!blob)\w+:/i.test(href);

        if (isExternal) {
          globalThis.open(href, '_blank', 'noopener');
          return;
        }

        // Avoid ResizeObserver loop errors by deferring navigation out of the click handler
        // into a macrotask.
        setTimeout(() => {
          void this.navigateToHref(href, index);
        }, 0);
      },
    );
  }

  private async navigateToHref(href: string, currentIndex: number): Promise<void> {
    const renderer = this.rendererEl;
    const book = this.book as
      | {
          resolveHref?: (h: string) => Promise<unknown> | unknown;
          sections?: Array<{ id?: string }>;
        }
      | null;
    if (!renderer || typeof renderer.goTo !== 'function') return;
    if (!book?.resolveHref) return;

    try {
      // Normalize common href forms that don't match EPUB manifest hrefs.
      let normalizedHref = href;
      if (normalizedHref.startsWith('/')) normalizedHref = normalizedHref.slice(1);
      if (normalizedHref.startsWith('#')) {
        const base = book.sections?.[currentIndex]?.id;
        if (base) normalizedHref = `${base}${normalizedHref}`;
      }

      const resolved = await book.resolveHref(normalizedHref);
      if (
        resolved &&
        typeof resolved === 'object' &&
        'index' in resolved &&
        typeof (resolved as { index?: unknown }).index === 'number' &&
        (resolved as { index: number }).index >= 0
      ) {
        await renderer.goTo(resolved);
        this.errorMessage.set(null);
        return;
      }

      // Fallback for some Calibre-generated TOCs that reference unsplit files like
      // `part0006.html` while the spine only contains `part0006_split_###.html`.
      // Try a small range of split indices.
      {
        const [pathPart, hashPart] = normalizedHref.split('#');
        const hasHtmlExt = /\.x?html?$/i.test(pathPart);
        const hasSplit = /[_-]split[_-]\d+/i.test(pathPart);

        if (hasHtmlExt && !hasSplit) {
          const extMatch = pathPart.match(/\.(x?html?)$/i);
          const ext = extMatch ? extMatch[0] : '.html';
          for (let i = 0; i <= 50; i += 1) {
            const splitSuffix = `_split_${String(i).padStart(3, '0')}${ext}`;
            const candidatePath = pathPart.replace(/\.x?html?$/i, splitSuffix);
            const candidate = hashPart ? `${candidatePath}#${hashPart}` : candidatePath;
            const resolvedSplit = await book.resolveHref(candidate);
            if (
              resolvedSplit &&
              typeof resolvedSplit === 'object' &&
              'index' in resolvedSplit &&
              typeof (resolvedSplit as { index?: unknown }).index === 'number' &&
              (resolvedSplit as { index: number }).index >= 0
            ) {
              await renderer.goTo(resolvedSplit);
              this.errorMessage.set(null);
              return;
            }
          }
        }
      }

      // Fallback: fragment-only navigation within the current document.
      const [, hashPart] = normalizedHref.split('#');
      const hash = hashPart;
      if (hash) {
        await renderer.goTo({
          index: currentIndex,
          anchor: (d: Document) =>
            d.getElementById(hash) ?? d.querySelector(`[name="${CSS.escape(hash)}"]`) ?? 0,
        });
        this.errorMessage.set(null);
        return;
      }

      this.errorMessage.set('This link target could not be resolved in the book.');
    } catch (err) {
      console.warn(err);
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
    this.book = null;
    this.isRendererReady.set(false);
  }
}
