export type Track = {
  id: string;
  name: string;
  order: number;
  handle: FileSystemFileHandle;
};

export type Audiobook = {
  id: string;
  name: string;
  tracks: Track[];
};
