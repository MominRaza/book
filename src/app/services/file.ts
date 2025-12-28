import { inject, Injectable } from "@angular/core";
import { LibraryStoreService } from "./library-store";
import { FsAccessService } from "./fs-access";
import { EPUBType } from "../models/epub";

@Injectable({ providedIn: "root" })
export class FileService {
  store = inject(LibraryStoreService);
  fs = inject(FsAccessService);

  async getFile(path: string): Promise<File> {
    const root = await this.store.getBooksDirectoryHandle();
    if (!root) {
      throw new Error("Books directory is not set.");
    }
    return this.fs.getFileByRelativePath(root, path);
  }

  async getEpub(path: string): Promise<EPUBType> {
    const file = await this.getFile(path);
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

    const { EPUB } = await import("foliate-js/epub.js");
    return new EPUB({ loadText, loadBlob, getSize }).init() as Promise<EPUBType>;
  }
}
