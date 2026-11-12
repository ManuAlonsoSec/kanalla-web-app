import { ChangeDetectionStrategy, Component, ViewEncapsulation, afterNextRender, signal } from '@angular/core';
import { LOCAL } from '../../../../data/datos';
import { LogoComponent } from '../logo/logo.component';
import { horarioDeHoy, type Hoy } from '../hoy';

/**
 * Hero cartel: el logo es la imagen. Composición asimétrica, con el logo grande a un
 * lado y el titular en Anton a sangre al otro; en móvil, el logo arriba y el titular
 * debajo. Las fotos de los platos viven solo en la carta.
 *
 * · Todo visible desde el primer pintado. Solo se mueven las llamas del logo
 *   (parpadeo lento al cargar; se avivan al pasar el ratón).
 * · El talón «Pide directo» abre WhatsApp sin JavaScript.
 * · «Hoy» se rellena en el navegador (el HTML prerenderizado no sabe qué día es);
 *   su hueco está reservado para que no salte nada.
 */
@Component({
  selector: 'section[app-hero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [LogoComponent],
  host: { class: 'hero hero--a', id: 'inicio', 'aria-labelledby': 'hero-title' },
  template: `
    <div class="hero__logo logo-vivo" role="img" aria-label="Logo de Kanalla Burger">
      <app-logo [anchoVw]="logoVw" />
    </div>

    <div class="hero__cab">
      <p class="hero__kicker">Galapagar · Burgers · Rooftop</p>
      <h1 id="hero-title" class="hero__titulo">
        <span class="hero__l">Kanalla</span>&ngsp;<span class="hero__l">se nace.</span>
      </h1>
    </div>

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
  protected readonly local = LOCAL;
  protected readonly zonas = LOCAL.zonasReparto.join(' · ');
  /** Ancho del logo en vw [móvil, escritorio], para elegir el tamaño de sus capas. */
  protected readonly logoVw = [62, 38] as const;

  protected readonly hoy = signal<Hoy | null>(null);

  constructor() {
    afterNextRender(() => this.hoy.set(horarioDeHoy()));
  }
}
