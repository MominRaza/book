import { Routes } from "@angular/router";
import { epubResolver } from "./resolver/epub";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home").then((m) => m.HomePage),
  },
  {
    path: "library",
    loadComponent: () => import("./pages/library").then((m) => m.LibraryPage),
  },
  {
    path: "library/:bookId",
    loadComponent: () => import("./pages/reader").then((m) => m.ReaderPage),
    resolve: {
      epub: epubResolver,
    },
  },
  { path: "**", redirectTo: "" },
];
