import { Pipe } from "@angular/core";

@Pipe({
  name: "trackName",
})
export class TrackName {
  transform(name?: string): string {
    return (
      name
        ?.replace(/^\d{2}\s-\s/, "")
        .replace(/\.m4b$/, "")
        .replace(/_/g, ":") ?? ""
    );
  }
}
