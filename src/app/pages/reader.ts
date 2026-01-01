import { Component, inject, OnInit, signal } from "@angular/core";
import { FoliateRenderer } from "../components/foliate-renderer";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-reader",
  imports: [FoliateRenderer],
  template: `<foliate-renderer [bookId]="bookId" />`,
})
export class ReaderPage {
  private readonly activatedRoute = inject(ActivatedRoute);
  bookId = this.activatedRoute.snapshot.paramMap.get("bookId")!;
}
