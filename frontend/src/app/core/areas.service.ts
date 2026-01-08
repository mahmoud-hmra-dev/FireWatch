import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { ApiCollection, ApiResource, Area } from './models';

interface AreaPayload {
  name: string;
  coordinates: { lat: number; lng: number }[];
  risk_level: string;
  temperature?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
}

interface WeatherPayload {
  fetch?: boolean;
  latitude?: number;
  longitude?: number;
  temperature?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AreasService {
  constructor(private http: HttpClient) {}

  listAreas(): Observable<Area[]> {
    return this.http.get<ApiCollection<Area>>(`${API_BASE_URL}/areas`).pipe(
      map((response) => response.data)
    );
  }

  createArea(payload: AreaPayload): Observable<Area> {
    return this.http.post<ApiResource<Area>>(`${API_BASE_URL}/areas`, payload).pipe(
      map((response) => response.data)
    );
  }

  updateArea(id: number, payload: Partial<AreaPayload>): Observable<Area> {
    return this.http.patch<ApiResource<Area>>(`${API_BASE_URL}/areas/${id}`, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteArea(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/areas/${id}`);
  }

  updateWeather(id: number, payload: WeatherPayload): Observable<Area> {
    return this.http.patch<ApiResource<Area>>(`${API_BASE_URL}/areas/${id}/weather`, payload).pipe(
      map((response) => response.data)
    );
  }
}
