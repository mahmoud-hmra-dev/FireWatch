import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { AuthResponse, MessageResponse, User } from './models';

interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'fw_token';
  private userKey = 'fw_user';
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse | { data: AuthResponse }>(`${API_BASE_URL}/login`, payload).pipe(
      map((response) => this.normalizeAuthResponse(response)),
      tap((response) => this.setSession(response))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse | { data: AuthResponse }>(`${API_BASE_URL}/register`, payload).pipe(
      map((response) => this.normalizeAuthResponse(response)),
      tap((response) => this.setSession(response))
    );
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API_BASE_URL}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get user(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  refreshProfile(): Observable<User> {
    return this.http.get<{ data: User }>(`${API_BASE_URL}/profile`).pipe(
      map((response) => response.data),
      tap((user) => this.setUser(user))
    );
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem(this.userKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  private normalizeAuthResponse(response: AuthResponse | { data: AuthResponse }): AuthResponse {
    const data = (response as { data?: AuthResponse }).data ?? (response as AuthResponse);
    if (!data || !data.token || !data.user) {
      throw new Error('Invalid auth response');
    }
    return data;
  }
}
