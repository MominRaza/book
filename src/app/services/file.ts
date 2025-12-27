import { inject, Injectable } from "@angular/core";
import { LibraryStoreService } from "./library-store";
import { FsAccessService } from "./fs-access";

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
}
