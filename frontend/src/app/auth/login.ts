import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  error = signal<string | null>(null);
  cargando = signal(false);
  mostrarPassword = signal(false);
  form: FormGroup;

  @ViewChild('usuarioInput') usuarioInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    setTimeout(() => this.usuarioInput?.nativeElement.focus(), 0);
  }

  get usuarioInvalido(): boolean {
    const c = this.form.get('username');
    return !!c && c.invalid && c.touched;
  }

  get passwordInvalido(): boolean {
    const c = this.form.get('password');
    return !!c && c.invalid && c.touched;
  }

  toggleMostrar(): void {
    this.mostrarPassword.update((v) => !v);
  }

  ingresar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    const { username, password } = this.form.value;
    this.auth.login(username, password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        if (e.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Intente nuevamente.');
          return;
        }
        this.error.set('Usuario o contraseña inválidos');
      },
    });
  }
}
