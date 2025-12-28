import { Component } from "@angular/core";
import { FoliateRenderer } from "../components/foliate-renderer";

@Component({
  selector: "app-reader",
  imports: [FoliateRenderer],
  template: `<foliate-renderer [path]="path" />`,
  styles: [],
})
export class Reader {
  path = new URLSearchParams(window.location.search).get("path") || "";
}
