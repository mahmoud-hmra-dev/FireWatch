import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

type TranslationMap = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translations: TranslationMap = {};
  private langSubject = new BehaviorSubject<string>('en');

  readonly lang$ = this.langSubject.asObservable();

  constructor(private http: HttpClient) {}

  init(): void {
    const initial = this.normalize(this.getStoredLanguage() ?? this.getBrowserLanguage() ?? 'en');
    this.setLanguage(initial);
  }

  get currentLang(): string {
    return this.langSubject.value;
  }

  setLanguage(lang: string): void {
    const normalized = this.normalize(lang);
    this.loadTranslations(normalized)
      .pipe(
        map((translations) => ({ lang: normalized, translations })),
        catchError(() => {
          if (normalized === 'en') {
            return of({ lang: 'en', translations: {} });
          }
          return this.loadTranslations('en').pipe(
            map((translations) => ({ lang: 'en', translations })),
            catchError(() => of({ lang: 'en', translations: {} }))
          );
        })
      )
      .subscribe(({ lang: loadedLang, translations }) => {
        this.translations = translations;
        this.langSubject.next(loadedLang);
        this.persistLanguage(loadedLang);
        this.updateDocument(loadedLang);
      });
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) {
      return '';
    }

    let value = this.translations[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g'), String(paramValue));
      });
    }
    return value;
  }

  private loadTranslations(lang: string): Observable<TranslationMap> {
    return this.http.get<TranslationMap>(`assets/i18n/${lang}.json`);
  }

  private normalize(lang: string): string {
    return lang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }

  private getStoredLanguage(): string | null {
    try {
      return window.localStorage.getItem('fw_lang');
    } catch {
      return null;
    }
  }

  private getBrowserLanguage(): string | null {
    return typeof navigator !== 'undefined' ? navigator.language : null;
  }

  private persistLanguage(lang: string): void {
    try {
      window.localStorage.setItem('fw_lang', lang);
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }

  private updateDocument(lang: string): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
    }
  }
}
