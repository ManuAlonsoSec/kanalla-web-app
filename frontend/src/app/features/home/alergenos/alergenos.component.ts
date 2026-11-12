import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ALERGENOS, CARTA } from '../../../../data/datos';

interface Fila {
  plato: string;
  sinGluten: string;
  /** Por alérgeno: 'X' contiene, 'T' trazas, '' nada */
  celdas: ('X' | 'T' | '')[];
  /** Plato de la carta sin fila en la tabla → «Consulta al personal» */
  consulta: boolean;
}

/**
 * Tabla de alérgenos (datos: src/data/alergenos.json) en un <dialog> nativo:
 * foco atrapado, Esc para cerrar y fondo inerte sin JS propio.
 * Los platos de la carta sin fila en la tabla aparecen como «Consulta al personal»:
 * no se inventan datos.
 */
@Component({
  selector: 'app-alergenos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './alergenos.component.html',
  styleUrl: './alergenos.component.scss',
})
export class AlergenosComponent {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** El contenido se monta al abrir por primera vez y se queda montado. */
  protected readonly montado = signal(false);
  protected readonly datos = ALERGENOS;
  protected readonly columnas = ALERGENOS.alergenos.map((k) => ({ key: k, label: ALERGENOS.etiquetas[k] }));
  protected readonly leyendaSinGluten = Object.entries(ALERGENOS.leyenda.sinGluten);

  protected readonly secciones = ALERGENOS.secciones.map((sec) => {
    const filas: Fila[] = sec.platos.map((p) => ({
      plato: p.plato,
      sinGluten: p.sinGluten,
      celdas: ALERGENOS.alergenos.map((a) => (p.contiene.includes(a) ? 'X' : p.trazas.includes(a) ? 'T' : '')),
      consulta: false,
    }));
    // Platos de la carta que no tienen fila en la tabla
    const enCarta = CARTA.find((c) => c.titulo === sec.seccion);
    for (const p of enCarta?.platos ?? []) {
      if (p.alergenos === 'consulta') {
        filas.push({ plato: p.nombre, sinGluten: '', celdas: [], consulta: true });
      }
    }
    return { nombre: sec.seccion, filas };
  });

  private readonly injector = inject(Injector);

  open(): void {
    const d = this.dialog().nativeElement;
    if (this.montado()) {
      if (!d.open) d.showModal();
      return;
    }
    // Primera vez: montar la tabla y abrir cuando ya está pintada (foco y título listos)
    this.montado.set(true);
    afterNextRender(() => d.open || d.showModal(), { injector: this.injector });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** Clic en el fondo (fuera del contenido) cierra. */
  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.close();
  }
}
