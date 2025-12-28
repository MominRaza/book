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
