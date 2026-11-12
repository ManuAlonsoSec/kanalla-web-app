import { ChangeDetectionStrategy, Component, ViewEncapsulation, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LOCAL } from '../../../../data/datos';
import { LogoComponent } from '../logo/logo.component';

/** Pie como el folio de la carta impresa: datos en tres columnas y el logo abajo, quieto. */
@Component({
  selector: 'footer[app-site-footer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, LogoComponent],
  host: { class: 'site-footer', id: 'contacto', tabindex: '-1', 'aria-labelledby': 'contacto-title' },
  template: `
    <h2 id="contacto-title" class="sr-only">Contacto y horario</h2>

    <div class="site-footer__cols">
      <div class="site-footer__col">
        <h3 class="site-footer__h">Dónde</h3>
        <address class="site-footer__addr">
          {{ local.direccion.calle }}<br />
          {{ local.direccion.cp }} {{ local.direccion.localidad }}, {{ local.direccion.region }}
        </address>
        <a class="k-link" [href]="local.mapa" target="_blank" rel="noopener">
          Cómo llegar<span class="sr-only"> (abre Google Maps)</span>
        </a>
      </div>

      <div class="site-footer__col">
        <h3 class="site-footer__h">Horario <span class="site-footer__sub">(cocina y reparto)</span></h3>
        <dl class="site-footer__horario">
          @for (h of local.horario; track h.dias) {
            <div>
              <dt>{{ h.dias }}</dt>
              <dd>
                @if (h.turnos.length) {
                  @for (t of h.turnos; track t; let l = $last) {
                    <span class="site-footer__turno">{{ t }}</span>@if (!l) {<span class="sr-only"> y </span><span aria-hidden="true"> · </span>}
                  }
                } @else {
                  Descansamos
                }
              </dd>
            </div>
          }
        </dl>
      </div>

      <div class="site-footer__col">
        <h3 class="site-footer__h">Pide y pregunta</h3>
        <ul class="site-footer__list" role="list">
          <li><a [href]="local.telefono.href">Tel. {{ local.telefono.texto }}</a></li>
          <li>
            <a [href]="local.whatsapp.href" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (se abre WhatsApp)</span></a>
          </li>
          <li><a [href]="'mailto:' + local.email">{{ local.email }}</a></li>
          <li>
            <a [href]="local.instagram" target="_blank" rel="noopener">Instagram<span class="sr-only"> (se abre Instagram)</span></a>
          </li>
        </ul>
      </div>
    </div>

    <div class="site-footer__sello">
      <app-logo />
    </div>

    <div class="site-footer__legal">
      <button type="button" class="k-link" (click)="alergenos.emit()" aria-haspopup="dialog">Alérgenos</button>
      <span aria-hidden="true">·</span>
      <a class="k-link" routerLink="/privacidad">Privacidad</a>
      <span aria-hidden="true">·</span>
      <a class="k-link" routerLink="/cookies">Cookies</a>
      <p class="site-footer__copy">© {{ year }} Kanalla Skybar · Galapagar</p>
    </div>
  `,
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly alergenos = output<void>();
  protected readonly local = LOCAL;
  protected readonly year = new Date().getFullYear();
}
