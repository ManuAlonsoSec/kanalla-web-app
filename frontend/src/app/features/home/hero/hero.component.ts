import { ChangeDetectionStrategy, Component, ViewEncapsulation, afterNextRender, computed, inject, signal } from '@angular/core';
import { FOTOS, LOCAL, PLATOS, recorteFallback, recorteSrcset } from '../../../../data/datos';
import { ComandaService } from '../comanda/comanda.service';
import { horarioDeHoy, type Hoy } from '../hoy';

/**
 * Hero cartel (dirección A dentro de la comanda C).
 * Anton a sangre y composición asimétrica: el titular se reparte por la rejilla del
 * hero (subgrid) alrededor de La Puerca, recortada a tijera como una foto de fanzine
 * (el corte va en la imagen: scripts/recortar-fotos.mjs).
 *
 * · Todo visible desde el primer pintado: ni el titular ni la foto se animan.
 *   La foto va en AVIF, con dimensiones fijas y fetchpriority="high".
 * · El talón «Pide directo» abre WhatsApp sin JavaScript.
 * · «Hoy» se rellena en el navegador (el HTML prerenderizado no sabe qué día es);
 *   su hueco está reservado para que no salte nada.
 */
@Component({
  selector: 'section[app-hero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'hero', id: 'inicio', 'aria-labelledby': 'hero-title' },
  template: `
    <h1 id="hero-title" class="hero__titulo">
      <span class="hero__l hero__l1">Si estás</span>&ngsp;<span class="hero__l hero__l2">aquí,</span>&ngsp;<span
        class="hero__cinta"
        >ya eres un poco</span
      >&ngsp;<span class="hero__l hero__l3">Kanalla.</span>
    </h1>

    <figure class="hero__foto">
      <picture class="hero__recorte">
        <source type="image/avif" [attr.srcset]="avif" [attr.sizes]="sizes" />
        <source type="image/webp" [attr.srcset]="webp" [attr.sizes]="sizes" />
        <img [src]="jpg" [alt]="foto.alt" [width]="foto.width" [height]="foto.height" fetchpriority="high" />
      </picture>
      <figcaption class="hero__pie">
        <span class="hero__plato">{{ plato.nombre }}</span>
        <span class="hero__punto" aria-hidden="true">·</span>
        <span class="hero__precio">{{ plato.precio }}</span>
        <button type="button" class="hero__mas" (click)="apuntar()">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5v11M2.5 8h11" /></svg>
          <span>Apúntala<span class="sr-only"> en tu comanda</span></span>
        </button>
        @if (llevas()) {
          <span class="hero__llevas">Llevas {{ llevas() }}</span>
        }
      </figcaption>
    </figure>

    <div class="hero__pide">
      <a class="talon" [href]="local.whatsapp.href" target="_blank" rel="noopener">
        <span class="talon__papel">
          <span class="talon__k">Pide directo</span>
          <span class="talon__t">WhatsApp {{ local.telefono.texto }}</span>
        </span>
        <span class="sr-only"> (se abre WhatsApp)</span>
      </a>
      <a class="hero__llama" [href]="local.telefono.href">o llama al {{ local.telefono.texto }}</a>
    </div>

    <dl class="hero__dia">
      <div class="hero__hoy" [class.is-cerrado]="hoy() && !hoy()!.abierto">
        <dt>Hoy{{ hoy() ? ', ' + hoy()!.dia : '' }}</dt>
        <dd>{{ hoy()?.texto ?? '' }}</dd>
      </div>
      <div>
        <dt>Repartimos en</dt>
        <dd>{{ zonas }}</dd>
      </div>
    </dl>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  private readonly comanda = inject(ComandaService);

  protected readonly local = LOCAL;
  protected readonly zonas = LOCAL.zonasReparto.join(' · ');
  protected readonly foto = FOTOS['la-puerca'];
  protected readonly plato = PLATOS.get('la-puerca')!;
  protected readonly sizes = '(min-width: 900px) 48vw, 90vw'; // en móvil la foto ocupa ~90 % del ancho
  protected readonly avif = recorteSrcset(this.foto, 'avif');
  protected readonly webp = recorteSrcset(this.foto, 'webp');
  protected readonly jpg = recorteFallback(this.foto);

  protected readonly hoy = signal<Hoy | null>(null);
  protected readonly llevas = computed(() => this.comanda.porPlato().get(this.plato.id) ?? 0);

  constructor() {
    afterNextRender(() => this.hoy.set(horarioDeHoy()));
  }

  protected apuntar(): void {
    this.comanda.apuntar(this.plato.id);
  }
}
