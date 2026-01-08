import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AlertsService } from '../../core/alerts.service';
import { AreasService } from '../../core/areas.service';
import { PredictionService } from '../../core/prediction.service';
import { Alert, Area, AreaCoordinate } from '../../core/models';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  areas: Area[] = [];
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  predictionEnabled = false;
  predictionLoading = false;
  statusMessageKey = '';
  selectedArea: Area | null = null;
  mapUrl: SafeResourceUrl;
  alertStatusKey = '';
  alertLoading = false;
  selectedFile: File | null = null;

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
    private sanitizer: DomSanitizer,
    private i18n: I18nService
  ) {
    this.mapUrl = this.buildMapUrl(39.5, -98.35);
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadAlerts();
    this.loadPrediction();

    this.filterForm.valueChanges.subscribe(() => this.applyAlertFilters());
  }

  loadAreas(): void {
    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.selectedArea = areas[0] ?? null;
        if (this.selectedArea?.coordinates[0]) {
          this.mapUrl = this.buildMapUrl(this.selectedArea.coordinates[0].lat, this.selectedArea.coordinates[0].lng);
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
    if (selected?.coordinates[0]) {
      this.mapUrl = this.buildMapUrl(selected.coordinates[0].lat, selected.coordinates[0].lng);
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
        this.mapUrl = this.buildMapUrl(position.coords.latitude, position.coords.longitude);
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
          this.mapUrl = this.buildMapUrl(latitudeValue, longitudeValue);
        }
        this.loadAlerts();
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

  private buildMapUrl(lat: number, lng: number): SafeResourceUrl {
    const delta = 0.2;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
