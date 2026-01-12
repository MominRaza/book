import { Routes } from "@angular/router";
import { readerResolver } from "./resolver/reader";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home").then((m) => m.Home),
  },
  {
    path: "setup",
    loadComponent: () => import("./pages/setup").then((m) => m.Setup),
  },
  {
    path: "library",
    loadComponent: () => import("./pages/library").then((m) => m.Library),
  },
  {
    path: "library/:bookId",
    loadComponent: () => import("./pages/reader").then((m) => m.Reader),
    resolve: { reader: readerResolver },
  },
  { path: "**", redirectTo: "" },
];
