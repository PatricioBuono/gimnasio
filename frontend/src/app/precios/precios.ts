import { Component, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PrecioService } from '../core/precio.service';
import { ConfirmarDialogo } from '../shared/confirmar-dialogo';

type Concepto = 'cuota' | 'recargo';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

@Component({
  selector: 'app-precios',
  imports: [ReactiveFormsModule, ConfirmarDialogo],
  templateUrl: './precios.html',
  styleUrl: './precios.css',
})
export class Precios {
  cuotaActual = signal<number | null>(null);
  recargoActual = signal<number | null>(null);
  cargando = signal(true);
  errorCarga = signal(false);
  errorCuota = signal<string | null>(null);
  errorRecargo = signal<string | null>(null);
  exito = signal<string | null>(null);
  guardando = signal<Concepto | null>(null);
  pendiente = signal<{ tipo: Concepto; valor: number } | null>(null);
  formCuota: FormGroup;
  formRecargo: FormGroup;

  @ViewChild(ConfirmarDialogo) dialogo!: ConfirmarDialogo;

  constructor(
    private fb: FormBuilder,
    private servicio: PrecioService,
  ) {
    this.formCuota = this.fb.group({ valor: [null, [Validators.required, Validators.min(0.01)]] });
    this.formRecargo = this.fb.group({ valor: [null, [Validators.required, Validators.min(0)]] });
    this.cargar();
  }

  get cuotaInvalida(): boolean {
    const c = this.formCuota.get('valor');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get recargoInvalido(): boolean {
    const c = this.formRecargo.get('valor');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  formatear(v: number | null): string {
    return v === null ? '—' : formatoMoneda.format(v);
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.servicio.listar().subscribe({
      next: (precios) => {
        this.cuotaActual.set(precios.find((p) => p.clave === 'CUOTA')?.valor ?? null);
        this.recargoActual.set(precios.find((p) => p.clave === 'RECARGO_SEMANAL')?.valor ?? null);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.errorCarga.set(true);
      },
    });
  }

  puedeGuardarCuota(): boolean {
    return this.formCuota.valid && this.guardando() === null && !this.esIgual(Number(this.formCuota.value.valor), this.cuotaActual());
  }

  puedeGuardarRecargo(): boolean {
    return this.formRecargo.valid && this.guardando() === null && !this.esIgual(Number(this.formRecargo.value.valor), this.recargoActual());
  }

  pedirConfirmarCuota(disparador: HTMLElement): void {
    if (!this.puedeGuardarCuota()) {
      this.formCuota.markAllAsTouched();
      return;
    }
    this.pedirConfirmacion('cuota', Number(this.formCuota.value.valor), disparador);
  }

  pedirConfirmarRecargo(disparador: HTMLElement): void {
    if (!this.puedeGuardarRecargo()) {
      this.formRecargo.markAllAsTouched();
      return;
    }
    this.pedirConfirmacion('recargo', Number(this.formRecargo.value.valor), disparador);
  }

  tituloConfirmacion(): string {
    const p = this.pendiente();
    if (!p) {
      return '';
    }
    const concepto = p.tipo === 'cuota' ? 'la cuota' : 'el recargo semanal';
    const actual = p.tipo === 'cuota' ? this.cuotaActual() : this.recargoActual();
    return `¿Cambiar ${concepto} de ${this.formatear(actual)} a ${this.formatear(p.valor)}?`;
  }

  confirmarGuardado(): void {
    const p = this.pendiente();
    this.pendiente.set(null);
    if (!p) {
      return;
    }
    this.guardando.set(p.tipo);
    if (p.tipo === 'cuota') {
      this.errorCuota.set(null);
    } else {
      this.errorRecargo.set(null);
    }
    this.exito.set(null);
    const operacion =
      p.tipo === 'cuota' ? this.servicio.actualizarCuota(p.valor) : this.servicio.actualizarRecargo(p.valor);
    operacion.subscribe({
      next: (r) => {
        if (p.tipo === 'cuota') {
          this.cuotaActual.set(r.valor);
          this.formCuota.reset();
        } else {
          this.recargoActual.set(r.valor);
          this.formRecargo.reset();
        }
        this.guardando.set(null);
        this.exito.set(
          p.tipo === 'cuota'
            ? `Cuota actualizada a ${this.formatear(r.valor)}`
            : `Recargo actualizado a ${this.formatear(r.valor)}`,
        );
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(null);
        if (p.tipo === 'cuota') {
          this.errorCuota.set(this.mensajeError(e));
        } else {
          this.errorRecargo.set(this.mensajeError(e));
        }
      },
    });
  }

  private pedirConfirmacion(tipo: Concepto, valor: number, disparador: HTMLElement): void {
    this.pendiente.set({ tipo, valor });
    this.dialogo.abrir(disparador);
  }

  private esIgual(nuevo: number, actual: number | null): boolean {
    return actual !== null && nuevo === actual;
  }

  private mensajeError(e: HttpErrorResponse): string {
    if (e.status === 400) {
      return 'Monto inválido según la regla del negocio';
    }
    return 'No se pudo guardar el valor';
  }
}
