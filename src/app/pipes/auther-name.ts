import { Pipe } from "@angular/core";

@Pipe({
  name: "authorName",
})
export class AuthorName {
  transform(value?: string): string {
    if (!value) return "";
    const parts = value.split(", ");
    if (parts.length === 2) {
      return parts[1] + " " + parts[0];
    }
    return value;
  }
}