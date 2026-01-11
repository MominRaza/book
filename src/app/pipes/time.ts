import { Pipe } from "@angular/core";

@Pipe({
  name: "time",
})
export class Time {
  transform(value: number): string {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = Math.floor(value % 60);

    const parts = [];
    if (hours > 0) {
      parts.push(hours.toString());
      parts.push(minutes.toString().padStart(2, "0"));
    } else {
      parts.push(minutes.toString());
    }
    parts.push(seconds.toString().padStart(2, "0"));
    return parts.join(":");
  }
}
