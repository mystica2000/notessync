import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { Loading } from '../components/loading/loading';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  isVectorDBInitialized = new BehaviorSubject<boolean>(false);
  private loaderRef?: ComponentRef<Loading>;
  private container?: ViewContainerRef;
  private counter = 0;

  setContainer(vc: ViewContainerRef) {
    this.container = vc;
  }

  show() {
    this.counter++;
    if (!this.container) throw new Error('Loader container not set!');

    // Create loader only once
    if (!this.loaderRef) {
      this.loaderRef = this.container.createComponent<Loading>(Loading);
    }
  }

  hide() {
    this.counter = Math.max(0, this.counter - 1);
    if (this.counter === 0 && this.loaderRef) {

      if (this.loaderRef) {
        this.loaderRef.destroy();
        this.loaderRef = undefined;
      }
    }

  }

  public async initializeVectorDB() {
    try {
      await VectorSqlite.initialize();
      this.isVectorDBInitialized.next(true);
    } catch (error) {
      console.error('Vector DB initialization failed:', error);
      this.isVectorDBInitialized.next(false);
    }
  }

  get isReady(): boolean {
    return this.isVectorDBInitialized.value;
  }
}