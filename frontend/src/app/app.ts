import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class App {
  private readonly doc = inject(DOCUMENT);

  constructor() {
    // El admin mantiene su tema oscuro; las legales usan el kraft con los tokens antiguos.
    // Ninguna carga nada de Google: fuentes de la marca e iconos autoalojados (styles.scss).
    inject(Router)
      .events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects;
        const admin = url.startsWith('/admin');
        const legal = url.startsWith('/privacidad') || url.startsWith('/cookies');
        const body = this.doc.body;
        body.classList.toggle('theme-admin', admin);
        body.classList.toggle('theme-legal', legal);
      });
  }
}
