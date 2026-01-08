import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AreasService } from '../../core/areas.service';
import { AlertsService } from '../../core/alerts.service';
import { Alert, Area } from '../../core/models';
import { I18nService } from '../../core/i18n.service';

declare const L: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') mapElement?: ElementRef<HTMLDivElement>;
  areas: Area[] = [];
  alerts: Alert[] = [];
  manualAlerts: Alert[] = [];
  selectedAreaId: number | null = null;
  private map: any;
  private areaLayerGroup: any;
  private areaLayers = new Map<number, any>();
  private alertLayerGroup: any;
  private langSubscription?: Subscription;

  constructor(
    private areasService: AreasService,
    private alertsService: AlertsService,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.langSubscription = this.i18n.lang$.subscribe(() => {
      this.renderAreas();
      this.renderAlerts();
    });

    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.selectedAreaId = areas[0]?.id ?? null;
        this.renderAreas();
      }
    });

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
    this.renderAreas();
    this.renderAlerts();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  focusArea(area: Area): void {
    if (!this.map) {
      return;
    }

    this.selectedAreaId = area.id;
    const layer = this.areaLayers.get(area.id);
    if (layer?.getBounds) {
      this.map.flyToBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 12 });
    } else if (layer?.getLatLng) {
      this.map.flyTo(layer.getLatLng(), 12);
    }

    if (layer?.openPopup) {
      layer.openPopup();
    }

    this.mapElement?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  selectArea(area: Area): void {
    this.selectedAreaId = area.id;
  }

  riskClass(level: string): string {
    return `risk ${level}`;
  }

  private loadAlerts(): void {
    this.alertsService
      .getAllAlerts()
      .pipe(
        catchError(() => this.alertsService.getUserAlerts()),
        catchError(() => of([]))
      )
      .subscribe((alerts) => {
        this.alerts = alerts;
        this.manualAlerts = alerts
          .filter((alert) => alert.source === 'manual')
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        this.renderAlerts();
      });
  }

  private renderAreas(): void {
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

      layer.bindPopup(this.buildPopup(area));
      layer.on('click', () => this.selectArea(area));
      layer.addTo(this.areaLayerGroup);
      this.areaLayers.set(area.id, layer);
    });

    if (bounds.isValid()) {
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

  private buildPopup(area: Area): string {
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
}
