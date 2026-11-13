# Kanalla Skybar · web

Web de una sola página de Kanalla Skybar (Galapagar): pedido directo a domicilio por WhatsApp o teléfono, carta con comanda, Combo Sofá y reservas de terraza. Angular 21 prerenderizado y desplegado en Vercel; Supabase para las reservas y el panel de admin.

Qué es la web y para quién está en [PRODUCT.md](PRODUCT.md).

## Desarrollo

```bash
cd frontend
npm install
npm start          # http://localhost:4200
npm run build      # ng build + scripts/hidratar-despues.mjs → dist/kanalla/browser
```

Hay que usar `npm run build`, no `ng build` a secas: el paso `hidratar-despues.mjs` hace que la home pinte antes de cargar Angular. Vercel ya lo ejecuta así (ver `vercel.json`).

- **Variables de Supabase:** van en `.env.local` (no se sube) y las lee `frontend/set-env.mjs`. Ver `.env.example`.
- **Carta, precios y Combo Sofá:** `frontend/src/data/carta.json`.
- **Teléfono, horario, zonas, pedido mínimo y envío:** `frontend/src/data/local.json`.
- **Fotos:**
  - `node scripts/optimize-images.mjs` genera las versiones optimizadas.
  - `node scripts/recortar-fotos.mjs` genera los recortes a tijera.
  - Los originales no se tocan y viven **fuera del repo**, en `../kanalla-originales/` (o donde diga `KANALLA_ORIGINALES`; ver `scripts/originales.mjs`). En `public/` solo van las versiones optimizadas que la web usa. Sin esa carpeta la web compila igual: solo hace falta para regenerar fotos. No está en git, así que conviene tener copia.
  - `node scripts/vectorize-logo.mjs` genera las capas del logo: pequeñas para el pie y grandes (`-420`, `-748`) para el hero.
- **`docs/`:** solo se suben los `.md`. Capturas, maquetas y salidas del detector se quedan en local.

## Skills de diseño (Claude Code)

El rediseño se hizo con tres skills de agente:

| Skill | Para qué |
|---|---|
| `impeccable` | Contexto de diseño, crítica, auditoría y el detector de anti-patrones. |
| `design-taste-frontend` | Criterio anti-«hecho con IA». |
| `emil-design-eng` | Curvas, duraciones y microinteracciones. |

**Qué se sube y qué no:**

- Las skills no se suben: `.claude/skills/` y `.agents/skills/` están en `.gitignore`.
- Sí se suben `skills-lock.json`, que fija las versiones, y `.impeccable/`, la configuración del detector.

**Para reinstalarlas en la raíz del repo**, restaura desde `skills-lock.json`:

```bash
npx -y skills install --agent claude-code
```

El comando `install` (alias de `experimental_install`) es experimental en la CLI. Si falla, instálalas una a una:

```bash
npx -y skills add pbakaus/impeccable --skill impeccable --agent claude-code -y
npx -y skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend --agent claude-code -y
npx -y skills add emilkowalski/skills --skill emil-design-eng --agent claude-code -y
```

**Al reinstalar, ten en cuenta:**

- **Solo `emil-design-eng`** del repo de Emil: trae 18 skills y su `animate` choca con otra del mismo nombre.
- **`frontend-design` desactivada** mientras se usan estas, para que no se pisen.
- **Impeccable** descarga su motor la primera vez y lo verifica con suma SHA-256.

Detector de Impeccable, con las excepciones de `.impeccable/config.json`:

```bash
./.claude/skills/impeccable/scripts/impeccable detect --json frontend/src/app frontend/src/index.html
./.claude/skills/impeccable/scripts/impeccable detect --json --viewport 390x844 http://localhost:4300/
```

Por qué hay reglas ignoradas: [.impeccable/README.md](.impeccable/README.md).
