import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PrecioService } from '../core/precio.service';

@Component({
  selector: 'app-precios',
  imports: [ReactiveFormsModule],
  templateUrl: './precios.html',
  styleUrl: './precios.css',
})
export class Precios {
  cuotaActual = signal<number | null>(null);
  recargoActual = signal<number | null>(null);
  errorCuota = signal<string | null>(null);
  errorRecargo = signal<string | null>(null);
  exito = signal<string | null>(null);
  formCuota: FormGroup;
  formRecargo: FormGroup;

  constructor(
    private fb: FormBuilder,
    private servicio: PrecioService,
  ) {
    this.formCuota = this.fb.group({ valor: [null, [Validators.required, Validators.min(0.01)]] });
    this.formRecargo = this.fb.group({ valor: [null, [Validators.required, Validators.min(0)]] });
    this.cargar();
  }

  cargar(): void {
    this.servicio.listar().subscribe({
      next: (precios) => {
        this.cuotaActual.set(precios.find((p) => p.clave === 'CUOTA')?.valor ?? null);
        this.recargoActual.set(precios.find((p) => p.clave === 'RECARGO_SEMANAL')?.valor ?? null);
      },
    });
  }

  guardarCuota(): void {
    if (this.formCuota.invalid) {
      this.formCuota.markAllAsTouched();
      return;
    }
    this.errorCuota.set(null);
    this.exito.set(null);
    this.servicio.actualizarCuota(Number(this.formCuota.value.valor)).subscribe({
      next: (p) => {
        this.cuotaActual.set(p.valor);
        this.exito.set('Cuota actualizada');
      },
      error: (e: HttpErrorResponse) => this.errorCuota.set(this.mensajeError(e)),
    });
  }

  guardarRecargo(): void {
    if (this.formRecargo.invalid) {
      this.formRecargo.markAllAsTouched();
      return;
    }
    this.errorRecargo.set(null);
    this.exito.set(null);
    this.servicio.actualizarRecargo(Number(this.formRecargo.value.valor)).subscribe({
      next: (p) => {
        this.recargoActual.set(p.valor);
        this.exito.set('Recargo actualizado');
      },
      error: (e: HttpErrorResponse) => this.errorRecargo.set(this.mensajeError(e)),
    });
  }

  private mensajeError(e: HttpErrorResponse): string {
    if (e.status === 400) {
      return 'Monto inválido según la regla del negocio';
    }
    return 'No se pudo guardar el valor';
  }
}
