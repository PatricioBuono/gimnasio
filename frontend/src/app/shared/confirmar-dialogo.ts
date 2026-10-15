import { Component, ElementRef, ViewChild, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmar-dialogo',
  templateUrl: './confirmar-dialogo.html',
  styleUrl: './confirmar-dialogo.css',
})
export class ConfirmarDialogo {
  titulo = input.required<string>();
  mensaje = input('');
  textoConfirmar = input('Confirmar');

  confirmado = output<void>();
  cancelado = output<void>();

  @ViewChild('dlg') dialogo!: ElementRef<HTMLDialogElement>;
  private disparador: HTMLElement | null = null;

  abrir(disparador: HTMLElement | null): void {
    this.disparador = disparador;
    const dlg = this.dialogo?.nativeElement;
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) {
      dlg.showModal();
      dlg.querySelector('button')?.focus();
    }
  }

  cancelar(): void {
    this.cerrar();
    this.cancelado.emit();
  }

  confirmar(): void {
    this.cerrar();
    this.confirmado.emit();
  }

  alCerrar(): void {
    this.disparador?.focus();
    this.disparador = null;
  }

  atraparTabulacion(evento: Event): void {
    const ev = evento as KeyboardEvent;
    if (ev.key !== 'Tab') {
      return;
    }
    const dlg = this.dialogo?.nativeElement;
    if (!dlg) {
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

  private cerrar(): void {
    const dlg = this.dialogo?.nativeElement;
    if (dlg && typeof dlg.close === 'function' && dlg.open) {
      dlg.close();
    }
    this.alCerrar();
  }
}
