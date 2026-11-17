import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { COMBO, FOTOS, PLATOS, euros, eurosCorto, recorteFallback, recorteSrcset } from '../../../../data/datos';
import {
  AHORRO_MAX,
  BURGERS_COMBO,
  ComandaService,
  ahorroCombo,
  comboKey,
  precioCombo,
  suplementoCombo,
} from '../comanda/comanda.service';

/**
 * COMBO SOFÁ: el premio por pedir directo. Solo por WhatsApp o teléfono.
 * Precio base, suplementos y reglas en carta.json (`combo`); el precio según las
 * burgers elegidas y el ahorro se calculan con la carta.
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
      <p class="combo__lleva">
        Dos burgers a tu elección, ración de patatas y tequeños por {{ combo.precio }}. No incluye bebida.
      </p>
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
        <span class="combo__precio-n" aria-live="polite">{{ precio() }}</span>
        <span class="combo__precio-a">Te ahorras hasta {{ ahorroMax }}</span>
      </p>
    </div>

    <div class="combo__elige">
      @for (n of huecos; track n) {
        <div class="combo__campo">
          <label class="combo__label" [for]="'combo-b' + n">{{ n === 0 ? 'Primera burger' : 'Segunda burger' }}</label>
          <select class="combo__select" [id]="'combo-b' + n" (change)="elegir(n, $event)">
            @for (p of burgers; track p.id) {
              <option [value]="p.id" [selected]="p.id === elegidas()[n]">{{ p.nombre }}{{ p.mas }}</option>
            }
          </select>
        </div>
      }
      <p class="combo__regla">{{ regla }}</p>
      <div class="combo__accion">
        <button type="button" class="k-btn k-btn--kraft combo__boton" (click)="apuntar()">
          <span>Apuntar el {{ combo.nombre }}</span>
        </button>
        <p class="combo__ahorro" aria-live="polite">
          Con estas dos sale por {{ precio() }} y te ahorras {{ ahorro() }}.
          @if (llevas()) {
            Llevas {{ llevas() }} en la comanda.
          }
        </p>
      </div>
    </div>

    <p class="combo__letra">Solo por WhatsApp o por teléfono.</p>
  `,
  styleUrl: './combo.component.scss',
})
export class ComboComponent {
  private readonly comanda = inject(ComandaService);

  protected readonly combo = COMBO;
  /** Burgers del selector; las que llevan suplemento lo dicen: «La Puerca (+1€)». */
  protected readonly burgers = BURGERS_COMBO.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    mas: suplementoCombo(p.id) ? ` (+${eurosCorto(suplementoCombo(p.id))})` : '',
  }));
  protected readonly huecos = Array.from({ length: COMBO.burgers }, (_, i) => i);
  protected readonly ahorroMax = euros(AHORRO_MAX).replace(',00', '');

  /** Por defecto, las dos primeras sin suplemento: el combo arranca en su precio base. */
  protected readonly elegidas = signal<string[]>(
    [...BURGERS_COMBO.filter((p) => !suplementoCombo(p.id)), ...BURGERS_COMBO].map((p) => p.id).slice(0, COMBO.burgers),
  );
  /** Precio con las burgers elegidas: 35, 36 o 37 €. */
  protected readonly precio = computed(() => euros(precioCombo(this.elegidas())));
  protected readonly ahorro = computed(() => euros(ahorroCombo(this.elegidas())));

  /**
   * «Entran todas las burgers de la carta menos la del mes y el menú infantil.
   * La Puerca y La Clásica, +1 € cada una.» La segunda frase sale de `suplementos`.
   */
  protected readonly regla = (() => {
    const base = 'Entran todas las burgers de la carta menos la del mes y el menú infantil.';
    const con = Object.keys(COMBO.suplementos ?? {}).filter((id) => suplementoCombo(id) && PLATOS.has(id));
    if (!con.length) return base;
    const importes = new Set(con.map(suplementoCombo));
    const nombres = con.map((id) => PLATOS.get(id)!.nombre);
    const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0];
    const mas = importes.size === 1 ? `+${eurosCorto([...importes][0]).replace('€', ' €')}` : 'con suplemento';
    return `${base} ${lista}, ${mas}${nombres.length > 1 ? ' cada una' : ''}.`;
  })();
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
