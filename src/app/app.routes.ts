import { Routes } from "@angular/router";
import { audiobooksResolver } from "./resolver/audiobooks";
import { booksResolver } from "./resolver/books";
import { epubResolver } from "./resolver/epub";
import { handlesResolver } from "./resolver/handles";
import { linksResolver } from "./resolver/links";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home").then((m) => m.Home),
    resolve: { directoryHandles: handlesResolver },
  },
  {
    path: "setup",
    loadComponent: () => import("./pages/setup").then((m) => m.Setup),
    resolve: { books: booksResolver, audiobooks: audiobooksResolver, links: linksResolver },
  },
  {
    path: "library",
    loadComponent: () => import("./pages/library").then((m) => m.Library),
  },
  {
    path: "library/:bookId",
    loadComponent: () => import("./pages/reader").then((m) => m.Reader),
    resolve: { epub: epubResolver },
  },
  { path: "**", redirectTo: "" },
];
