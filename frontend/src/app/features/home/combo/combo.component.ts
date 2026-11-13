import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { COMBO, FOTOS, euros, recorteFallback, recorteSrcset } from '../../../../data/datos';
import { AHORRO_MAX, BURGERS_COMBO, ComandaService, ahorroCombo, comboKey } from '../comanda/comanda.service';

/**
 * COMBO SOFÁ: el premio por pedir directo. Solo por WhatsApp o teléfono.
 * Precio y reglas en carta.json (`combo`); el ahorro se calcula con la carta.
 * En la comanda es un producto con selector de las dos burgers.
 */
@Component({
  selector: 'section[app-combo]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'combo', id: 'combo', 'aria-labelledby': 'combo-title', tabindex: '-1' },
  template: `
    <div class="combo__cab">
      <p class="combo__k">Solo pidiendo directo</p>
      <h2 id="combo-title" class="combo__titulo">{{ combo.nombre }}</h2>
    </div>

    <div class="combo__texto">
      <p class="combo__gancho">Las burgers vienen sin patatas.<br />Las del sofá, no.</p>
      <p class="combo__lleva">Dos burgers a tu elección, ración de patatas y tequeños por {{ combo.precio }}.</p>
    </div>

    <div class="combo__lado">
      <figure class="combo__foto">
        <picture class="combo__recorte">
          <source type="image/avif" [attr.srcset]="foto.avif" sizes="(min-width: 1100px) 18vw, 44vw" />
          <source type="image/webp" [attr.srcset]="foto.webp" sizes="(min-width: 1100px) 18vw, 44vw" />
          <img [src]="foto.jpg" [alt]="foto.alt" [width]="foto.width" [height]="foto.height" loading="lazy" decoding="async" />
        </picture>
      </figure>
      <p class="combo__precio">
        <span class="combo__precio-n">{{ combo.precio }}</span>
        <span class="combo__precio-a">Te ahorras hasta {{ ahorroMax }}</span>
      </p>
    </div>

    <div class="combo__elige">
      @for (n of huecos; track n) {
        <div class="combo__campo">
          <label class="combo__label" [for]="'combo-b' + n">{{ n === 0 ? 'Primera burger' : 'Segunda burger' }}</label>
          <select class="combo__select" [id]="'combo-b' + n" (change)="elegir(n, $event)">
            @for (p of burgers; track p.id) {
              <option [value]="p.id" [selected]="p.id === elegidas()[n]">{{ p.nombre }}</option>
            }
          </select>
        </div>
      }
      <div class="combo__accion">
        <button type="button" class="k-btn k-btn--kraft combo__boton" (click)="apuntar()">
          <span>Apuntar el {{ combo.nombre }}</span>
        </button>
        <p class="combo__ahorro" aria-live="polite">
          Con estas dos te ahorras {{ ahorro() }}.
          @if (llevas()) {
            Llevas {{ llevas() }} en la comanda.
          }
        </p>
      </div>
    </div>

    <p class="combo__letra">
      Solo por WhatsApp o por teléfono. Entran todas las burgers de la carta menos la del mes y el menú infantil.
    </p>
  `,
  styleUrl: './combo.component.scss',
})
export class ComboComponent {
  private readonly comanda = inject(ComandaService);

  protected readonly combo = COMBO;
  protected readonly burgers = BURGERS_COMBO;
  protected readonly huecos = Array.from({ length: COMBO.burgers }, (_, i) => i);
  protected readonly ahorroMax = euros(AHORRO_MAX).replace(',00', '');

  /** Por defecto: La Puerca (la del hero) y La Kanalla. */
  protected readonly elegidas = signal<string[]>(
    ['la-puerca', 'la-kanalla', ...BURGERS_COMBO.map((p) => p.id)]
      .filter((id) => BURGERS_COMBO.some((p) => p.id === id))
      .slice(0, COMBO.burgers),
  );
  protected readonly ahorro = computed(() => euros(ahorroCombo(this.elegidas())));
  protected readonly llevas = computed(() => this.comanda.combos());

  private readonly f = FOTOS['tequenos'];
  protected readonly foto = { ...this.f, avif: recorteSrcset(this.f, 'avif'), webp: recorteSrcset(this.f, 'webp'), jpg: recorteFallback(this.f) };

  protected elegir(n: number, e: Event): void {
    const id = (e.target as HTMLSelectElement).value;
    this.elegidas.update((ids) => ids.map((v, i) => (i === n ? id : v)));
  }

  protected apuntar(): void {
    this.comanda.apuntar(comboKey(this.elegidas()));
  }
}
