import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegionService } from '../../core/region.service';
import { FireReportService } from '../../core/fire-report.service';
import { Region } from '../../core/models';

declare const L: any;

@Component({
  selector: 'app-fire-report-form',
  templateUrl: './fire-report-form.component.html',
  styleUrls: ['./fire-report-form.component.css']
})
export class FireReportFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas') mapElement?: ElementRef<HTMLDivElement>;
  regions: Region[] = [];
  reportForm: FormGroup;
  statusKey = '';
  submitting = false;
  selectedFile?: File;
  private map: any;
  private marker: any;

  constructor(
    private formBuilder: FormBuilder,
    private regionService: RegionService,
    private fireReportService: FireReportService
  ) {
    this.reportForm = this.formBuilder.group({
      region_id: ['', Validators.required],
      lat: ['', Validators.required],
      lng: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.regionService.listRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.mapElement?.nativeElement || typeof L === 'undefined') {
      return;
    }

    this.map = L.map(this.mapElement.nativeElement, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.map.setView([39.5, -98.35], 4);

    this.map.on('click', (event: any) => {
      const { lat, lng } = event.latlng;
      this.updateLocation(lat, lng);
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  detectLocation(): void {
    if (!navigator.geolocation) {
      this.statusKey = 'reports.locationUnavailable';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.updateLocation(latitude, longitude);
      },
      () => {
        this.statusKey = 'reports.locationError';
      }
    );
  }

  submitReport(): void {
    if (this.reportForm.invalid || !this.selectedFile) {
      this.statusKey = 'reports.missingFields';
      return;
    }

    this.submitting = true;
    this.statusKey = '';

    this.fireReportService
      .submitReport({
        region_id: Number(this.reportForm.value.region_id),
        lat: Number(this.reportForm.value.lat),
        lng: Number(this.reportForm.value.lng),
        image: this.selectedFile
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.statusKey = 'reports.submitted';
          this.reportForm.reset();
          this.selectedFile = undefined;
        },
        error: () => {
          this.submitting = false;
          this.statusKey = 'reports.submitError';
        }
      });
  }

  private updateLocation(lat: number, lng: number): void {
    this.reportForm.patchValue({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    });

    if (!this.map) {
      return;
    }

    if (!this.marker) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    } else {
      this.marker.setLatLng([lat, lng]);
    }

    this.map.flyTo([lat, lng], 12);
  }
}
