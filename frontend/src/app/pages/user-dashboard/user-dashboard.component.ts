import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AlertsService } from '../../core/alerts.service';
import { AreasService } from '../../core/areas.service';
import { Alert, Area } from '../../core/models';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  areas: Area[] = [];
  selectedArea: Area | null = null;
  areasErrorKey = '';
  mapUrl: SafeResourceUrl;
  alertStatusKey = '';
  alertLoading = false;
  selectedFile: File | null = null;
  recentAlerts: Alert[] = [];

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
    private sanitizer: DomSanitizer,
    private i18n: I18nService
  ) {
    this.mapUrl = this.buildMapUrl(37.7749, -122.4194);
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadAlerts();
  }

  loadAreas(): void {
    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.selectedArea = areas[0] ?? null;
        if (this.selectedArea) {
          this.alertForm.patchValue({ area_id: String(this.selectedArea.id) });
          this.updateMapFromArea(this.selectedArea);
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
        this.recentAlerts = alerts.slice(0, 5);
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
        this.mapUrl = this.buildMapUrl(position.coords.latitude, position.coords.longitude);
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
    if (this.alertForm.invalid || !this.selectedFile) {
      this.alertStatusKey = 'alerts.status.missingData';
      this.alertForm.markAllAsTouched();
      return;
    }

    this.alertLoading = true;
    this.alertStatusKey = '';

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('latitude', String(this.alertForm.value.latitude ?? ''));
    formData.append('longitude', String(this.alertForm.value.longitude ?? ''));
    formData.append(
      'description',
      String(this.alertForm.value.description || this.i18n.translate('alerts.defaultDescription.user'))
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
        this.loadAlerts();
      },
      error: () => {
        this.alertLoading = false;
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

  private updateMapFromArea(area: Area): void {
    const point = area.coordinates[0];
    if (point) {
      this.mapUrl = this.buildMapUrl(point.lat, point.lng);
    }
  }

  private buildMapUrl(lat: number, lng: number): SafeResourceUrl {
    const delta = 0.08;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
