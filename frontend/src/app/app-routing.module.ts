import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { DataAnalysisComponent } from './pages/data-analysis/data-analysis.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MapsComponent } from './pages/maps/maps.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { RegionsComponent } from './pages/regions/regions.component';
import { RegionDetailComponent } from './pages/region-detail/region-detail.component';
import { FireReportFormComponent } from './pages/fire-report-form/fire-report-form.component';
import { MyFireReportsComponent } from './pages/my-fire-reports/my-fire-reports.component';
import { AdminFireDashboardComponent } from './pages/admin-fire-dashboard/admin-fire-dashboard.component';
import { AdminRegionsComponent } from './pages/admin-regions/admin-regions.component';
import { AdminFireRiskHistoryComponent } from './pages/admin-fire-risk-history/admin-fire-risk-history.component';
import { AdminFireReportsComponent } from './pages/admin-fire-reports/admin-fire-reports.component';
import { AuthGuard } from './core/auth.guard';
import { RoleGuard } from './core/role.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] }
  },
  {
    path: 'regions',
    component: RegionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] }
  },
  {
    path: 'regions/:id',
    component: RegionDetailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] }
  },
  {
    path: 'fire-reports/new',
    component: FireReportFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] }
  },
  {
    path: 'my-fire-reports',
    component: MyFireReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] }
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    pathMatch: 'full'
  },
  {
    path: 'admin/fire-dashboard',
    component: AdminFireDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/regions',
    component: AdminRegionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/fire-risk-history',
    component: AdminFireRiskHistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/fire-reports',
    component: AdminFireReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'maps',
    component: MapsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] }
  },
  {
    path: 'analysis',
    component: DataAnalysisComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'alerts',
    component: AlertsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
