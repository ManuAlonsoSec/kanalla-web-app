import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { LOGO_ART, LOGO_LAYERS } from './logo-paths';

type LayerName = keyof typeof LOGO_LAYERS;

/**
 * Logo Kanalla Burger por capas: recortes del PNG original
 * (public/images/logo-kanalla-burger-tinta.png): llamas, burger, gafas, cara y texto.
 * Conservan la textura de impresión; no se redibuja nada.
 *
 * Se ve entero desde el primer pintado. Lo único que se mueve son las llamas, y solo
 * cuando el logo es un enlace: un parpadeo lento al cargar (menos de 5 s, WCAG 2.2.2)
 * y se avivan al pasar el ratón o enfocar. CSS puro; con «reducir movimiento», quieto.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Sin encapsulado: las animaciones dependen de clases en <html> (`motion`) y en el enlace padre (`is-hot`).
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'logo',
    '[class.logo--mark]': "variant() === 'mark'",
    'aria-hidden': 'true',
    '[style.aspect-ratio]': 'ratio()',
  },
  template: `
    <span class="logo__art">
      @for (l of layers(); track l.name) {
        <span [class]="'logo__layer logo__layer--' + l.name" [style.left.%]="l.left" [style.top.%]="l.top" [style.width.%]="l.width">
          <span class="logo__inner">
            <picture>
              <source type="image/avif" [attr.srcset]="'/' + l.avif" />
              <img [src]="'/' + l.webp" [attr.width]="l.px.w" [attr.height]="l.px.h" alt="" decoding="async" />
            </picture>
          </span>
        </span>
      }
    </span>
  `,
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  /** `full`: logo completo (hero). `mark`: cabeza sin texto (header). */
  readonly variant = input<'full' | 'mark'>('full');
  protected readonly layers = computed(() => {
    const names: LayerName[] =
      this.variant() === 'mark'
        ? ['face', 'glasses', 'burger', 'flames']
        : ['text', 'face', 'glasses', 'burger', 'flames'];
    return names.map((name) => ({ name, ...LOGO_LAYERS[name] }));
  });

  /** La variante `mark` recorta (overflow) el lienzo a la cabeza, hasta el final de la barba. */
  protected readonly ratio = computed(() =>
    this.variant() === 'mark' ? `${LOGO_ART.w} / ${Math.round(LOGO_ART.h * MARK_HEIGHT)}` : `${LOGO_ART.w} / ${LOGO_ART.h}`,
  );
}

/** Fracción del alto del lienzo que ocupa la cabeza (llamas → barba). */
export const MARK_HEIGHT = 0.675;
