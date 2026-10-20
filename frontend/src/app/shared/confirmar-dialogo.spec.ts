import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarDialogo } from './confirmar-dialogo';

describe('ConfirmarDialogo', () => {
  let fixture: ComponentFixture<ConfirmarDialogo>;
  let comp: ConfirmarDialogo;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmarDialogo] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmarDialogo);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('titulo', 'Eliminar Crossfit');
    fixture.componentRef.setInput('mensaje', 'Acción irreversible');
    fixture.detectChanges();
  });

  it('muestra título y mensaje', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Eliminar Crossfit');
    expect(texto).toContain('Acción irreversible');
  });

  it('tiene rol alertdialog y el destructivo no es el primer botón', () => {
    const dlg = fixture.nativeElement.querySelector('dialog') as HTMLElement;
    expect(dlg.getAttribute('role')).toBe('alertdialog');
    const botones = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    expect(botones[0].textContent?.trim()).toBe('Cancelar');
  });

  it('confirmar emite y cancelar emite', () => {
    const confirmado = vi.fn();
    const cancelado = vi.fn();
    comp.confirmado.subscribe(confirmado);
    comp.cancelado.subscribe(cancelado);

    comp.confirmar();
    comp.cancelar();

    expect(confirmado).toHaveBeenCalledTimes(1);
    expect(cancelado).toHaveBeenCalledTimes(1);
  });

  it('variante primaria usa botón primario', () => {
    fixture.componentRef.setInput('variante', 'primario');
    fixture.componentRef.setInput('textoConfirmar', 'Guardar');
    fixture.detectChanges();

    const confirmar = (fixture.nativeElement as HTMLElement).querySelectorAll('button')[1];
    expect(confirmar.classList.contains('btn-primario')).toBe(true);
    expect(confirmar.textContent?.trim()).toBe('Guardar');
  });

  it('cerrar devuelve el foco al disparador', () => {
    const disparador = document.createElement('button');
    document.body.appendChild(disparador);
    comp.abrir(disparador);
    comp.alCerrar();

    expect(document.activeElement).toBe(disparador);
    disparador.remove();
  });
});
