import { Injectable } from "@angular/core";

import { ScannedFile } from "../models/library";

@Injectable({ providedIn: "root" })
export class FsAccessService {
  private readonly secureContextHint =
    "Folder access requires a secure context. Use https:// or http://localhost (not a LAN IP).";

  async pickDirectory(): Promise<FileSystemDirectoryHandle> {
    if (!window.isSecureContext) {
      throw new Error(this.secureContextHint);
    }

    if (window.top !== window.self) {
      throw new Error("Folder picking is blocked inside iframes. Open the app in a top-level tab.");
    }

    const picker = (
      window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }
    ).showDirectoryPicker;

    if (!picker) {
      throw new Error("Folder picking is not supported in this browser. Use Chrome or Edge.");
    }

    return picker();
  }

  async ensureDirectoryReadPermission(handle: FileSystemDirectoryHandle): Promise<void> {
    const anyHandle = handle as unknown as {
      queryPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
      requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
    };

    if (!anyHandle.queryPermission || !anyHandle.requestPermission) {
      // If the browser doesn't support the permission APIs, we just try and let operations fail.
      return;
    }

    const current = await anyHandle.queryPermission({ mode: "read" });
    if (current === "granted") return;

    const requested = await anyHandle.requestPermission({ mode: "read" });
    if (requested !== "granted") {
      throw new Error(
        "Permission to read the selected folder was not granted. Please choose it again.",
      );
    }
  }

  async scanForEpubs(root: FileSystemDirectoryHandle): Promise<ScannedFile[]> {
    await this.ensureDirectoryReadPermission(root);
    return this.scanRecursive(root, [".epub"], "book");
  }

  async scanForAudiobooks(root: FileSystemDirectoryHandle): Promise<ScannedFile[]> {
    await this.ensureDirectoryReadPermission(root);
    return this.scanRecursive(root, [".m4b"], "audiobook");
  }

  async getFileByRelativePath(
    root: FileSystemDirectoryHandle,
    relativePath: string,
  ): Promise<File> {
    const normalized = relativePath.replaceAll("\\", "/").replace(/^\//, "");
    const parts = normalized.split("/").filter((p) => p.length > 0);

    if (parts.length === 0) {
      throw new Error("Invalid file path.");
    }

    let currentDir: FileSystemDirectoryHandle = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]!;
      currentDir = await currentDir.getDirectoryHandle(dirName, { create: false });
    }

    const fileName = parts[parts.length - 1]!;
    const fileHandle = await currentDir.getFileHandle(fileName, { create: false });
    return fileHandle.getFile();
  }

  private async scanRecursive(
    root: FileSystemDirectoryHandle,
    allowedExtensions: readonly string[],
    kind: ScannedFile["kind"],
  ): Promise<ScannedFile[]> {
    const lowerAllowed = allowedExtensions.map((e) => e.toLowerCase());

    const results: ScannedFile[] = [];
    const stack: Array<{ dir: FileSystemDirectoryHandle; prefix: string }> = [
      { dir: root, prefix: "" },
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      for await (const [name, entry] of current.dir.entries()) {
        if (entry.kind === "directory") {
          const dirEntry = entry as FileSystemDirectoryHandle;
          stack.push({ dir: dirEntry, prefix: `${current.prefix}${name}/` });
          continue;
        }

        if (entry.kind === "file") {
          const lowerName = name.toLowerCase();
          const isAllowed = lowerAllowed.some((ext) => lowerName.endsWith(ext));
          if (!isAllowed) continue;

          let sizeBytes: number | null = null;
          let mimeType: string | null = null;
          let lastModifiedMs: number | null = null;
          let lastModifiedIso: string | null = null;

          try {
            const fileHandle = entry as unknown as FileSystemFileHandle;
            const file = await fileHandle.getFile();

            sizeBytes = typeof file.size === "number" ? file.size : null;
            mimeType = typeof file.type === "string" && file.type.length > 0 ? file.type : null;
            lastModifiedMs = typeof file.lastModified === "number" ? file.lastModified : null;
            lastModifiedIso =
              lastModifiedMs !== null ? new Date(lastModifiedMs).toISOString() : null;
          } catch {
            // Keep metadata nullable if we can't read it.
          }

          results.push({
            kind,
            name,
            relativePath: `${current.prefix}${name}`,
            sizeBytes,
            mimeType,
            lastModifiedMs,
            lastModifiedIso,
          });
        }
      }
    }

    results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return results;
  }
}
