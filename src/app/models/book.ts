export interface Book {
  identifier: string;
  title: string;
  author?: string;
  publishedDate?: string;
  coverImage?: Blob;
}
