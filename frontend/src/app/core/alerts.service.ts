import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Alert, ApiCollection, ApiResource } from './models';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  constructor(private http: HttpClient) {}

  createAlert(payload: FormData): Observable<Alert> {
    return this.http.post<ApiResource<Alert>>(`${API_BASE_URL}/alerts`, payload).pipe(
      map((response) => response.data)
    );
  }

  updateAlert(id: number, payload: FormData): Observable<Alert> {
    return this.http.patch<ApiResource<Alert>>(`${API_BASE_URL}/alerts/${id}`, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteAlert(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/alerts/${id}`);
  }

  getUserAlerts(): Observable<Alert[]> {
    return this.http.get<ApiCollection<Alert>>(`${API_BASE_URL}/alerts/user`).pipe(
      map((response) => response.data)
    );
  }

  getAllAlerts(): Observable<Alert[]> {
    return this.http.get<ApiCollection<Alert>>(`${API_BASE_URL}/alerts`).pipe(
      map((response) => response.data)
    );
  }
}
