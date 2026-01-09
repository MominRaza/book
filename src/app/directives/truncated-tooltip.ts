import { Directive, ElementRef, inject, input } from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";

@Directive({
  selector: "[truncatedTooltip]",
  host: {
    "(mouseenter)": "onMouseEnter()",
  },
})
export class TruncatedTooltip {
  readonly tooltipText = input.required<string>({ alias: "matTooltip" });
  private readonly matTooltip = inject(MatTooltip);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onMouseEnter(): void {
    if (this.isTextTruncated()) {
      this.matTooltip.message = this.tooltipText();
    } else {
      this.matTooltip.message = "";
    }
  }

  private isTextTruncated(): boolean {
    const element = this.elementRef.nativeElement;
    return element.scrollWidth > element.clientWidth;
  }
}
