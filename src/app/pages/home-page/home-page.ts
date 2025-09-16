import { Component, signal } from '@angular/core';
import { AppControls } from "./app-controls/app-controls";
import { AppSearchBar } from "./app-search-bar/app-search-bar";
import { AppTableContent } from "./app-table-content/app-table-content";
import { AppHeader } from "../../components/app-header/app-header";
import { AppSearchContent } from './app-search-content/app-search-content';
import { ISearchResult } from './types';

@Component({
  selector: 'app-home-page',
  imports: [AppControls, AppSearchBar, AppTableContent, AppHeader, AppSearchContent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
  showSearch = signal(false);
  opt: ISearchResult[] = [];

  async handleSearchResults(opt: any) {
    if (opt.length > 0) {
      this.opt = opt;
      this.showSearch.set(true);
    } else {
      this.opt = [];
      this.showSearch.set(false);
    }
  }
}