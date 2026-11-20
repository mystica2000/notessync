import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { AppHeader } from '../../components/app-header/app-header';
import { OnnxInferenceService } from '../../services/onnx-inference.service';
import { AppService } from '../../services/app.service';

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
  });

  getRemainingChars = computed(() => {
    const currentCount = this.content();
    return 700 - currentCount.length;
  });

  disableButton = signal(false);

  location = inject(Location);
  modelInference = inject(OnnxInferenceService);
  private appService = inject(AppService);

  async onSubmit(form: any) {
    if (form.valid && !this.disableButton()) {
      const currentContent = this.content().toString().trim();
      if (currentContent.length > 0) {
        this.disableButton.set(true);
        try {
          const embeddings = await this.modelInference.generateEmbeddings(currentContent, 'content');
          await VectorSqlite.insert({ content: currentContent, embedding: embeddings });
          this.appService.vectorDBRefreshSource.next(true);
          this.appService.toast('Note added successfully');
          this.onBack();
        } catch (e) {
          console.error('Save error:', e);
          this.appService.toast('Failed to save note');
          this.disableButton.set(false);
        }
      } else {
        this.content.set('');
      }
    }
  }

  onKeyDown(event: KeyboardEvent, form: any) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (form.valid && !this.disableButton()) {
        this.onSubmit(form);
      }
    }
  }

  updateContent(event: any) {
    this.content.set(event);
  }

  onBack() {
    this.location.back();
  }
}
