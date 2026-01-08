import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertsService } from '../../core/alerts.service';
import { AreasService } from '../../core/areas.service';
import { PredictionService } from '../../core/prediction.service';
import { Alert, Area, AreaCoordinate } from '../../core/models';
import { I18nService } from '../../core/i18n.service';

declare const L: any;

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') mapElement?: ElementRef<HTMLDivElement>;
  areas: Area[] = [];
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  predictionEnabled = false;
  predictionLoading = false;
  statusMessageKey = '';
  selectedArea: Area | null = null;
  alertStatusKey = '';
  alertLoading = false;
  selectedFile: File | null = null;
  private map: any;
  private areaLayerGroup: any;
  private alertLayerGroup: any;
  private areaLayers = new Map<number, any>();
  private langSubscription?: Subscription;

  filterForm = this.fb.group({
    search: [''],
    source: [''],
    area_id: [''],
    time: ['all']
  });

  alertForm = this.fb.group({
    area_id: [''],
    description: [''],
    latitude: ['', Validators.required],
    longitude: ['', Validators.required]
  });

  areaForm = this.fb.group({
    name: ['', Validators.required],
    risk_level: ['low', Validators.required],
    coordinates: ['', Validators.required],
    temperature: [''],
    humidity: [''],
    wind_speed: ['']
  });

  editingAreaId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private alertsService: AlertsService,
    private areasService: AreasService,
    private predictionService: PredictionService,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.langSubscription = this.i18n.lang$.subscribe(() => {
      this.renderAreas();
      this.renderAlerts();
    });

    this.loadAreas();
    this.loadAlerts();
    this.loadPrediction();

    this.filterForm.valueChanges.subscribe(() => this.applyAlertFilters());
  }

  ngAfterViewInit(): void {
    if (!this.mapElement?.nativeElement || typeof L === 'undefined') {
      return;
    }

    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.areaLayerGroup = L.layerGroup().addTo(this.map);
    this.alertLayerGroup = L.layerGroup().addTo(this.map);
    this.map.setView([39.5, -98.35], 4);
    this.renderAreas(true);
    this.renderAlerts();
    if (this.selectedArea) {
      this.focusArea(this.selectedArea);
    }
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  loadAreas(): void {
    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.selectedArea = areas[0] ?? null;
        this.renderAreas(true);
        if (this.selectedArea) {
          this.focusArea(this.selectedArea);
          this.alertForm.patchValue({ area_id: String(this.selectedArea.id) });
        }
      }
    });
  }

  loadAlerts(): void {
    this.alertsService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.filteredAlerts = alerts;
        this.renderAlerts();
      }
    });
  }

  loadPrediction(): void {
    this.predictionService.getStatus().subscribe({
      next: (status) => {
        this.predictionEnabled = status.is_enabled;
      }
    });
  }

  togglePrediction(): void {
    this.predictionLoading = true;
    this.predictionService.toggleStatus(!this.predictionEnabled).subscribe({
      next: (status) => {
        this.predictionEnabled = status.is_enabled;
        this.predictionLoading = false;
      },
      error: () => {
        this.predictionLoading = false;
      }
    });
  }

  onAreaChange(areaId: string): void {
    const selected = this.areas.find((area) => area.id === Number(areaId)) || null;
    this.selectedArea = selected;
    if (selected) {
      this.focusArea(selected);
    }
  }

  detectLocation(): void {
    if (!navigator.geolocation) {
      this.alertStatusKey = 'alerts.status.geoUnsupported';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.alertForm.patchValue({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        this.focusLatLng(position.coords.latitude, position.coords.longitude);
      },
      () => {
        this.alertStatusKey = 'alerts.status.geoFailed';
      }
    );
  }

   public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submitAlert(): void {
    if (this.alertForm.invalid || !this.selectedFile) {
      this.alertStatusKey = 'alerts.status.missingData';
      this.alertForm.markAllAsTouched();
      return;
    }

    const latitudeValue = Number(this.alertForm.value.latitude);
    const longitudeValue = Number(this.alertForm.value.longitude);

    this.alertLoading = true;
    this.alertStatusKey = '';

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('latitude', String(this.alertForm.value.latitude ?? ''));
    formData.append('longitude', String(this.alertForm.value.longitude ?? ''));
    formData.append(
      'description',
      String(this.alertForm.value.description || this.i18n.translate('alerts.defaultDescription.admin'))
    );
    if (this.alertForm.value.area_id) {
      formData.append('area_id', String(this.alertForm.value.area_id));
    }

    this.alertsService.createAlert(formData).subscribe({
      next: () => {
        this.alertLoading = false;
        this.alertStatusKey = 'alerts.status.success';
        this.alertForm.patchValue({ description: '' });
        this.selectedFile = null;
        if (Number.isFinite(latitudeValue) && Number.isFinite(longitudeValue)) {
          this.focusLatLng(latitudeValue, longitudeValue);
        }
        this.loadAlerts();
        this.loadAreas();
      },
      error: () => {
        this.alertLoading = false;
        this.alertStatusKey = 'alerts.status.failed';
      }
    });
  }

  startEdit(area: Area): void {
    this.editingAreaId = area.id;
    this.areaForm.patchValue({
      name: area.name,
      risk_level: area.risk_level,
      coordinates: JSON.stringify(area.coordinates, null, 2),
      temperature: area.weather.temperature !== null ? String(area.weather.temperature) : '',
      humidity: area.weather.humidity !== null ? String(area.weather.humidity) : '',
      wind_speed: area.weather.wind_speed !== null ? String(area.weather.wind_speed) : ''
    });
  }

  cancelEdit(): void {
    this.editingAreaId = null;
    this.areaForm.reset({
      name: '',
      risk_level: 'low',
      coordinates: ''
    });
    this.statusMessageKey = '';
  }

  saveArea(): void {
    if (this.areaForm.invalid) {
      this.areaForm.markAllAsTouched();
      return;
    }

    const coords = this.parseCoordinates(this.areaForm.value.coordinates ?? '');
    if (!coords) {
      this.statusMessageKey = 'admin.areaForm.status.invalidCoordinates';
      return;
    }

    const payload = {
      name: this.areaForm.value.name ?? '',
      risk_level: this.areaForm.value.risk_level ?? 'low',
      coordinates: coords,
      temperature: this.toNumberOrNull(this.areaForm.value.temperature),
      humidity: this.toNumberOrNull(this.areaForm.value.humidity),
      wind_speed: this.toNumberOrNull(this.areaForm.value.wind_speed)
    };

    const request = this.editingAreaId
      ? this.areasService.updateArea(this.editingAreaId, payload)
      : this.areasService.createArea(payload);

    request.subscribe({
      next: () => {
        this.statusMessageKey = this.editingAreaId
          ? 'admin.areaForm.status.updated'
          : 'admin.areaForm.status.created';
        this.cancelEdit();
        this.loadAreas();
      },
      error: () => {
        this.statusMessageKey = 'admin.areaForm.status.failed';
      }
    });
  }

  deleteArea(area: Area): void {
    this.areasService.deleteArea(area.id).subscribe({
      next: () => {
        this.loadAreas();
      }
    });
  }

  applyAlertFilters(): void {
    const { search, source, area_id, time } = this.filterForm.value;

    this.filteredAlerts = this.alerts.filter((alert) => {
      const matchesSearch = !search || (alert.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesSource = !source || alert.source === source;
      const matchesArea = !area_id || alert.area?.id === Number(area_id);
      const matchesTime = this.matchesTimeFilter(alert.created_at, time ?? 'all');

      return matchesSearch && matchesSource && matchesArea && matchesTime;
    });
  }

  riskClass(level?: string): string {
    return `risk ${level ?? 'neutral'}`;
  }

  private focusArea(area: Area): void {
    if (!this.map) {
      return;
    }

    const layer = this.areaLayers.get(area.id);
    if (layer?.getBounds) {
      this.map.flyToBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 12 });
    } else if (layer?.getLatLng) {
      this.map.flyTo(layer.getLatLng(), 12);
    }

    if (layer?.openPopup) {
      layer.openPopup();
    }
  }

  private focusLatLng(lat: number, lng: number): void {
    if (!this.map || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    this.map.flyTo([lat, lng], 12);
  }

  private renderAreas(fitToBounds = false): void {
    if (!this.map || !this.areaLayerGroup) {
      return;
    }

    this.areaLayerGroup.clearLayers();
    this.areaLayers.clear();

    const bounds = L.latLngBounds([]);

    this.areas.forEach((area) => {
      const coords = (area.coordinates || [])
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
        .map((point) => [point.lat, point.lng]);

      if (coords.length === 0) {
        return;
      }

      coords.forEach((point) => bounds.extend(point));
      const color = this.riskColor(area.risk_level);
      const layer = coords.length >= 3
        ? L.polygon(coords, { color, weight: 2, fillColor: color, fillOpacity: 0.2 })
        : L.marker(coords[0], { title: area.name });

      layer.bindPopup(this.buildAreaPopup(area));
      layer.on('click', () => {
        this.selectedArea = area;
      });
      layer.addTo(this.areaLayerGroup);
      this.areaLayers.set(area.id, layer);
    });

    if (fitToBounds && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  private renderAlerts(): void {
    if (!this.map || !this.alertLayerGroup) {
      return;
    }

    this.alertLayerGroup.clearLayers();

    this.alerts.forEach((alert) => {
      const lat = Number(alert.latitude);
      const lng = Number(alert.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#d94545',
        weight: 2,
        fillColor: '#d94545',
        fillOpacity: 0.6
      });

      marker.bindPopup(this.buildAlertPopup(alert));
      marker.addTo(this.alertLayerGroup);
    });
  }

  private buildAreaPopup(area: Area): string {
    const riskLabel = area.risk_level ? this.i18n.translate(`risk.${area.risk_level}`) : this.i18n.translate('common.na');
    const areaName = this.escapeHtml(area.name);
    return `<strong>${areaName}</strong><br>${this.i18n.translate('common.riskLevel')}: ${riskLabel}`;
  }

  private buildAlertPopup(alert: Alert): string {
    const sourceLabel = alert.source ? this.i18n.translate(`source.${alert.source}`) : this.i18n.translate('common.na');
    const description = this.escapeHtml(alert.description || this.i18n.translate('alerts.noDescription'));
    const timeLabel = alert.created_at ? new Date(alert.created_at).toLocaleString() : this.i18n.translate('common.na');
    const imageHtml = alert.image_url
      ? `<img src="${this.escapeHtml(alert.image_url)}" alt="${this.escapeHtml(this.i18n.translate('maps.alertPopup.photoAlt'))}" style="width: 180px; max-width: 100%; border-radius: 8px; margin-top: 6px; display: block;">`
      : '';
    return `
      <strong>${this.i18n.translate('maps.alertPopup.title')}</strong><br>
      ${this.i18n.translate('maps.alertPopup.source')}: ${sourceLabel}<br>
      ${this.i18n.translate('maps.alertPopup.description')}: ${description}<br>
      ${this.i18n.translate('maps.alertPopup.time')}: ${timeLabel}
      ${imageHtml ? `<br>${imageHtml}` : ''}
    `;
  }

  private riskColor(level?: string): string {
    if (level === 'low') {
      return '#39b75b';
    }
    if (level === 'medium') {
      return '#f5a623';
    }
    if (level === 'high') {
      return '#d94545';
    }
    return '#9aa7a1';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private parseCoordinates(text: string): AreaCoordinate[] | null {
    try {
      const parsed = JSON.parse(text) as AreaCoordinate[];
      if (!Array.isArray(parsed) || parsed.length < 3) {
        return null;
      }

      const valid = parsed.every((point) => typeof point.lat === 'number' && typeof point.lng === 'number');
      return valid ? parsed : null;
    } catch {
      return null;
    }
  }

  private matchesTimeFilter(value: string | undefined, filter: string): boolean {
    if (!value || filter === 'all') {
      return true;
    }

    const date = new Date(value);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (filter === '24h') {
      return diffHours <= 24;
    }

    if (filter === '7d') {
      return diffHours <= 168;
    }

    return true;
  }

  private toNumberOrNull(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

}
