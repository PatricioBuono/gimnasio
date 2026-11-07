import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivateLayout } from './private-layout';

describe('PrivateLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('usa la marca Hulk como acceso al inicio y no muestra Dashboard', () => {
    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const marca = nav.querySelector('a.marca') as HTMLAnchorElement;

    expect(nav.textContent).toContain('Hulk');
    expect(nav.textContent).toContain('Gimnasio');
    expect(nav.textContent).not.toContain('Dashboard');
    expect(marca.getAttribute('aria-label')).toContain('Hulk Gimnasio');
    expect(marca.getAttribute('href')).toBe('/dashboard');
  });

  it('muestra la imagen de marca local junto al wordmark', () => {
    const fixture = TestBed.createComponent(PrivateLayout);
    fixture.detectChanges();
    const imagen = fixture.nativeElement.querySelector('a.marca img.marca-imagen') as HTMLImageElement;

    expect(imagen).toBeTruthy();
    expect(imagen.getAttribute('src')).toBe('marca-hulk.jpg');
    expect(imagen.getAttribute('src')).not.toMatch(/^https?:/);
    expect(imagen.getAttribute('alt')).toBe('');
    expect(imagen.getAttribute('width')).toBe('44');
    expect(imagen.getAttribute('height')).toBe('44');
  });
});
