import { Routes } from "@angular/router";
import { epubResolver } from "./resolver/epub";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home").then((m) => m.Home),
  },
  {
    path: "library",
    loadComponent: () => import("./pages/library").then((m) => m.Library),
  },
  {
    path: "library/:bookId",
    loadComponent: () => import("./pages/reader").then((m) => m.Reader),
    resolve: {
      epub: epubResolver,
    },
  },
  { path: "**", redirectTo: "" },
];
