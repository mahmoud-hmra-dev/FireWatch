import { Component, OnInit } from '@angular/core';
import { FireReportService } from '../../core/fire-report.service';
import { FireReport } from '../../core/models';

@Component({
  selector: 'app-my-fire-reports',
  templateUrl: './my-fire-reports.component.html',
  styleUrls: ['./my-fire-reports.component.css']
})
export class MyFireReportsComponent implements OnInit {
  reports: FireReport[] = [];
  loading = true;
  errorKey = '';

  constructor(private fireReportService: FireReportService) {}

  ngOnInit(): void {
    this.fireReportService.listMyReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorKey = 'reports.loadError';
      }
    });
  }
}
