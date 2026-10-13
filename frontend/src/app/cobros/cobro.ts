import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { PagoService } from '../core/pago.service';
import { Comprobante, MetodoPago, VistaPrevia } from '../core/models';

@Component({
  selector: 'app-cobro',
  imports: [ReactiveFormsModule],
  templateUrl: './cobro.html',
  styleUrl: './cobro.css',
})
export class Cobro {
  vista = signal<VistaPrevia | null>(null);
  comprobante = signal<Comprobante | null>(null);
  error = signal<string | null>(null);
  exonerado = signal(false);
  motivo = signal('');
  form: FormGroup;
  private socioId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private ruta: ActivatedRoute,
    private servicio: PagoService,
  ) {
    const hoy = new Date();
    const periodoInicial = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    this.form = this.fb.group({
      periodo: [periodoInicial, [Validators.required, Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)]],
      metodo: ['EFECTIVO' as MetodoPago, Validators.required],
    });
    const id = Number(this.ruta.snapshot.paramMap.get('socioId'));
    this.socioId = Number.isInteger(id) ? id : null;
  }

  calcular(): void {
    if (this.form.invalid || this.socioId === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.comprobante.set(null);
    this.servicio.vistaPrevia(this.socioId, this.form.value.periodo).subscribe({
      next: (v) => this.vista.set(v),
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e)),
    });
  }

  alternarExoneracion(marcada: boolean): void {
    this.exonerado.set(marcada);
  }

  totalMostrado(): number | null {
    const v = this.vista();
    if (!v) {
      return null;
    }
    return this.exonerado() ? v.cuota : v.total;
  }

  puedePagar(): boolean {
    if (!this.vista()) {
      return false;
    }
    return !this.exonerado() || this.motivo().trim().length > 0;
  }

  pagar(): void {
    if (!this.puedePagar() || this.socioId === null) {
      return;
    }
    this.error.set(null);
    this.servicio
      .registrar({
        socioId: this.socioId,
        periodo: this.form.value.periodo,
        metodo: this.form.value.metodo,
        exonerado: this.exonerado(),
        motivo: this.exonerado() ? this.motivo().trim() : null,
      })
      .subscribe({
        next: (c) => {
          this.comprobante.set(c);
          this.vista.set(null);
        },
        error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e)),
      });
  }

  private mensajeError(e: HttpErrorResponse): string {
    if (e.status === 409) {
      return 'El período ya está pagado: vea el comprobante existente';
    }
    return 'No se pudo procesar el cobro';
  }
}
