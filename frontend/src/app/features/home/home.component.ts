import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location, isPlatformServer } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { BookingComponent } from '../booking/booking.component';
import { prefersReducedMotion } from '../../core/motion';
import { buildRestaurantJsonLd } from './seo';
import { LOCAL } from '../../../data/datos';
import { SiteHeaderComponent } from './header/site-header.component';
import { HeroComponent } from './hero/hero.component';
import { ComboComponent } from './combo/combo.component';
import { CartaComponent } from './carta/carta.component';
import { TicketComponent } from './comanda/ticket.component';
import { ComandaService } from './comanda/comanda.service';
import { ManifiestoComponent } from './manifiesto/manifiesto.component';
import { AlergenosComponent } from './alergenos/alergenos.component';
import { SiteFooterComponent } from './footer/site-footer.component';
import { BarraPedidoComponent } from './barra-pedido/barra-pedido.component';

/** Misma clave que usa BookingComponent para guardar la reserva mientras se hace login. */
const PENDING_RESERVATION_KEY = 'kanalla_pending_reservation';

/** Anclas internas que se limpian de la URL (nunca se toca otro hash: el login de Google usa el suyo). */
const SECCIONES = ['inicio', 'combo', 'carta', 'comanda', 'reservas', 'contacto', 'alergenos'];
/** Anclas antiguas → nuevas */
const ALIAS: Record<string, string> = { pide: 'carta', terraza: 'reservas' };

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'home', '(click)': 'onClick($event)' },
  imports: [
    BookingComponent,
    SiteHeaderComponent,
    HeroComponent,
    ComboComponent,
    CartaComponent,
    TicketComponent,
    ManifiestoComponent,
    AlergenosComponent,
    SiteFooterComponent,
    BarraPedidoComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly comanda = inject(ComandaService);
  protected readonly local = LOCAL;
  protected readonly alergenos = viewChild.required(AlergenosComponent);

  private readonly heroIn = signal(true);
  /** Escritorio: el ticket lateral está a la vista. */
  protected readonly railVisible = signal(false);
  /** El bloque de reservas está a la vista. */
  private readonly reservasIn = signal(false);
  /**
   * Escritorio: la pestaña fija de la comanda sobra cuando ya se ve el ticket lateral,
   * y estorba en el bloque de reservas (pisaba el botón «Confirmar reserva»).
   */
  protected readonly sinPestana = computed(() => this.railVisible() || this.reservasIn());
  /** Barra de pedido (móvil): fuera del hero, o en cuanto hay algo apuntado. */
  protected readonly barShown = computed(() => !this.heroIn() || this.comanda.unidades() > 0);
  /** Carga el formulario ya: vuelta del login, /reservas… */
  protected readonly urgent = signal(false);

  constructor() {
    inject(Title).setTitle('Kanalla Skybar · Burgers a domicilio y terraza en Galapagar');

    // JSON-LD de Restaurant: se escribe en el HTML prerenderizado
    if (isPlatformServer(inject(PLATFORM_ID)) && !this.doc.getElementById('ld-restaurant')) {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'ld-restaurant';
      script.textContent = JSON.stringify(buildRestaurantJsonLd()).replace(/</g, '\\u003c');
      this.doc.head.appendChild(script);
    }

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView!;
      this.comanda.restaurar();
      const observers = this.watchSections(win);
      destroyRef.onDestroy(() => observers.forEach((o) => o.disconnect()));

      const pending = safeSession(win)?.getItem(PENDING_RESERVATION_KEY);
      const seccion: string | undefined = this.route.snapshot.data['seccion'];
      const rawHash = win.location.hash.slice(1);
      const hash = ALIAS[rawHash] ?? rawHash;

      if (pending || hasAuthParams(win) || seccion === 'reservas') this.urgent.set(true);

      // Destino inicial: /reservas, un ancla interna, o vuelta del login con reserva pendiente
      const destino = pending ? 'reservas' : SECCIONES.includes(hash) ? hash : seccion;
      if (destino === 'alergenos') {
        this.alergenos().open();
      } else if (destino && destino !== 'inicio') {
        this.doc.getElementById(destino)?.scrollIntoView({ block: 'start' });
      }
      if (SECCIONES.includes(hash)) this.cleanHash(win);
    });
  }

  /** Enlaces internos (#carta…): desplazamiento suave y foco, sin escribir el # en la URL. */
  protected onClick(e: MouseEvent): void {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    const href = a?.getAttribute('href');
    if (!a || !href) return;

    const win = this.doc.defaultView!;
    const behavior: ScrollBehavior = prefersReducedMotion(win) ? 'auto' : 'smooth';

    if (!href.startsWith('#')) return;
    const id = ALIAS[href.slice(1)] ?? href.slice(1);
    if (id === 'alergenos') {
      e.preventDefault();
      this.alergenos().open();
      return;
    }
    const target = this.doc.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior, block: 'start' });
    if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
  }

  private cleanHash(win: Window): void {
    if (hasAuthParams(win)) return;
    this.location.replaceState(win.location.pathname + win.location.search);
  }

  /**
   * · Barra de pedido: fuera del hero (o con comanda).
   * · Pestaña de la comanda en escritorio: cuando no se ve ni el ticket lateral ni el
   *   bloque de reservas.
   * · URL: `/reservas` mientras se ve el formulario y `/` en el hero. Así el login de
   *   Google vuelve a la misma URL desde la que se envió.
   */
  private watchSections(win: Window): IntersectionObserver[] {
    const root = this.host.nativeElement;
    const hero = root.querySelector('.hero');
    const rail = root.querySelector('.pedir__rail');
    const reservas = root.querySelector('#reservas');
    if (!hero || !rail || !reservas) return [];

    const visible = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) this.heroIn.set(e.isIntersecting);
        if (e.target === rail) this.railVisible.set(e.isIntersecting);
        if (e.target === reservas) this.reservasIn.set(e.isIntersecting);
      }
    });
    visible.observe(hero);
    visible.observe(rail);
    visible.observe(reservas);

    const url = new IntersectionObserver(
      (entries) => {
        if (hasAuthParams(win)) return; // el token del login aún está en la URL: no tocarla
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const path = e.target === reservas ? '/reservas' : '/';
          if (win.location.pathname !== path) this.location.replaceState(path + win.location.search);
        }
      },
      { threshold: 0.2 },
    );
    url.observe(reservas);
    url.observe(hero);

    return [visible, url];
  }
}

/** ¿Hay parámetros del login de Supabase/Google en la URL? (implicit o PKCE) */
function hasAuthParams(win: Window): boolean {
  return (
    /(access_token|refresh_token|error_description|provider_token)=/.test(win.location.hash) ||
    /[?&](code|error)=/.test(win.location.search)
  );
}

function safeSession(win: Window): Storage | null {
  try {
    return win.sessionStorage;
  } catch {
    return null;
  }
}
