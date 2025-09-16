import { Component, ComponentRef, computed, inject, signal, ViewContainerRef } from '@angular/core';
import { AppHeader } from "../../components/app-header/app-header";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { InferenceService } from '../../services/inference.service';
import { Toast } from '../../components/toast/toast';

@Component({
  selector: 'app-add-content',
  imports: [AppHeader, CommonModule, FormsModule],
  templateUrl: './add-content-page.html',
  styleUrl: './add-content-page.scss'
})
export class AddContentPage {
  content = signal('');

  isNearLimit = computed(() => {
    const currentContent = this.content();
    const remaining = 700 - currentContent.length;
    return remaining <= 50;
  })

  getRemainingChars = computed(() => {
    const currentCount = this.content();
    return 700 - currentCount.length;
  });

  disableButton = signal(false);

  location = inject(Location);
  modelInference = inject(InferenceService);

  private viewContainer = inject(ViewContainerRef);
  private containerRef: ComponentRef<Toast> | null = null;

  async onSubmit(form: any) {
    if (form.valid) {
      const currentContent = this.content().toString().trim();
      if (currentContent.length > 0) {
        this.disableButton.set(true);
        const embeddings = await this.modelInference.generateEmbeddings(currentContent);
        await VectorSqlite.insert({ content: currentContent, embedding: embeddings });

        await this.showToast("added successfully");
        this.onBack();

      } else {
        this.content.set("");
      }
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

  updateContent(event: any) {
    this.content.set(event);
  }

  onBack() {
    this.location.back()
  }
}
