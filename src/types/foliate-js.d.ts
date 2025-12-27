declare module 'foliate-js/epub.js' {
  export class EPUB {
    constructor(loader: unknown);
    init(): Promise<unknown>;
  }
}

declare module 'foliate-js/paginator.js' {
  // side-effect module that defines the <foliate-paginator> custom element
}

declare module 'foliate-js/fixed-layout.js' {
  // side-effect module that defines the <foliate-fxl> custom element
}

declare module 'foliate-js/vendor/zip.js' {
  export function configure(options: unknown): void;
  export class ZipReader {
    constructor(reader: unknown);
    getEntries(): Promise<Array<{ filename: string; uncompressedSize?: number }>>;
  }
  export class BlobReader {
    constructor(blob: Blob);
  }
  export class TextWriter {
    constructor(encoding?: string);
  }
  export class BlobWriter {
    constructor(type?: string);
  }
}
