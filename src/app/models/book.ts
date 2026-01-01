export interface Book {
  identifier: string;
  title: string;
  author?: string;
  coverImage?: Blob;
  handle: FileSystemFileHandle;
}
