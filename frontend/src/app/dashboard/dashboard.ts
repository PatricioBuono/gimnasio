import { Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../core/dashboard.service';
import { Actividad, Dashboard, SocioEstado } from '../core/models';

export type FiltroEstado = 'TODOS' | 'CON_DEUDA' | 'POR_VENCER' | 'AL_DIA';

/** Días antes del vencimiento para considerar un socio "Por vencer". */
export const DIAS_POR_VENCER = 5;

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  busqueda = new FormControl('', { nonNullable: true });
  dashboard = signal<Dashboard | null>(null);
  resultados = signal<SocioEstado[] | null>(null);
  filtroActividad = signal<number | null>(null);
  filtroEstado = signal<FiltroEstado>('TODOS');
  cargando = signal(true);
  error = signal(false);
  socioDialogo = signal<SocioEstado | null>(null);

  @ViewChild('dialogo') dialogo!: ElementRef<HTMLDialogElement>;
  private disparadorDialogo: HTMLElement | null = null;

  alDia = computed(() => this.aplicarFiltros(this.dashboard()?.alDia ?? []));
  conDeuda = computed(() => this.aplicarFiltros(this.dashboard()?.conDeuda ?? []));
  busquedaFiltrada = computed(() => this.aplicarFiltros(this.resultados() ?? []));
  enBusqueda = computed(() => this.resultados() !== null);
  porVencer = computed(() =>
    this.aplicarFiltros((this.dashboard()?.alDia ?? []).filter((s) => this.esPorVencer(s))),
  );
  actividadesDisponibles = computed(() => {
    const todas = [
      ...(this.dashboard()?.alDia ?? []),
      ...(this.dashboard()?.conDeuda ?? []),
      ...(this.resultados() ?? []),
    ];
    const mapa = new Map<number, Actividad>();
    for (const s of todas) {
      for (const a of s.actividades) {
        mapa.set(a.id, a);
      }
    }
    return [...mapa.values()];
  });

  private destroyRef = inject(DestroyRef);

  constructor(
    private servicio: DashboardService,
    private router: Router,
  ) {
    this.cargar();
    this.busqueda.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => (q.trim() ? this.servicio.buscar(q.trim()) : of(null))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => this.resultados.set(r));
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.servicio.estado().subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(true);
      },
    });
  }

  semanas(dias: number): number {
    return Math.ceil(dias / 7);
  }

  etiquetaMora(s: SocioEstado): string {
    return `${s.diasAtraso} días (${this.semanas(s.diasAtraso)} semanas) de atraso`;
  }

  formatearFecha(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  }

  diasHastaLimite(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(y, m - 1, d);
    return Math.round((limite.getTime() - hoy.getTime()) / 86400000);
  }

  esPorVencer(s: SocioEstado): boolean {
    if (s.estado !== 'AL_DIA') {
      return false;
    }
    const dias = this.diasHastaLimite(s.fechaLimite);
    return dias >= 0 && dias <= DIAS_POR_VENCER;
  }

  cambiarFiltro(valor: string): void {
    this.filtroActividad.set(valor ? Number(valor) : null);
  }

  limpiarBusqueda(): void {
    this.busqueda.setValue('');
  }

  cambiarFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(this.filtroEstado() === f ? 'TODOS' : f);
  }

  abrirConfirmacion(s: SocioEstado, disparador: HTMLElement): void {
    this.socioDialogo.set(s);
    this.disparadorDialogo = disparador;
    const dlg = this.dialogo?.nativeElement;
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) {
      dlg.showModal();
      dlg.querySelector('button')?.focus();
    }
  }

  cerrarConfirmacion(): void {
    const dlg = this.dialogo?.nativeElement;
    if (dlg && typeof dlg.close === 'function' && dlg.open) {
      dlg.close();
    }
    this.alCerrarDialogo();
  }

  alCerrarDialogo(): void {
    this.socioDialogo.set(null);
    this.disparadorDialogo?.focus();
    this.disparadorDialogo = null;
  }

  irACobrar(): void {
    const s = this.socioDialogo();
    this.cerrarConfirmacion();
    if (s) {
      this.router.navigate(['/cobros', s.id]);
    }
  }

  atraparTabulacion(evento: Event): void {
    const dlg = this.dialogo?.nativeElement;
    if (!dlg) {
      return;
    }
    const ev = evento as KeyboardEvent;
    if (ev.key !== 'Tab') {
      return;
    }
    const focos = Array.from(dlg.querySelectorAll('button'));
    if (focos.length === 0) {
      return;
    }
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    const activo = document.activeElement as HTMLElement | null;
    if (ev.shiftKey && activo === primero) {
      ev.preventDefault();
      ultimo.focus();
    } else if (!ev.shiftKey && activo === ultimo) {
      ev.preventDefault();
      primero.focus();
    }
  }

  private aplicarFiltros(lista: SocioEstado[]): SocioEstado[] {
    const porActividad = this.filtrarActividad(lista);
    switch (this.filtroEstado()) {
      case 'CON_DEUDA':
        return porActividad.filter((s) => s.estado === 'CON_DEUDA');
      case 'AL_DIA':
        return porActividad.filter((s) => s.estado === 'AL_DIA');
      case 'POR_VENCER':
        return porActividad.filter((s) => this.esPorVencer(s));
      default:
        return porActividad;
    }
  }

  private filtrarActividad(lista: SocioEstado[]): SocioEstado[] {
    const id = this.filtroActividad();
    if (id === null) {
      return lista;
    }
    return lista.filter((s) => s.actividades.some((a) => a.id === id));
  }
}
