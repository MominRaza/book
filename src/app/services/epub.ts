import { Injectable } from "@angular/core";

import { EPUBType } from "../models/epub";
import { Book } from "../models/book";
import { sha256Hex } from "../utils/hash";

@Injectable({ providedIn: "root" })
export class EpubService {
  async getEpub(file: File): Promise<EPUBType> {
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

  async getBook(fileHandle: FileSystemFileHandle): Promise<Book> {
    const file = await fileHandle.getFile();
    const epub = await this.getEpub(file);
    return {
      identifier: epub.metadata.identifier || (await sha256Hex(`epub:${file.name}`)),
      title: epub.metadata.title || file.name,
      author: epub.metadata.author?.name,
      coverImage: await epub.getCover(),
      handle: fileHandle,
    };
  }
}
