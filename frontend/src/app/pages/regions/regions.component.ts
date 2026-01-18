import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FireRiskService } from '../../core/fire-risk.service';
import { RegionService } from '../../core/region.service';
import { FireRiskPrediction, Region } from '../../core/models';

@Component({
  selector: 'app-regions',
  templateUrl: './regions.component.html',
  styleUrls: ['./regions.component.css']
})
export class RegionsComponent implements OnInit {
  regions: Region[] = [];
  predictionMap = new Map<number, FireRiskPrediction | null>();
  loading = true;
  errorKey = '';

  constructor(
    private regionService: RegionService,
    private fireRiskService: FireRiskService
  ) {}

  ngOnInit(): void {
    this.regionService.listRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.loading = false;
        this.loadPredictions();
      },
      error: () => {
        this.loading = false;
        this.errorKey = 'regions.error';
      }
    });
  }

  loadPredictions(): void {
    this.regions.forEach((region) => {
      this.fireRiskService
        .getLatest(region.id)
        .pipe(catchError(() => of(null)))
        .subscribe((prediction) => {
          this.predictionMap.set(region.id, prediction);
        });
    });
  }

  riskClass(level?: string): string {
    if (!level || level === 'unknown') {
      return 'risk neutral';
    }
    return `risk ${level}`;
  }

  riskLabel(regionId: number): string {
    const prediction = this.predictionMap.get(regionId);
    return prediction?.risk_level ?? 'unknown';
  }
}
