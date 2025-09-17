import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { InferenceService } from '../../../services/inference.service';
import { ISearchResult } from '../types';

@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-search-bar.html',
  styleUrl: './app-search-bar.scss'
})
export class AppSearchBar {
  searchText: string = "";
  modelInference = inject(InferenceService);

  @Output() resultsEmitter = new EventEmitter<ISearchResult[]>();

  async search() {
    const embeddings = await this.modelInference.generateEmbeddings(this.searchText, 'search');
    const { data, count } = await VectorSqlite.query({ search: embeddings });
    this.resultsEmitter.emit(data);
  }

  onSearchTextChange(newValue: string) {
    // Check if the input is cleared (i.e., the new value is an empty string)
    if (newValue === '') {
      this.resultsEmitter.emit([]);
    }
  }
}
