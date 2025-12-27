import { Component, ElementRef, inject, input, OnDestroy, OnInit } from "@angular/core";
import { FileService } from "../services/file";

type FoliateElement = HTMLElement & {
  open: (book: unknown) => void;
  goTo: (target: { index: number }) => void;
  prev: () => void;
  next: () => void;
  destroy: () => void;
};

@Component({
  selector: "foliate-renderer",
  template: ``,
  host: {
    tabindex: "0",
    "(keydown)": "onKeydown($event)",
  },
})
export class FoliateRenderer implements OnInit, OnDestroy {
  path = input.required<string>();
  index = input<number>(0);
  file = inject(FileService);
  private readonly elementRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private foliate?: FoliateElement;
  private readonly attachedDocs = new Set<Document>();

  async ngOnInit(): Promise<void> {
    const { EPUB } = await import("foliate-js/epub.js");
    const epub = await new EPUB(await this.zipLoader()).init();

    await import("foliate-js/paginator.js");
    this.foliate = document.createElement("foliate-paginator") as FoliateElement;

    this.foliate.addEventListener("load", (event: Event) => {
      const doc = (event as CustomEvent<{ doc?: Document }>).detail?.doc;
      if (!doc || this.attachedDocs.has(doc)) return;
      this.attachedDocs.add(doc);
      doc.addEventListener("keydown", this.onKeydown.bind(this));
    });

    this.foliate.open(epub);
    this.foliate.goTo({ index: this.index() });
    this.elementRef.nativeElement.appendChild(this.foliate);
    this.elementRef.nativeElement.focus();
  }

  private async zipLoader() {
    const file = await this.file.getFile(this.path());
    const zip = await import("foliate-js/vendor/zip.js");
    zip.configure({ useWebWorkers: false });
    const entries = await new zip.ZipReader(new zip.BlobReader(file)).getEntries();
    const byName = new Map(entries.map((e) => [e.filename, e]));
    const getEntry = (filename: string) => byName.get(filename);

    const loadText = async (filename: string) => {
      const entry = getEntry(filename) as unknown as {
        getData: (writer: unknown) => Promise<string>;
      };
      return entry?.getData(new zip.TextWriter());
    };
    const loadBlob = async (filename: string) => {
      const entry = getEntry(filename) as unknown as {
        getData: (writer: unknown) => Promise<Blob>;
      };
      return entry?.getData(new zip.BlobWriter());
    };
    const getSize = async (filename: string) => getEntry(filename)?.uncompressedSize;

    return { loadText, loadBlob, getSize };
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

  ngOnDestroy(): void {
    for (const doc of this.attachedDocs) {
      doc.removeEventListener("keydown", this.onKeydown);
    }
    this.attachedDocs.clear();
    this.foliate?.destroy();
    this.elementRef.nativeElement.innerHTML = "";
  }
}
