import { Pipe } from "@angular/core";

@Pipe({
  name: "time",
})
export class Time {
  transform(value: number): string {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
