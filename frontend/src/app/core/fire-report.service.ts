import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { ApiCollection, ApiResource, FireReport } from './models';

export interface FireReportPayload {
  region_id: number;
  lat: number;
  lng: number;
  image: File;
}

@Injectable({
  providedIn: 'root'
})
export class FireReportService {
  constructor(private http: HttpClient) {}

  submitReport(payload: FireReportPayload): Observable<FireReport> {
    const formData = new FormData();
    formData.append('region_id', String(payload.region_id));
    formData.append('lat', String(payload.lat));
    formData.append('lng', String(payload.lng));
    formData.append('image', payload.image);

    return this.http
      .post<ApiResource<FireReport>>(`${API_BASE_URL}/fire-reports`, formData)
      .pipe(map((response) => response.data));
  }

  listMyReports(): Observable<FireReport[]> {
    return this.http
      .get<ApiCollection<FireReport>>(`${API_BASE_URL}/my/fire-reports`)
      .pipe(map((response) => response.data));
  }

  listAdminReports(): Observable<FireReport[]> {
    return this.http
      .get<ApiCollection<FireReport>>(`${API_BASE_URL}/admin/fire-reports`)
      .pipe(map((response) => response.data));
  }
}
