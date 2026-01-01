import { Routes } from "@angular/router";

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
    path: "reader/:bookId",
    loadComponent: () => import("./pages/reader").then((m) => m.ReaderPage),
  },
];
