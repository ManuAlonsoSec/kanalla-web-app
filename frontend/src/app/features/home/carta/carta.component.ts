import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CARTA, FOTOS, recorteFallback, recorteSrcset, type FotoSlug, type SeccionCarta } from '../../../../data/datos';
import { ComandaService } from '../comanda/comanda.service';

function foto(slug: FotoSlug) {
  const f = FOTOS[slug];
  return { ...f, avif: recorteSrcset(f, 'avif'), webp: recorteSrcset(f, 'webp'), jpg: recorteFallback(f) };
}

/**
 * La carta como una hoja larga (sin pestañas), con la voz de la carta impresa.
 * Cada plato lleva su «+» para apuntarlo en la comanda.
 * Cada sección tiene su composición: hamburguesas a dos columnas con un collage,
 * extras en una tira, entrantes con la foto al lado, ensaladas y postres en pareja.
 */
@Component({
  selector: 'section[app-carta]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  host: { class: 'carta', id: 'carta', 'aria-labelledby': 'carta-title', tabindex: '-1' },
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.scss',
})
export class CartaComponent {
  protected readonly comanda = inject(ComandaService);

  /** Abrir la tabla de alérgenos (la gestiona la página). */
  readonly alergenos = output<void>();

  protected readonly s = Object.fromEntries(CARTA.map((sec) => [sec.id, sec])) as Record<string, SeccionCarta>;
  protected readonly fotos = { clasica: foto('la-clasica'), ramona: foto('la-ramona'), nachos: foto('nachos') };

  protected cuantos(id: string): number {
    return this.comanda.porPlato().get(id) ?? 0;
  }

  protected apuntar(id: string): void {
    this.comanda.apuntar(id);
  }
}
