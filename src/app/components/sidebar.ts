import { Component, input, output } from "@angular/core";
import { Metadata, TOC } from "../models/epub";

@Component({
  selector: "app-sidebar",
  template: `
    <div class="cover-metadata">
      <img [src]="coverUrl()" />
      <div class="metadata">
        <h1>{{ metadata()?.title }}</h1>
        <p>{{ metadata()?.author?.name }}</p>
      </div>
    </div>
    <ul>
      @for (item of toc(); track $index) {
        <li (click)="goTo.emit(item.href)">{{ item.label }}</li>
      }
    </ul>
  `,
  host: {
    "[class.show]": "show()",
  },
  styles: `
    :host {
      height: 100vh;
      width: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      position: absolute;
      background-color: var(--sidebar-bg);
      z-index: 1;
      left: calc(-1 * var(--sidebar-width));
      transition: left 0.3s ease-in-out;

      &.show {
        left: 0;
      }
    }
    .cover-metadata {
      display: flex;
      gap: 0.75rem;
      margin: 0.75rem;
    }
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
    }
    h1 {
      font-size: 1.5rem;
    }
    ul {
      flex: 1;
      overflow: auto;
      margin: 0;
      padding: 12px 4px;
    }
    li {
      list-style: none;
      margin-bottom: 4px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.75rem;

      &:hover {
        background-color: var(--sidebar-hover-bg);
      }
    }
  `,
})
export class Sidebar {
  metadata = input<Metadata>();
  coverUrl = input<string>();
  toc = input<TOC[]>();
  goTo = output<string>();
  show = input<boolean>(false);
}
