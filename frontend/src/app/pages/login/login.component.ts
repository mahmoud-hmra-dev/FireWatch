import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  roleHint = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const role = params.get('role');
      this.roleHint = role === 'admin' ? 'Admin access only.' : role === 'user' ? 'User access only.' : '';
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.loading = true;

    this.auth
      .login({
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
        device_name: 'web'
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          const role = response.user.role;
          this.router.navigate([role === 'admin' ? '/admin' : '/dashboard']);
        },
        error: () => {
          this.loading = false;
          this.error = 'Login failed. Check your credentials.';
        }
      });
  }
}
