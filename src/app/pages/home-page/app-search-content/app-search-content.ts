import { Component, Input } from '@angular/core';
import { ISearchResult } from '../types';

@Component({
  selector: 'app-app-search-content',
  imports: [],
  templateUrl: './app-search-content.html',
  styleUrl: './app-search-content.scss'
})
export class AppSearchContent {
  @Input() result: ISearchResult[] = [];
}
