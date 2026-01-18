import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';
import { ApiCollection, ApiResource, Region } from './models';

interface RegionPayload {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  constructor(private http: HttpClient) {}

  listRegions(includeInactive = false): Observable<Region[]> {
    const params = new HttpParams().set('include_inactive', String(includeInactive));
    return this.http.get<ApiCollection<Region>>(`${API_BASE_URL}/regions`, { params }).pipe(
      map((response) => response.data)
    );
  }

  listAdminRegions(): Observable<Region[]> {
    return this.http.get<ApiCollection<Region>>(`${API_BASE_URL}/admin/regions`).pipe(
      map((response) => response.data)
    );
  }

  createRegion(payload: RegionPayload): Observable<Region> {
    return this.http.post<ApiResource<Region>>(`${API_BASE_URL}/admin/regions`, payload).pipe(
      map((response) => response.data)
    );
  }

  updateRegion(id: number, payload: Partial<RegionPayload>): Observable<Region> {
    return this.http.patch<ApiResource<Region>>(`${API_BASE_URL}/admin/regions/${id}`, payload).pipe(
      map((response) => response.data)
    );
  }

  deleteRegion(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/admin/regions/${id}`);
  }
}
