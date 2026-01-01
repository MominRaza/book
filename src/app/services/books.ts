import { inject, Injectable } from "@angular/core";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "../services/file";
import { EpubService } from "../services/epub";
import { IDBService } from "../services/idb";

@Injectable({
  providedIn: "root",
})
export class BooksService {
  private readonly fileService = inject(FileService);
  private epubService = inject(EpubService);
  private idbService = inject(IDBService);

  async saveBooks(directoryHandle: FileSystemDirectoryHandleWithPermissions) {
    const hasPermission = await this.fileService.verifyPermission(directoryHandle);
    if (!hasPermission) return;

    const epubFiles = await this.fileService.readFiles(directoryHandle, ".epub");
    if (epubFiles.length === 0) return;

    const books = await Promise.all(
      epubFiles.map(async (fileHandle) => await this.epubService.getBook(fileHandle)),
    );
    if (books.length === 0) return;

    await this.idbService.addBooks(books);
  }
}
