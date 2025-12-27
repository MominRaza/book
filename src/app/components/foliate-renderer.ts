import { Component, ElementRef, inject, input, OnInit, viewChild } from "@angular/core";
import { FileService } from "../services/file";

type FoliateElement = HTMLElement & {
  open: (epub: unknown) => void;
  goTo: (location: { index: number }) => void;
};

@Component({
  selector: "foliate-renderer",
  template: `<div #foliate></div>`,
  styles: [],
})
export class FoliateRenderer implements OnInit {
  path = input.required<string>();
  index = input<number>(0);
  file = inject(FileService);
  foliate = viewChild.required<ElementRef<HTMLElement>>("foliate");

  async ngOnInit(): Promise<void> {
    const { EPUB } = await import("foliate-js/epub.js");
    const epub = await new EPUB(await this.zipLoader()).init();

    await import("foliate-js/paginator.js");
    const foliateRenderer = document.createElement("foliate-paginator") as FoliateElement;
    this.foliate().nativeElement.appendChild(foliateRenderer);
    foliateRenderer.open(epub);
    foliateRenderer.goTo({ index: this.index() });
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
}
