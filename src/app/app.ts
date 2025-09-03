import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VectorDbService } from './services/vector-db.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('vector-embeddings-app');

  addedRow: boolean = false;

  vectorDB = inject(VectorDbService);

  onAddNewRow() {
    console.log("ADD NEW ROW");
    this.addedRow = !this.addedRow;

    this.vectorDB.initializeModel();
  }

  addToVectorDB() {

  }
}
