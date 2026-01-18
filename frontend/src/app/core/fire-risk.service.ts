import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { ApiCollection, ApiResource, DashboardOverview, FireRiskPrediction } from './models';

export interface FireRiskQuery {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall?: number;
  vegetation_index?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FireRiskService {
  constructor(private http: HttpClient) {}

  getLatest(regionId: number, generate = false, environment: FireRiskQuery = {}): Observable<FireRiskPrediction> {
    let params = new HttpParams()
      .set('region_id', String(regionId))
      .set('generate', String(generate));

    Object.entries(environment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<ApiResource<FireRiskPrediction>>(`${API_BASE_URL}/fire-risk/latest`, { params })
      .pipe(map((response) => response.data));
  }

  getHistory(regionId: number): Observable<FireRiskPrediction[]> {
    const params = new HttpParams().set('region_id', String(regionId));
    return this.http
      .get<ApiCollection<FireRiskPrediction>>(`${API_BASE_URL}/admin/fire-risk/history`, { params })
      .pipe(map((response) => response.data));
  }

  getAdminOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${API_BASE_URL}/admin/dashboard/overview`);
  }
}
