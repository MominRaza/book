import { Injectable } from "@angular/core";

type FileSystemDirectoryHandleWithPermissions = FileSystemDirectoryHandle & {
  queryPermission: () => Promise<"granted" | "denied">;
  requestPermission: () => Promise<"granted" | "denied">;
};

@Injectable({
  providedIn: "root",
})
export class FileService {
  async directoryPicker() {
    return (
      window as unknown as {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandleWithPermissions>;
      }
    ).showDirectoryPicker();
  }

  async verifyPermission(fileHandle: FileSystemDirectoryHandleWithPermissions) {
    if ((await fileHandle.queryPermission()) === "granted") {
      return true;
    }

    if ((await fileHandle.requestPermission()) === "granted") {
      return true;
    }

    return false;
  }

  async readFiles(dirHandle: FileSystemDirectoryHandle, extension: ".epub" | ".m4b") {
    const files: FileSystemFileHandle[] = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file" && entry.name.endsWith(extension)) {
        files.push(entry as FileSystemFileHandle);
      } else if (entry.kind === "directory") {
        const nested = await this.readFiles(entry as FileSystemDirectoryHandle, extension);
        files.push(...nested);
      }
    }
    return files;
  }
}
