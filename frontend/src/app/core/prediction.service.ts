import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { ApiResource, PredictionStatus } from './models';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  constructor(private http: HttpClient) {}

  getStatus(): Observable<PredictionStatus> {
    return this.http.get<ApiResource<PredictionStatus>>(`${API_BASE_URL}/prediction`).pipe(
      map((response) => response.data)
    );
  }

  toggleStatus(isEnabled: boolean): Observable<PredictionStatus> {
    return this.http.patch<ApiResource<PredictionStatus>>(`${API_BASE_URL}/prediction`, {
      is_enabled: isEnabled
    }).pipe(
      map((response) => response.data)
    );
  }
}
