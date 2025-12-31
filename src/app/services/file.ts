import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FileService {
  async directoryPicker() {
    return (
      window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
    ).showDirectoryPicker();
  }
}
