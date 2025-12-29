import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from "@angular/core";
import { provideRouter, withEnabledBlockingInitialNavigation } from "@angular/router";

import { routes } from "./app.routes";
import { LibraryStoreService } from "./services/library-store";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideAppInitializer(() => {
      const store = inject(LibraryStoreService);
      return store.initializeFromCache();
    }),
  ],
};
