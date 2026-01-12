import { TOC } from "./epub";

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverImage?: Blob;
  toc: TOC[];
  handle: FileSystemFileHandle;
}
