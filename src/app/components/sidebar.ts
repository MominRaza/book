import { Component, inject, output } from "@angular/core";
import { ReaderService } from "../services/reader";
import { AuthorName } from "../pipes/auther-name";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { BlobImage } from "../directives/blob-image";

@Component({
  selector: "app-sidebar",
  imports: [AuthorName, MatExpansionModule, MatListModule, BlobImage],
  template: `
    <div class="cover-metadata">
      <img blobImg [src]="readerService.book()?.coverImage" />
      <div class="metadata">
        <h1>{{ readerService.book()?.title }}</h1>
        <p>{{ readerService.book()?.author | authorName }}</p>
      </div>
    </div>
    <mat-accordion>
      <mat-nav-list>
        @for (item of readerService.toc(); track $index) {
          @if (item.subitems) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <a mat-list-item (click)="readerService.goTo(item.href); close.emit()">{{ item.label }}</a>
                </mat-panel-title>
              </mat-expansion-panel-header>
              <mat-nav-list>
                @for (subitem of item.subitems; track $index) {
                  <a mat-list-item class="subitem" (click)="readerService.goTo(subitem.href); close.emit()">
                    {{ subitem.label }}
                  </a>
                }
              </mat-nav-list>
            </mat-expansion-panel>
          } @else {
            <a mat-list-item (click)="readerService.goTo(item.href); close.emit()">{{ item.label }}</a>
          }
        }
      </mat-nav-list>
    </mat-accordion>
  `,
  styles: `
    .cover-metadata {
      display: flex;
      gap: 0.75rem;
      margin: 0.75rem;

      img {
        width: 5rem;
        height: auto;
        border-radius: 8px;
      }

      .metadata {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.5rem;

        h1 {
          font-size: 1.5rem;
        }
      }
    }
  `,
})
export class Sidebar {
  protected readonly readerService = inject(ReaderService);
  protected readonly close = output<void>();
}
