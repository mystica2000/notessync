import { Component, inject, Input } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { ISearchResult } from '../types';
import { AppService } from '../../../services/app.service';

@Component({
  selector: 'app-app-search-content',
  imports: [],
  templateUrl: './app-search-content.html',
  styleUrl: './app-search-content.scss'
})
export class AppSearchContent {
  @Input() result: ISearchResult[] = [];

  private appService = inject(AppService);

  formatScore(distance: number): string {
    if (distance === undefined || distance === null || isNaN(distance)) {
      return '0.00';
    }
    return Number(distance).toFixed(3);
  }

  async copyNote(content: string) {
    try {
      await Clipboard.write({ string: content });
      this.appService.toast('Copied to clipboard');
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        this.appService.toast('Copied to clipboard');
      }
    }
  }
}
