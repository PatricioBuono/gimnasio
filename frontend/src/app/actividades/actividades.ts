import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActividadService } from '../core/actividad.service';
import { Actividad } from '../core/models';
import { ConfirmarDialogo } from '../shared/confirmar-dialogo';

@Component({
  selector: 'app-actividades',
  imports: [ReactiveFormsModule, ConfirmarDialogo],
  templateUrl: './actividades.html',
  styleUrl: './actividades.css',
})
export class Actividades {
  actividades = signal<Actividad[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  editandoId = signal<number | null>(null);
  eliminarPendiente = signal<Actividad | null>(null);
  form: FormGroup;

  @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  @ViewChild(ConfirmarDialogo) dialogo!: ConfirmarDialogo;

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

  get nombreInvalido(): boolean {
    const c = this.form.get('nombre');
    return !!c && c.invalid && (c.touched || c.dirty);
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
    this.exito.set(null);
    const payload = { nombre: this.form.value.nombre.trim(), descripcion: this.form.value.descripcion || null };
    const id = this.editandoId();
    const esEdicion = id !== null;
    const operacion = esEdicion ? this.servicio.editar(id, payload) : this.servicio.crear(payload);
    operacion.subscribe({
      next: (a) => {
        this.exito.set(esEdicion ? `Actividad "${a.nombre}" actualizada` : `Actividad "${a.nombre}" creada`);
        this.cancelarEdicion();
        this.nombreInput?.nativeElement.focus();
        this.cargar();
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'guardar')),
    });
  }

  editar(a: Actividad): void {
    this.exito.set(null);
    this.editandoId.set(a.id);
    this.form.setValue({ nombre: a.nombre, descripcion: a.descripcion ?? '' });
    this.nombreInput?.nativeElement.focus();
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset();
  }

  pedirEliminar(a: Actividad, disparador: HTMLElement): void {
    this.eliminarPendiente.set(a);
    this.dialogo.abrir(disparador);
  }

  eliminarConfirmado(): void {
    const a = this.eliminarPendiente();
    this.eliminarPendiente.set(null);
    if (!a) {
      return;
    }
    this.error.set(null);
    this.exito.set(null);
    this.servicio.eliminar(a.id).subscribe({
      next: () => {
        this.exito.set(`Actividad "${a.nombre}" eliminada`);
        this.cargar();
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'eliminar')),
    });
  }

  inhabilitar(a: Actividad): void {
    this.servicio.inhabilitar(a.id).subscribe({
      next: () => {
        this.exito.set(`Actividad "${a.nombre}" inhabilitada`);
        this.cargar();
      },
      error: (e: HttpErrorResponse) => this.error.set(this.mensajeError(e, 'inhabilitar')),
    });
  }

  habilitar(a: Actividad): void {
    this.servicio.habilitar(a.id).subscribe({
      next: () => {
        this.exito.set(`Actividad "${a.nombre}" habilitada`);
        this.cargar();
      },
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
