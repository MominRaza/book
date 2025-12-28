import { Component } from "@angular/core";
import { FoliateRenderer } from "../components/foliate-renderer";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-reader",
  imports: [FoliateRenderer, RouterLink],
  template: `
    <foliate-renderer [path]="path" />
    <button routerLink="/library">Close</button>
  `,
  styles: `
    button {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
  `,
})
export class Reader {
  path = new URLSearchParams(window.location.search).get("path") || "";
}
