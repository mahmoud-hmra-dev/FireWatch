import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertsService } from '../../core/alerts.service';
import { AreasService } from '../../core/areas.service';
import { Alert, Area } from '../../core/models';
import { I18nService } from '../../core/i18n.service';

declare const L: any;

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') mapElement?: ElementRef<HTMLDivElement>;
  areas: Area[] = [];
  selectedArea: Area | null = null;
  areasErrorKey = '';
  alertStatusKey = '';
  alertLoading = false;
  selectedFile: File | null = null;
  userAlerts: Alert[] = [];
  editingAlertId: number | null = null;
  editingAlertImageUrl: string | null = null;
  private map: any;
  private areaLayerGroup: any;
  private alertLayerGroup: any;
  private areaLayers = new Map<number, any>();
  private langSubscription?: Subscription;

  alertForm = this.fb.group({
    area_id: [''],
    description: [''],
    latitude: ['', Validators.required],
    longitude: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private alertsService: AlertsService,
    private areasService: AreasService,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.langSubscription = this.i18n.lang$.subscribe(() => {
      this.renderAreas();
      this.renderAlerts();
    });
    this.loadAreas();
    this.loadAlerts();
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
        }
      },
      error: () => {
        this.areasErrorKey = 'user.areasError';
      }
    });
  }

  loadAlerts(): void {
    this.alertsService.getUserAlerts().subscribe({
      next: (alerts) => {
        this.userAlerts = alerts
          .filter((alert) => alert.source === 'manual')
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        this.renderAlerts();
      }
    });
  }

  onAreaChange(areaId: string): void {
    const selected = this.areas.find((area) => area.id === Number(areaId)) || null;
    this.selectedArea = selected;
    if (selected) {
      this.updateMapFromArea(selected);
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submitAlert(): void {
    const isEditing = this.editingAlertId !== null;
    if (this.alertForm.invalid || (!this.selectedFile && !isEditing)) {
      this.alertStatusKey = 'alerts.status.missingData';
      this.alertForm.markAllAsTouched();
      return;
    }

    const latitudeValue = Number(this.alertForm.value.latitude);
    const longitudeValue = Number(this.alertForm.value.longitude);

    this.alertLoading = true;
    this.alertStatusKey = '';

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    formData.append('latitude', String(this.alertForm.value.latitude ?? ''));
    formData.append('longitude', String(this.alertForm.value.longitude ?? ''));
    const descriptionValue = this.alertForm.value.description;
    if (descriptionValue) {
      formData.append('description', String(descriptionValue));
    } else if (isEditing) {
      formData.append('description', '');
    } else {
      formData.append('description', this.i18n.translate('alerts.defaultDescription.user'));
    }
    if (this.alertForm.value.area_id) {
      formData.append('area_id', String(this.alertForm.value.area_id));
    }

    const request = isEditing && this.editingAlertId !== null
      ? this.alertsService.updateAlert(this.editingAlertId, formData)
      : this.alertsService.createAlert(formData);

    request.subscribe({
      next: () => {
        this.alertLoading = false;
        this.alertStatusKey = isEditing ? 'alerts.status.updated' : 'alerts.status.success';
        this.resetAlertForm();
        this.selectedFile = null;
        this.editingAlertId = null;
        this.editingAlertImageUrl = null;
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

  startEdit(alert: Alert): void {
    this.editingAlertId = alert.id;
    this.editingAlertImageUrl = alert.image_url ?? null;
    this.selectedFile = null;
    this.alertStatusKey = '';
    this.alertForm.patchValue({
      area_id: alert.area?.id ? String(alert.area.id) : '',
      description: alert.description ?? '',
      latitude: String(alert.latitude ?? ''),
      longitude: String(alert.longitude ?? '')
    });

    const lat = Number(alert.latitude);
    const lng = Number(alert.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.focusLatLng(lat, lng);
    }
  }

  cancelEdit(): void {
    this.editingAlertId = null;
    this.editingAlertImageUrl = null;
    this.selectedFile = null;
    this.resetAlertForm();
  }

  deleteAlert(alert: Alert): void {
    const confirmed = window.confirm(this.i18n.translate('alerts.confirmDelete'));
    if (!confirmed) {
      return;
    }

    this.alertsService.deleteAlert(alert.id).subscribe({
      next: () => {
        this.alertStatusKey = 'alerts.status.deleted';
        if (this.editingAlertId === alert.id) {
          this.cancelEdit();
        }
        this.loadAlerts();
      },
      error: () => {
        this.alertStatusKey = 'alerts.status.failed';
      }
    });
  }

  riskClass(level?: string): string {
    if (!level) {
      return 'risk neutral';
    }

    return `risk ${level}`;
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

    this.userAlerts.forEach((alert) => {
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

  private updateMapFromArea(area: Area): void {
    this.focusArea(area);
  }

  private resetAlertForm(): void {
    this.alertForm.reset({
      area_id: '',
      description: '',
      latitude: '',
      longitude: ''
    });
  }
}
