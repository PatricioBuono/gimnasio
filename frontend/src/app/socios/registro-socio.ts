import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { SocioService } from '../core/socio.service';
import { Socio } from '../core/models';

@Component({
  selector: 'app-registro-socio',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro-socio.html',
  styleUrl: './registro-socio.css',
})
export class RegistroSocio {
  creado = signal<Socio | null>(null);
  error = signal<string | null>(null);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private servicio: SocioService,
  ) {
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^[0-9. ]+$/)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.creado.set(null);
    this.servicio.alta(this.form.value).subscribe({
      next: (s) => {
        this.creado.set(s);
        this.form.reset();
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e)),
    });
  }

  private mensajeError(e: HttpErrorResponse): string {
    if (e.status === 409) {
      return 'El DNI ya está registrado: busque el perfil existente';
    }
    if (e.status === 400) {
      return 'Datos incompletos o DNI con formato inválido';
    }
    return 'No se pudo registrar el socio';
  }
}
