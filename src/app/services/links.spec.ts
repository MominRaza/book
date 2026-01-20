import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { Track } from "../models/audiobook";
import { Book } from "../models/book";
import { TOC } from "../models/epub";
import { LinksService } from "./links";
import { StateService } from "./state";

describe("LinksService", () => {
  let service: LinksService;

  beforeEach(() => {
    const stateServiceMock: Partial<StateService> = {
      books: signal<Book[]>([
        { id: "book1", title: "Sample Book One", toc: [] },
      ] as unknown as Book[]).asReadonly(),
      audiobooks: signal([{ id: "audiobook1", name: "Sample Book 1", tracks: [] }]).asReadonly(),
    };

    TestBed.configureTestingModule({
      providers: [LinksService, { provide: StateService, useValue: stateServiceMock }],
    });

    service = TestBed.inject(LinksService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a new link", () => {
    const bookId = "book1";
    const audiobookId = "audiobook1";
    const link = service.createNewLink(bookId, audiobookId);
    expect(link).toBeDefined();
    expect(link.bookId).toBe(bookId);
    expect(link.audiobookId).toBe(audiobookId);
    expect(link.chapterMap).toBeDefined();
  });

  it("should suggest links", () => {
    const suggestions = service.linkSuggestions();
    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("should create a chapter map", () => {
    const tracks: Track[] = [
      { id: "t0", name: "01 - Opening Credits.m4b" },
      { id: "t1", name: "02 - Chapter 1.m4b" },
      { id: "t2", name: "03 - Chapter 2.m4b" },
      { id: "t3", name: "04 - Section 2.1.m4b" },
      { id: "t4", name: "05 - Section 2.2.m4b" },
      { id: "t5", name: "06 - End Credits.m4b" },
    ] as Track[];

    const toc: TOC[] = [
      { label: "Chapter 1", href: "chapter1.html" },
      {
        label: "Chapter 2",
        href: "chapter2.html",
        subitems: [
          { label: "Section 2.1", href: "section2_1.html" },
          { label: "Section 2.2", href: "section2_2.html" },
        ],
      },
    ];

    const chapterMap = service.chapterMap(tracks, toc);

    expect(chapterMap).toEqual({
      t1: "chapter1.html",
      t2: "chapter2.html",
      t3: "section2_1.html",
      t4: "section2_2.html",
    });
  });
});
