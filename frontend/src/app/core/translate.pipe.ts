import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from './i18n.service';

@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;

  constructor(private i18n: I18nService, private cdr: ChangeDetectorRef) {
    this.subscription = this.i18n.lang$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.translate(key, params);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
