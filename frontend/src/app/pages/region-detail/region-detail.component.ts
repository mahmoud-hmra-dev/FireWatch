import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FireRiskService } from '../../core/fire-risk.service';
import { RegionService } from '../../core/region.service';
import { FireRiskPrediction, Region } from '../../core/models';

@Component({
  selector: 'app-region-detail',
  templateUrl: './region-detail.component.html',
  styleUrls: ['./region-detail.component.css']
})
export class RegionDetailComponent implements OnInit {
  region?: Region;
  prediction?: FireRiskPrediction;
  loading = true;
  errorKey = '';
  predictionForm: FormGroup;
  refreshing = false;

  constructor(
    private route: ActivatedRoute,
    private regionService: RegionService,
    private fireRiskService: FireRiskService,
    private formBuilder: FormBuilder
  ) {
    this.predictionForm = this.formBuilder.group({
      temperature: [null],
      humidity: [null],
      wind_speed: [null],
      rainfall: [null],
      vegetation_index: [null]
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.errorKey = 'regions.notFound';
      this.loading = false;
      return;
    }

    this.regionService.listRegions(true).subscribe({
      next: (regions) => {
        this.region = regions.find((item) => item.id === id);
        if (!this.region) {
          this.errorKey = 'regions.notFound';
          this.loading = false;
          return;
        }
        this.loadPrediction();
      },
      error: () => {
        this.errorKey = 'regions.error';
        this.loading = false;
      }
    });
  }

  loadPrediction(): void {
    if (!this.region) {
      return;
    }

    this.fireRiskService.getLatest(this.region.id).subscribe({
      next: (prediction) => {
        this.prediction = prediction;
        this.loading = false;
      },
      error: () => {
        this.prediction = undefined;
        this.loading = false;
      }
    });
  }

  generatePrediction(): void {
    if (!this.region) {
      return;
    }

    this.refreshing = true;
    this.fireRiskService.getLatest(this.region.id, true, this.predictionForm.value).subscribe({
      next: (prediction) => {
        this.prediction = prediction;
        this.refreshing = false;
      },
      error: () => {
        this.refreshing = false;
        this.errorKey = 'regions.predictionError';
      }
    });
  }

  riskClass(level?: string): string {
    if (!level) {
      return 'risk neutral';
    }
    return `risk ${level}`;
  }
}
