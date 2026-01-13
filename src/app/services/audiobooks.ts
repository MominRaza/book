import { inject, Injectable } from "@angular/core";
import { Audiobook, Track } from "../models/audiobook";
import { FileService, FileSystemDirectoryHandleWithPermissions } from "./file";
import { IDBService } from "./idb";
import { sha256Hex } from "../utils/hash";
import { StateService } from "./state";

@Injectable({
  providedIn: "root",
})
export class AudiobooksService {
  private readonly fileService = inject(FileService);
  private readonly idbService = inject(IDBService);
  private readonly stateService = inject(StateService);

  async saveAudiobooks(directoryHandle: FileSystemDirectoryHandleWithPermissions) {
    const hasPermission = await this.fileService.verifyPermission(directoryHandle);
    if (!hasPermission) return;

    const audiobooks = await this.readAudiobooks(directoryHandle);
    if (audiobooks.length === 0) return;

    await this.idbService.addAudiobooks(audiobooks);
    this.stateService.setAudiobooks(audiobooks);
  }

  private async readAudiobooks(root: FileSystemDirectoryHandle): Promise<Audiobook[]> {
    const audiobooks: Audiobook[] = [];

    for await (const entry of root.values()) {
      if (entry.kind !== "directory") continue;

      const directoryHandle = entry as FileSystemDirectoryHandle;
      const audiobookName = directoryHandle.name.replace(/_/g, ":");
      const audiobookId = await sha256Hex(`audiobook:${audiobookName}`);

      const m4bHandles = await this.fileService.readFiles(directoryHandle, ".m4b");
      const tracks = m4bHandles.map((handle) => this.getTrack(audiobookId, handle));
      if (tracks.length === 0) continue;

      tracks.sort((a, b) => a.order - b.order);

      audiobooks.push({
        id: audiobookId,
        name: audiobookName,
        tracks,
      });
    }

    return audiobooks;
  }

  private getTrack(audiobookId: string, handle: FileSystemFileHandle): Track {
    const orderMatch = handle.name.match(/^(\d{2})\s-\s/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : -1;
    return {
      id: `${audiobookId}:${handle.name}`,
      name: handle.name
        .replace(/^\d{2}\s-\s/, "")
        .replace(/\.m4b$/, "")
        .replace(/_/g, ":")
        .replace("Ii: ", "II: "),
      order,
      handle,
    };
  }
}
