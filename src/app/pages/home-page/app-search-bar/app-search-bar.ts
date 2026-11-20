import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { OnnxInferenceService } from '../../../services/onnx-inference.service';
import { ISearchResult } from '../types';

@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-search-bar.html',
  styleUrl: './app-search-bar.scss'
})
export class AppSearchBar {
  searchText: string = '';
  isInputFocused: boolean = false;
  isSearching = signal(false);

  modelInference = inject(OnnxInferenceService);

  @Output() resultsEmitter = new EventEmitter<ISearchResult[]>();

  async search() {
    const query = this.searchText.trim();
    if (!query) {
      this.resultsEmitter.emit([]);
      return;
    }

    try {
      this.isSearching.set(true);
      const embeddings = await this.modelInference.generateEmbeddings(query, 'search');
      const { data } = await VectorSqlite.query({ search: embeddings });
      this.resultsEmitter.emit(data || []);
    } catch (e) {
      console.error('Search error:', e);
      this.resultsEmitter.emit([]);
    } finally {
      this.isSearching.set(false);
    }
  }

  clearSearch() {
    this.searchText = '';
    this.resultsEmitter.emit([]);
  }

  onSearchTextChange(newValue: string) {
    if (newValue === '') {
      this.resultsEmitter.emit([]);
    }
  }
}
