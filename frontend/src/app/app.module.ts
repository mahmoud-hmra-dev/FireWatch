import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { MapsComponent } from './pages/maps/maps.component';
import { DataAnalysisComponent } from './pages/data-analysis/data-analysis.component';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { RegionsComponent } from './pages/regions/regions.component';
import { RegionDetailComponent } from './pages/region-detail/region-detail.component';
import { FireReportFormComponent } from './pages/fire-report-form/fire-report-form.component';
import { MyFireReportsComponent } from './pages/my-fire-reports/my-fire-reports.component';
import { AdminFireDashboardComponent } from './pages/admin-fire-dashboard/admin-fire-dashboard.component';
import { AdminRegionsComponent } from './pages/admin-regions/admin-regions.component';
import { AdminFireRiskHistoryComponent } from './pages/admin-fire-risk-history/admin-fire-risk-history.component';
import { AdminFireReportsComponent } from './pages/admin-fire-reports/admin-fire-reports.component';
import { AuthInterceptor } from './core/auth.interceptor';
import { TranslatePipe } from './core/translate.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    UserDashboardComponent,
    AdminDashboardComponent,
    MapsComponent,
    DataAnalysisComponent,
    AlertsComponent,
    RegionsComponent,
    RegionDetailComponent,
    FireReportFormComponent,
    MyFireReportsComponent,
    AdminFireDashboardComponent,
    AdminRegionsComponent,
    AdminFireRiskHistoryComponent,
    AdminFireReportsComponent,
    TranslatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
