import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActividadService } from '../core/actividad.service';
import { Actividad } from '../core/models';

@Component({
  selector: 'app-actividades',
  imports: [ReactiveFormsModule],
  templateUrl: './actividades.html',
  styleUrl: './actividades.css',
})
export class Actividades {
  actividades = signal<Actividad[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  editandoId = signal<number | null>(null);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private servicio: ActividadService,
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.actividades.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    const payload = { nombre: this.form.value.nombre.trim(), descripcion: this.form.value.descripcion || null };
    const id = this.editandoId();
    const operacion = id === null ? this.servicio.crear(payload) : this.servicio.editar(id, payload);
    operacion.subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargar();
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'guardar')),
    });
  }

  editar(a: Actividad): void {
    this.editandoId.set(a.id);
    this.form.setValue({ nombre: a.nombre, descripcion: a.descripcion ?? '' });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset();
  }

  eliminar(a: Actividad): void {
    this.error.set(null);
    this.servicio.eliminar(a.id).subscribe({
      next: () => this.cargar(),
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'eliminar')),
    });
  }

  inhabilitar(a: Actividad): void {
    this.servicio.inhabilitar(a.id).subscribe({
      next: () => this.cargar(),
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'inhabilitar')),
    });
  }

  habilitar(a: Actividad): void {
    this.servicio.habilitar(a.id).subscribe({
      next: () => this.cargar(),
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'habilitar')),
    });
  }

  private mensajeError(e: HttpErrorResponse, accion: string): string {
    if (e.status === 409) {
      return accion === 'eliminar'
        ? 'La actividad tiene socios asignados: inhabilítela en lugar de eliminarla'
        : 'Ya existe una actividad con ese nombre';
    }
    if (e.status === 400) {
      return 'Datos inválidos: revise el nombre ingresado';
    }
    return `No se pudo ${accion} la actividad`;
  }
}
