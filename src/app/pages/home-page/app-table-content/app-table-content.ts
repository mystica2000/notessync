import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Clipboard } from '@capacitor/clipboard';
import { BehaviorSubject, filter, Subscription, take } from 'rxjs';
import { mergeWith } from 'rxjs/operators';
import { VectorSqlite } from 'vector-sqlite-plugin';
import { Loading } from '../../../components/loading/loading';
import { AppService } from '../../../services/app.service';

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
  private router = inject(Router);

  public opt: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public hasMore = signal(false);
  public nextCursor = signal(0);

  appService = inject(AppService);

  private dbSubscription!: Subscription;

  async ngOnInit() {
    this.dbSubscription = this.appService.isVectorDBInitialized
      .pipe(
        filter((isInitialized: boolean) => isInitialized === true),
        take(1),
        mergeWith(
          this.appService.vectorDBRefreshSource.pipe(
            filter((shouldRefresh) => shouldRefresh === true)
          )
        )
      )
      .subscribe(async () => {
        const { results, nextCursor, hasMore } = await VectorSqlite.getWithPagination({ limit: 10 });
        this.opt.next(results || []);
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
    if (this.sentinelElementRef && this.sentinelElementRef.nativeElement) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
      });
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

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !this.isLoading) {
        this.loadMoreContent();
      }
    });
  }

  private async loadMoreContent() {
    this.isLoading = true;

    const { results, nextCursor, hasMore } = await VectorSqlite.getWithPagination({
      limit: 10,
      cursor: this.nextCursor()
    });

    const currentItems = this.opt.value;

    this.opt.next([...currentItems, ...(results || [])]);
    this.hasMore.set(hasMore);

    if (nextCursor) {
      this.nextCursor.set(nextCursor);
    }

    this.isLoading = false;
  }

  addNote() {
    this.router.navigate(['add-content']);
  }

  async copyNote(content: string) {
    try {
      await Clipboard.write({ string: content });
      this.appService.toast('Copied to clipboard');
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        this.appService.toast('Copied to clipboard');
      }
    }
  }
}
