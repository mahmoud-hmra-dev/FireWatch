import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth.service';
import { User } from './core/models';
import { I18nService } from './core/i18n.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  user: User | null = null;
  isAuthenticated = false;
  isAdmin = false;
  isUser = false;
  currentLang = 'en';

  constructor(private auth: AuthService, private router: Router, private i18n: I18nService) {}

  ngOnInit(): void {
    this.i18n.init();
    this.i18n.lang$.subscribe((lang) => {
      this.currentLang = lang;
    });

    this.auth.user$.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      this.isAdmin = user?.role === 'admin';
      this.isUser = user?.role === 'user';
    });
  }

  changeLanguage(lang: string): void {
    this.i18n.setLanguage(lang);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/'])
    });
  }
}
