import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegionService } from '../../core/region.service';
import { Region } from '../../core/models';

@Component({
  selector: 'app-admin-regions',
  templateUrl: './admin-regions.component.html',
  styleUrls: ['./admin-regions.component.css']
})
export class AdminRegionsComponent implements OnInit {
  regions: Region[] = [];
  regionForm: FormGroup;
  editingId: number | null = null;
  statusKey = '';

  constructor(
    private formBuilder: FormBuilder,
    private regionService: RegionService
  ) {
    this.regionForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions(): void {
    this.regionService.listAdminRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
      }
    });
  }

  saveRegion(): void {
    if (this.regionForm.invalid) {
      this.statusKey = 'adminRegions.missingFields';
      return;
    }

    const payload = {
      name: this.regionForm.value.name,
      type: this.regionForm.value.type,
      latitude: Number(this.regionForm.value.latitude),
      longitude: Number(this.regionForm.value.longitude),
      is_active: Boolean(this.regionForm.value.is_active)
    };

    const request = this.editingId
      ? this.regionService.updateRegion(this.editingId, payload)
      : this.regionService.createRegion(payload);

    request.subscribe({
      next: () => {
        this.statusKey = this.editingId ? 'adminRegions.updated' : 'adminRegions.created';
        this.regionForm.reset({ is_active: true });
        this.editingId = null;
        this.loadRegions();
      },
      error: () => {
        this.statusKey = 'adminRegions.saveError';
      }
    });
  }

  editRegion(region: Region): void {
    this.editingId = region.id;
    this.regionForm.patchValue({
      name: region.name,
      type: region.type,
      latitude: region.latitude,
      longitude: region.longitude,
      is_active: region.is_active
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.regionForm.reset({ is_active: true });
  }

  deleteRegion(region: Region): void {
    this.regionService.deleteRegion(region.id).subscribe({
      next: () => {
        this.statusKey = 'adminRegions.deleted';
        this.loadRegions();
      },
      error: () => {
        this.statusKey = 'adminRegions.deleteError';
      }
    });
  }
}
