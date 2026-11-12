import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Manifiesto a tamaño cartel, quieto. Interlineado de 1,18 (no 0,92) para que las
 * tildes de NACE, ENSEÑARTE o SÍ no pisen la línea de arriba.
 */
@Component({
  selector: 'section[app-manifiesto]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'manifiesto', 'aria-label': 'Manifiesto Kanalla' },
  template: `
    <blockquote class="manifiesto__cita">
      <p class="manifiesto__texto">
        Ser un Kanalla es una personalidad, un estilo de vida, algo con lo que se nace o no se nace.
        <span class="manifiesto__giro">No podemos enseñarte a serlo, pero sí que lo&nbsp;saborees.</span>
      </p>
    </blockquote>
    <p class="manifiesto__firma">Bienvenidos a nuestra experiencia.</p>
  `,
  styleUrl: './manifiesto.component.scss',
})
export class ManifiestoComponent {}
