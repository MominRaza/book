export type Link = {
  bookId: string;
  audiobookId: string;

  chapterMap?: {
    [audioTrackId: string]: string;
  };
};
