import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PagoService } from '../core/pago.service';
import { Comprobante, MetodoPago, VistaPrevia } from '../core/models';
import { formatearFecha, formatearMoneda } from '../core/formato';

const formatoPeriodo = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Mendoza',
  year: 'numeric',
  month: '2-digit',
});

@Component({
  selector: 'app-cobro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cobro.html',
  styleUrl: './cobro.css',
})
export class Cobro {
  vista = signal<VistaPrevia | null>(null);
  comprobante = signal<Comprobante | null>(null);
  error = signal<string | null>(null);
  exonerado = signal(false);
  motivo = signal('');
  motivoTocado = signal(false);
  calculando = signal(false);
  registrando = signal(false);

  readonly socioId: number | null;
  form: FormGroup;

  private periodoCalculado: string | null = null;
  private solicitudActual = 0;
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  @ViewChild('periodoInput') periodoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('alertaError') alertaError?: ElementRef<HTMLElement>;
  @ViewChild('tituloComprobante') tituloComprobante?: ElementRef<HTMLElement>;

  constructor(
    private fb: FormBuilder,
    private ruta: ActivatedRoute,
    private servicio: PagoService,
  ) {
    const periodoInicial = formatoPeriodo.format(new Date());
    this.form = this.fb.group({
      periodo: [periodoInicial, [Validators.required, Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)]],
      metodo: ['EFECTIVO' as MetodoPago, Validators.required],
    });
    const id = Number(this.ruta.snapshot.paramMap.get('socioId'));
    this.socioId = Number.isInteger(id) && id > 0 ? id : null;

    this.form
      .get('periodo')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.invalidarVista());
  }

  get periodoInvalido(): boolean {
    const c = this.form.get('periodo');
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  get motivoInvalido(): boolean {
    return this.exonerado() && this.motivoTocado() && this.motivo().trim() === '';
  }

  hayRecargo(): boolean {
    const v = this.vista();
    return !!v && v.recargo > 0;
  }

  calcular(): void {
    if (this.socioId === null || this.registrando()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.periodoInput?.nativeElement.focus();
      return;
    }
    const periodo = String(this.form.value.periodo).trim();
    const solicitud = ++this.solicitudActual;
    this.error.set(null);
    this.vista.set(null);
    this.periodoCalculado = null;
    this.limpiarExoneracion();
    this.calculando.set(true);
    this.servicio.vistaPrevia(this.socioId, periodo).subscribe({
      next: (v) => {
        if (solicitud !== this.solicitudActual) {
          return;
        }
        this.calculando.set(false);
        this.comprobante.set(null);
        this.vista.set(v);
        this.periodoCalculado = periodo;
      },
      error: (e: HttpErrorResponse) => {
        if (solicitud !== this.solicitudActual) {
          return;
        }
        this.calculando.set(false);
        this.error.set(this.mensajeError(e, 'calcular'));
        this.enfocarError();
      },
    });
  }

  alternarExoneracion(marcada: boolean): void {
    this.exonerado.set(marcada);
    if (!marcada) {
      this.motivo.set('');
      this.motivoTocado.set(false);
    }
  }

  alCambiarMotivo(valor: string): void {
    this.motivo.set(valor);
    this.motivoTocado.set(true);
  }

  totalMostrado(): number | null {
    const v = this.vista();
    if (!v) {
      return null;
    }
    return this.exonerado() ? v.cuota : v.total;
  }

  puedePagar(): boolean {
    const v = this.vista();
    if (!v || this.registrando() || this.socioId === null) {
      return false;
    }
    if (this.periodoCalculado !== this.periodoActual()) {
      return false;
    }
    return !this.exonerado() || this.motivo().trim().length > 0;
  }

  pagar(): void {
    if (!this.puedePagar() || this.socioId === null) {
      return;
    }
    const periodo = this.periodoActual();
    if (periodo !== this.periodoCalculado) {
      this.error.set('Volvé a calcular el desglose para el período elegido.');
      this.enfocarError();
      return;
    }
    this.error.set(null);
    this.registrando.set(true);
    this.servicio
      .registrar({
        socioId: this.socioId,
        periodo,
        metodo: this.form.value.metodo,
        exonerado: this.exonerado(),
        motivo: this.exonerado() ? this.motivo().trim() : null,
      })
      .subscribe({
        next: (c) => {
          this.registrando.set(false);
          this.comprobante.set(c);
          this.vista.set(null);
          this.periodoCalculado = null;
          this.limpiarExoneracion();
          this.enfocarComprobante();
        },
        error: (e: HttpErrorResponse) => {
          this.registrando.set(false);
          this.error.set(this.mensajeError(e, 'registrar'));
          this.enfocarError();
        },
      });
  }

  nuevoCobro(): void {
    this.invalidarVista();
    this.comprobante.set(null);
    afterNextRender(() => this.periodoInput?.nativeElement.focus(), { injector: this.injector });
  }

  periodoActual(): string {
    return String(this.form.value.periodo ?? '').trim();
  }

  metodoTexto(metodo: MetodoPago): string {
    return metodo === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo';
  }

  semanasTexto(semanas: number): string {
    return semanas === 1 ? '1 semana' : `${semanas} semanas`;
  }

  etiquetaAtraso(v: VistaPrevia): string {
    if (v.diasAtraso <= 0) {
      return 'En término';
    }
    return `${v.diasAtraso} ${v.diasAtraso === 1 ? 'día' : 'días'} de atraso`;
  }

  formatear(valor: number | null | undefined): string {
    return formatearMoneda(valor);
  }

  fecha(iso: string): string {
    return formatearFecha(iso);
  }

  private invalidarVista(): void {
    this.solicitudActual++;
    this.calculando.set(false);
    this.error.set(null);
    this.periodoCalculado = null;
    this.vista.set(null);
    this.limpiarExoneracion();
  }

  private limpiarExoneracion(): void {
    this.exonerado.set(false);
    this.motivo.set('');
    this.motivoTocado.set(false);
  }

  private enfocarError(): void {
    afterNextRender(() => this.alertaError?.nativeElement.focus(), { injector: this.injector });
  }

  private enfocarComprobante(): void {
    afterNextRender(() => this.tituloComprobante?.nativeElement.focus(), { injector: this.injector });
  }

  private mensajeError(e: HttpErrorResponse, contexto: 'calcular' | 'registrar'): string {
    if (e.status === 0) {
      return 'No se pudo conectar con el servidor. Verificá la conexión e intentá de nuevo.';
    }
    if (e.status === 404) {
      return 'No se encontró el socio.';
    }
    if (e.status === 409) {
      return 'El período ya está pagado.';
    }
    if (e.status === 403) {
      return 'No tenés permiso para operar en caja.';
    }
    if (e.status === 400) {
      return contexto === 'registrar'
        ? 'No se pudo registrar el cobro: revisá el motivo de la exoneración.'
        : 'El período o el socio no son válidos.';
    }
    return contexto === 'registrar' ? 'No se pudo registrar el cobro.' : 'No se pudo calcular el desglose.';
  }
}
