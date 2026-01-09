export type Track = {
  id: string;
  name: string;
  handle: FileSystemFileHandle;
};

export type Audiobook = {
  id: string;
  name: string;
  tracks: Track[];
};
