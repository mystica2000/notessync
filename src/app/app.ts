import { Component, inject, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InferenceService } from './services/inference.service';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  @ViewChild('loaderContainer', { read: ViewContainerRef }) loaderVC!: ViewContainerRef;

  modelInference = inject(InferenceService);
  appService = inject(AppService);

  async ngAfterViewInit() {
    this.appService.setContainer(this.loaderVC);
    await this.initializeApp();
  }

  private async initializeApp() {
    this.appService.show();
    try {
      await this.appService.initializeVectorDB();
      await this.modelInference.initModel();
    } finally {
      this.appService.hide();
    }
  }


}
