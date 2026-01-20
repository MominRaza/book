import { Location } from "@angular/common";
import { Component, ElementRef, inject, OnDestroy, OnInit, viewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";

import { Player } from "../components/player";
import { Sidebar } from "../components/sidebar";
import { ReaderService } from "../services/reader";

@Component({
  selector: "app-reader",
  imports: [MatSidenavModule, MatButtonModule, MatIconModule, MatToolbarModule, Player, Sidebar],
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer>
        <app-sidebar (close)="drawer.close()" />
      </mat-drawer>
      <mat-drawer-content>
        <mat-toolbar>
          <button matIconButton (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <div [style.flex]="1"></div>
          <button matIconButton>
            <mat-icon>settings</mat-icon>
          </button>
          <button matIconButton (click)="location.back()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-toolbar>
        <div tabindex="0" (keydown)="readerService.onKeydown($event)" class="foliate-container" #foliateContainer></div>
        <app-player />
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styleUrl: "./reader.css",
})
export class Reader implements OnInit, OnDestroy {
  protected readonly readerService = inject(ReaderService);
  protected readonly location = inject(Location);

  private readonly elementRef = viewChild.required<ElementRef<HTMLElement>>("foliateContainer");

  async ngOnInit(): Promise<void> {
    const foliate = await this.readerService.initFoliate();
    if (!foliate) return;
    this.elementRef().nativeElement.appendChild(foliate);
    this.elementRef().nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.readerService.destroy();
    this.elementRef().nativeElement.innerHTML = "";
  }
}
