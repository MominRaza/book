import { Pipe } from "@angular/core";

@Pipe({
  name: "bookTitle",
})
export class BookTitle {
  transform(title: string): string {
    return title.replace(/--+/g, ": ").replace(/_/g, ":");
  }
}
