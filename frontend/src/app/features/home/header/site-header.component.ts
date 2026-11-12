import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { LOCAL } from '../../../../data/datos';
import { LogoComponent } from '../logo/logo.component';

/**
 * Cabecera sobre el hero (no fija). El logo está desde el primer pintado; sus
 * llamas parpadean despacio al cargar y se avivan al pasar el ratón o enfocar.
 */
@Component({
  selector: 'header[app-site-header]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [LogoComponent],
  host: { class: 'site-header' },
  template: `
    <a class="site-header__logo" href="/" aria-label="Kanalla Skybar, inicio">
      <app-logo />
    </a>

    <nav class="site-header__nav" aria-label="Principal">
      <a href="#carta">Carta</a>
      <span class="site-header__sep" aria-hidden="true">·</span>
      <a href="#combo">Combo<span class="site-header__ancho">&nbsp;Sofá</span></a>
      <span class="site-header__sep" aria-hidden="true">·</span>
      <a href="#reservas">Reservas</a>
      <span class="site-header__sep site-header__ancho" aria-hidden="true">·</span>
      <a class="site-header__ancho" href="#contacto">Contacto</a>
    </nav>

    <a class="site-header__tel" [href]="local.telefono.href">
      <span class="site-header__ancho">Pide:&nbsp;</span>{{ local.telefono.texto }}
    </a>
  `,
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  protected readonly local = LOCAL;
}
