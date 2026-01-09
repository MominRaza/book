import { ResolveFn } from "@angular/router";
import { IDBService } from "../services/idb";
import { inject } from "@angular/core";
import { FileSystemDirectoryHandleWithPermissions } from "../services/file";

export interface Handles {
  booksHandle?: FileSystemDirectoryHandleWithPermissions;
  audiobooksHandle?: FileSystemDirectoryHandleWithPermissions;
}

export const handlesResolver: ResolveFn<Handles> = async () => {
  const idbService = inject(IDBService);
  const directoryHandles = await idbService.getAllDirectoryHandles();

  const booksHandle = directoryHandles.find((d) => d.type === "books")?.handle;
  const audiobooksHandle = directoryHandles.find((d) => d.type === "audiobooks")?.handle;

  return { booksHandle, audiobooksHandle };
};
