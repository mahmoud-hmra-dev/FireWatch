import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AreasService } from '../../core/areas.service';
import { Area } from '../../core/models';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {
  areas: Area[] = [];
  mapUrl: SafeResourceUrl;

  constructor(private areasService: AreasService, private sanitizer: DomSanitizer) {
    this.mapUrl = this.buildMapUrl(39.5, -98.35);
  }

  ngOnInit(): void {
    this.areasService.listAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        const point = areas[0]?.coordinates[0];
        if (point) {
          this.mapUrl = this.buildMapUrl(point.lat, point.lng);
        }
      }
    });
  }

  riskClass(level: string): string {
    return `risk ${level}`;
  }

  private buildMapUrl(lat: number, lng: number): SafeResourceUrl {
    const delta = 1.1;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
