import { Component, OnInit } from '@angular/core';
import { FireReportService } from '../../core/fire-report.service';
import { FireReport } from '../../core/models';

@Component({
  selector: 'app-admin-fire-reports',
  templateUrl: './admin-fire-reports.component.html',
  styleUrls: ['./admin-fire-reports.component.css']
})
export class AdminFireReportsComponent implements OnInit {
  reports: FireReport[] = [];
  errorKey = '';

  constructor(private fireReportService: FireReportService) {}

  ngOnInit(): void {
    this.fireReportService.listAdminReports().subscribe({
      next: (reports) => {
        this.reports = reports;
      },
      error: () => {
        this.errorKey = 'adminFire.reportsError';
      }
    });
  }
}
