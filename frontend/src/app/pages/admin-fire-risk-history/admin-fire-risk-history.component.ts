import { Component, OnInit } from '@angular/core';
import { FireRiskService } from '../../core/fire-risk.service';
import { RegionService } from '../../core/region.service';
import { FireRiskPrediction, Region } from '../../core/models';

@Component({
  selector: 'app-admin-fire-risk-history',
  templateUrl: './admin-fire-risk-history.component.html',
  styleUrls: ['./admin-fire-risk-history.component.css']
})
export class AdminFireRiskHistoryComponent implements OnInit {
  regions: Region[] = [];
  predictions: FireRiskPrediction[] = [];
  selectedRegionId?: number;
  statusKey = '';

  constructor(
    private regionService: RegionService,
    private fireRiskService: FireRiskService
  ) {}

  ngOnInit(): void {
    this.regionService.listAdminRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.selectedRegionId = regions[0]?.id;
        if (this.selectedRegionId) {
          this.loadHistory(this.selectedRegionId);
        }
      }
    });
  }

  loadHistory(regionId: number): void {
    this.fireRiskService.getHistory(regionId).subscribe({
      next: (predictions) => {
        this.predictions = predictions;
      },
      error: () => {
        this.statusKey = 'adminFire.historyError';
      }
    });
  }

  onRegionChange(value: string): void {
    const regionId = Number(value);
    if (!Number.isFinite(regionId)) {
      return;
    }
    this.selectedRegionId = regionId;
    this.loadHistory(regionId);
  }
}
