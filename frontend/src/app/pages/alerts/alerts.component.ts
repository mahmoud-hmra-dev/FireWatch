import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AlertsService } from '../../core/alerts.service';
import { Alert } from '../../core/models';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];

  filterForm = this.fb.group({
    area_id: [''],
    risk: [''],
    time: ['all']
  });

  constructor(private fb: FormBuilder, private alertsService: AlertsService) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  loadAlerts(): void {
    this.alertsService.getAllAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts.filter((alert) => alert.source === 'auto');
        this.filteredAlerts = this.alerts;
      }
    });
  }

  applyFilters(): void {
    const { area_id, risk, time } = this.filterForm.value;

    this.filteredAlerts = this.alerts.filter((alert) => {
      const matchesArea = !area_id || alert.area?.id === Number(area_id);
      const matchesRisk = !risk || alert.area?.risk_level === risk;
      const matchesTime = this.matchesTimeFilter(alert.created_at, time ?? 'all');
      return matchesArea && matchesRisk && matchesTime;
    });
  }

  private matchesTimeFilter(value: string | undefined, filter: string): boolean {
    if (!value || filter === 'all') {
      return true;
    }

    const date = new Date(value);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (filter === '24h') {
      return diffHours <= 24;
    }

    if (filter === '7d') {
      return diffHours <= 168;
    }

    return true;
  }
}
