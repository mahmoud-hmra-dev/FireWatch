import { Component, OnInit } from '@angular/core';
import { FireRiskService } from '../../core/fire-risk.service';
import { DashboardOverview } from '../../core/models';

interface StatusBar {
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-admin-fire-dashboard',
  templateUrl: './admin-fire-dashboard.component.html',
  styleUrls: ['./admin-fire-dashboard.component.css']
})
export class AdminFireDashboardComponent implements OnInit {
  overview?: DashboardOverview;
  statusBars: StatusBar[] = [];
  errorKey = '';

  constructor(private fireRiskService: FireRiskService) {}

  ngOnInit(): void {
    this.fireRiskService.getAdminOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.buildStatusBars();
      },
      error: () => {
        this.errorKey = 'adminFire.overviewError';
      }
    });
  }

  private buildStatusBars(): void {
    if (!this.overview) {
      return;
    }

    const total = this.overview.fire_reports.total || 1;
    this.statusBars = Object.entries(this.overview.fire_reports.by_status || {}).map(([label, value]) => ({
      label,
      value,
      percent: Math.round((value / total) * 100)
    }));
  }
}
