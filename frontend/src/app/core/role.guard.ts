import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const roles = route.data['roles'] as string[] | undefined;
    if (!roles || roles.length === 0) {
      return true;
    }

    const user = this.auth.user;
    if (user && roles.includes(user.role)) {
      return true;
    }

    return this.router.parseUrl('/');
  }
}
