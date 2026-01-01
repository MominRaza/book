import { computed, Directive, input, OnDestroy } from "@angular/core";

@Directive({
  selector: "[blobImg]",
  host: {
    "[attr.src]": "blobUrl()",
  },
})
export class BlobImage implements OnDestroy {
  src = input<Blob>();
  blobUrl = computed(() => {
    const blob = this.src();
    return blob ? URL.createObjectURL(blob) : null;
  });

  ngOnDestroy(): void {
    const blobSrc = this.blobUrl();
    if (blobSrc) URL.revokeObjectURL(blobSrc);
  }
}
