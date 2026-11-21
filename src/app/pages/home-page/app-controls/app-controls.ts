import { Component, ComponentRef, inject, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { OnnxInferenceService } from '../../../services/onnx-inference.service';
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
  private inference = inject(OnnxInferenceService);
  private viewContainer = inject(ViewContainerRef);
  private containerRef: ComponentRef<Toast> | null = null;
  private appService = inject(AppService);

  addData() {
    this.router.navigate(['add-content']);
  }

  importContent() {
    this.showToast('Import feature coming soon');
  }

  async addFromClipboard() {
    try {
      const { type, value } = await Clipboard.read();

      if ((type === 'text/plain' || type === 'url') && value?.trim()) {
        const trimmed = value.trim();
        const embeddings = await this.inference.generateEmbeddings(trimmed, 'content');
        await VectorSqlite.insert({ content: trimmed, embedding: embeddings });
        this.appService.vectorDBRefreshSource.next(true);
        await this.showToast('Note added from clipboard');
      } else {
        await this.showToast('No text found in clipboard');
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
      await this.showToast('Could not access clipboard');
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
      }, 1500);
    });
  }
}
