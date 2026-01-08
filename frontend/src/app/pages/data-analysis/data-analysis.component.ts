import { Component, OnInit } from '@angular/core';
import { AreasService } from '../../core/areas.service';
import { Area } from '../../core/models';

@Component({
  selector: 'app-data-analysis',
  templateUrl: './data-analysis.component.html',
  styleUrls: ['./data-analysis.component.css']
})
export class DataAnalysisComponent implements OnInit {
  areas: Area[] = [];

  constructor(private areasService: AreasService) {}

  ngOnInit(): void {
    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
      }
    });
  }

  riskClass(level: string): string {
    return `risk ${level}`;
  }
}
