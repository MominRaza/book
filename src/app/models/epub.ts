export type EPUBType = {
  metadata: Metadata;
  toc: TOC[];
  getCover: () => Promise<Blob | undefined>;
  sections: { resolveHref: (href: string) => string }[];
  resolveHref: (href: string) => { index: number; anchor: string | null };
  isExternal: (href: string) => boolean;
};

export type Metadata = {
  identifier: string;
  title: string;
  author: { name: string; sortAs: string; role: string };
  published: string;
  publisher: string;
  language: string;
  sortAs: string;
};

export type TOC = {
  label: string;
  href: string;
  subitems?: TOC[];
};
