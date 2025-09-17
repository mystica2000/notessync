import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { AppService } from '../../../services/app.service';
import { BehaviorSubject, filter, Subscription, take } from 'rxjs';
import { Loading } from "../../../components/loading/loading";
import { VectorSqlite } from 'vector-sqlite-plugin';
import { merge, mergeWith } from 'rxjs/operators';

@Component({
  selector: 'app-table-content',
  imports: [AsyncPipe, Loading],
  templateUrl: './app-table-content.html',
  styleUrl: './app-table-content.scss'
})
export class AppTableContent {

  @ViewChild('sentinelElement', { read: ElementRef }) private sentinelElementRef!: ElementRef;

  private observer!: IntersectionObserver;
  private isLoading = false;

  public opt: BehaviorSubject<any> = new BehaviorSubject([]);
  public hasMore = signal(false);
  public nextCursor = signal(0);

  appService = inject(AppService);

  private dbSubscription!: Subscription;

  async ngOnInit() {

    console.log("APP TABLE ");
    this.dbSubscription = (this.appService.isVectorDBInitialized
      .pipe(
        filter((isInitialized: boolean) => isInitialized === true), // Only when true
        take(1), // Auto-unsubscribe after first true value,
        mergeWith(this.appService.vectorDBRefreshSource.pipe(
          filter(shouldRefresh => shouldRefresh === true)
        ))
      ))
      .subscribe(async () => {
        const { results, nextCursor, hasMore } = await VectorSqlite.getWithPagination({ limit: 10 })
        this.opt.next(results);
        this.hasMore.set(hasMore);

        if (nextCursor) {
          this.nextCursor.set(nextCursor);
        }

        setTimeout(() => {
          this.initIntersectionObserver();
        }, 0);
      });
  }

  private initIntersectionObserver(): void {
    // Check if the element exists before trying to observe it
    if (this.sentinelElementRef && this.sentinelElementRef.nativeElement) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), { root: null, rootMargin: '0px', threshold: 1.0 });
      this.observer.observe(this.sentinelElementRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.dbSubscription) {
      this.dbSubscription.unsubscribe();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.isLoading) {
        this.loadMoreContent();
      }
    })
  }

  private async loadMoreContent() {
    this.isLoading = true;

    const { results, nextCursor, hasMore } = await VectorSqlite.getWithPagination({
      limit: 10,
      cursor: this.nextCursor()
    });

    const currentItems = this.opt.value;

    this.opt.next([...currentItems, ...results]);
    this.hasMore.set(hasMore);

    if (nextCursor) {
      this.nextCursor.set(nextCursor);
    }

    this.isLoading = false;
  }
}
