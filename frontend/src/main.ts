import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Primero se pinta la página prerenderizada (titular, foto y botones de pedido, que
// funcionan sin JS) y después se hidrata Angular: al terminar de cargar la página o,
// como mucho, a los 2,5 s. Los toques de antes (p. ej. un «+») no se pierden: los
// recoge y reproduce la repetición de eventos de la hidratación (withEventReplay).
const arrancar = () => bootstrapApplication(App, appConfig).catch((err) => console.error(err));

if (document.readyState === 'complete') {
  arrancar();
} else {
  let hecho = false;
  const una = () => {
    if (hecho) return;
    hecho = true;
    arrancar();
  };
  addEventListener('load', una, { once: true });
  setTimeout(una, 2500);
}
