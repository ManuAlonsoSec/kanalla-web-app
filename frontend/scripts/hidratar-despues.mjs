// ──────────────────────────────────────────────────────────────────────────────
// hidratar-despues.mjs — Paso posterior a `ng build` (lo ejecuta `npm run build`).
//
// En las páginas prerenderizadas de la home (/ y /reservas) el navegador pinta
// primero el HTML (logo, titular, carta y botones de pedido, que funcionan sin JS)
// y descarga Angular justo después. Arranca con lo primero que pase:
//   · el navegador informa de que ya pintó el hero (su LCP: el titular o el logo),
//   · el usuario toca la pantalla o pulsa una tecla,
//   · 1,5 s después de `load`, o 3 s en total.
// Así el primer pintado no espera a evaluar el JavaScript. Medido con el hero del
// logo (Lighthouse móvil, 3 pasadas): 99 con este paso y 93 sin él.
//
// · Los toques anteriores a la hidratación (un «+», abrir alérgenos) los guarda la
//   repetición de eventos de Angular (script ng-event-dispatch-contract del HTML).
// · El admin y las páginas legales (index.csr.html) no se tocan.
// · Si el formato de Angular cambia y no encuentra las etiquetas, avisa y no toca nada.
// ──────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BROWSER = resolve(root, 'dist/kanalla/browser');
const PAGINAS = ['index.html', 'reservas/index.html'];

const MAIN = /<script src="(main-[A-Za-z0-9]+\.js)" type="module"><\/script>/;
const MODULEPRELOAD = /<link rel="modulepreload" href="[^"]+\.js">/g;

for (const pagina of PAGINAS) {
  const file = resolve(BROWSER, pagina);
  if (!existsSync(file)) {
    console.warn(`hidratar-despues: no existe ${pagina}`);
    continue;
  }
  let html = readFileSync(file, 'utf8');
  const m = MAIN.exec(html);
  if (!m) {
    console.warn(`hidratar-despues: ${pagina} sin <script main> reconocible; se deja como está`);
    continue;
  }
  const cargador =
    `<script type="module">` +
    `let h=0;const u=()=>{h||(h=1,setTimeout(()=>import("/${m[1]}")))};` +
    `try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.element&&e.element.closest(".hero"))u()})` +
    `.observe({type:"largest-contentful-paint",buffered:!0})}catch(e){u()}` +
    `for(const t of["pointerdown","keydown"])addEventListener(t,u,{once:!0,capture:!0,passive:!0});` +
    `addEventListener("load",()=>setTimeout(u,1500),{once:!0});setTimeout(u,3e3)` +
    `</script>`;
  html = html.replace(m[0], cargador).replace(MODULEPRELOAD, '');
  writeFileSync(file, html);
  console.log(`hidratar-despues: ${pagina} → Angular tras la carga (${m[1]})`);
}
