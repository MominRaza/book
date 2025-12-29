import { JsonPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { ScannedFile } from "../models/library";

@Component({
  selector: "app-file-debug",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  styles: [
    `details { margin-top: 0.5rem; }
    pre {
      margin: 0.5rem 0 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: Field;
      color: FieldText;
      overflow: auto;
      max-height: 16rem;
    }
    `,
  ],
  template: `
    <details>
      <summary>Metadata</summary>
      <pre>{{ file() | json }}</pre>
    </details>
  `,
})
export class FileDebug {
  readonly file = input.required<ScannedFile>();
}
