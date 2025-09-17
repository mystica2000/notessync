import { Component, ComponentRef, inject, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { InferenceService } from '../../../services/inference.service';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { Toast } from '../../../components/toast/toast';
import { AppService } from '../../../services/app.service';


@Component({
  selector: 'app-controls',
  imports: [],
  templateUrl: './app-controls.html',
  styleUrl: './app-controls.scss'
})
export class AppControls {
  private router = inject(Router);
  private inference = inject(InferenceService);

  private viewContainer = inject(ViewContainerRef);
  private containerRef: ComponentRef<Toast> | null = null;

  private appService = inject(AppService);

  addData() {
    this.router.navigate(['add-content']);
  }

  importContent() { }

  async addFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type == "text/plain" || type == "url") {
      console.log(value);

      const embeddings = await this.inference.generateEmbeddings(value, 'content');
      await VectorSqlite.insert({ content: value, embedding: embeddings });
      this.appService.vectorDBRefreshSource.next(true);
      await this.showToast("added successfully");
    }
  }

  private showToast(data: string): Promise<void> {
    if (this.containerRef) {
      this.containerRef.destroy();
    }

    this.containerRef = this.viewContainer.createComponent<Toast>(Toast);
    this.containerRef.instance.text = data;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.containerRef) {
          this.containerRef.destroy();
          this.containerRef = null;
        }
        resolve();
      }, 1000);
    });
  }
}
