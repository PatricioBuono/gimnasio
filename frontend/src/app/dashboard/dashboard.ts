import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../core/dashboard.service';
import { Actividad, Dashboard, SocioEstado } from '../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  busqueda = new FormControl('', { nonNullable: true });
  dashboard = signal<Dashboard | null>(null);
  resultados = signal<SocioEstado[] | null>(null);
  filtroActividad = signal<number | null>(null);

  alDia = computed(() => this.filtrar(this.dashboard()?.alDia ?? []));
  conDeuda = computed(() => this.filtrar(this.dashboard()?.conDeuda ?? []));
  busquedaFiltrada = computed(() => this.filtrar(this.resultados() ?? []));
  enBusqueda = computed(() => this.resultados() !== null);
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

  constructor(private servicio: DashboardService) {
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
    this.servicio.estado().subscribe({
      next: (d) => this.dashboard.set(d),
    });
  }

  semanas(dias: number): number {
    return Math.ceil(dias / 7);
  }

  etiquetaMora(s: SocioEstado): string {
    return `${s.diasAtraso} días (${this.semanas(s.diasAtraso)} semanas) de atraso`;
  }

  cambiarFiltro(valor: string): void {
    this.filtroActividad.set(valor ? Number(valor) : null);
  }

  private filtrar(lista: SocioEstado[]): SocioEstado[] {
    const id = this.filtroActividad();
    if (id === null) {
      return lista;
    }
    return lista.filter((s) => s.actividades.some((a) => a.id === id));
  }
}
