import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ActividadService } from '../core/actividad.service';
import { SocioService } from '../core/socio.service';
import { Actividad, FichaSocio } from '../core/models';

@Component({
  selector: 'app-ficha-socio',
  imports: [ReactiveFormsModule],
  templateUrl: './ficha-socio.html',
  styleUrl: './ficha-socio.css',
})
export class FichaSocioComponent {
  ficha = signal<FichaSocio | null>(null);
  activas = signal<Actividad[]>([]);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  form: FormGroup;
  private socioId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private ruta: ActivatedRoute,
    private socios: SocioService,
    private actividades: ActividadService,
  ) {
    this.form = this.fb.group({ actividadIds: [[] as number[]] });
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (Number.isInteger(id)) {
      this.socioId = id;
      this.cargar();
    } else {
      this.error.set('Socio inválido');
    }
  }

  cargar(): void {
    if (this.socioId === null) {
      return;
    }
    this.socios.ficha(this.socioId).subscribe({
      next: (f) => {
        this.ficha.set(f);
        this.form.setValue({ actividadIds: f.actividades.map((a) => a.id) });
      },
      error: () => this.error.set('No se pudo cargar la ficha'),
    });
    this.actividades.listar().subscribe({
      next: (lista) => this.activas.set(lista.filter((a) => a.estado === 'ACTIVA')),
    });
  }

  guardar(): void {
    if (this.socioId === null) {
      return;
    }
    this.error.set(null);
    this.exito.set(null);
    this.socios.asignar(this.socioId, this.form.value.actividadIds ?? []).subscribe({
      next: (f) => {
        this.ficha.set(f);
        this.exito.set('Actividades actualizadas');
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e)),
    });
  }

  alternar(id: number, marcada: boolean): void {
    const actual = new Set<number>(this.form.value.actividadIds ?? []);
    if (marcada) {
      actual.add(id);
    } else {
      actual.delete(id);
    }
    this.form.setValue({ actividadIds: [...actual] });
  }

  marcada(id: number): boolean {
    return (this.form.value.actividadIds as number[]).includes(id);
  }

  private mensajeError(e: HttpErrorResponse): string {
    if (e.status === 400) {
      return 'Una actividad ya no está activa: recargue el catálogo';
    }
    return 'No se pudieron asignar las actividades';
  }
}
