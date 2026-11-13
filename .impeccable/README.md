# Configuración de Impeccable

`config.json` es la configuración compartida del detector. Se edita con la CLI (`impeccable hooks ignore-rule …`), no a mano. JSON no admite comentarios, así que los motivos van aquí.

## Reglas ignoradas en todo el proyecto

Las dos las impone la marca. Lo decidió el dueño el 12 de noviembre de 2026.

| Regla | Por qué se ignora |
|---|---|
| `kicker-above-heading` | La carta impresa de Kanalla pone el rótulo pequeño encima del título («CARTA KANALLA» sobre «HAMBURGUESAS»), y la web lo repite. Se usa solo donde el rótulo da información, como «Solo pidiendo directo» sobre «Combo Sofá». |
| `all-caps-body` | La carta impresa compone las descripciones en Barlow Condensed en mayúsculas, con tracking de 0,03 em y un interlineado de 1,3 o más. Es parte del sistema «Carta». |

## Lo que no se ignora

Todo lo demás se arregla. No se añaden excepciones para saltarse un arreglo.

Si el análisis estático del HTML prerenderizado (`detect … dist/…/index.html`) marca avisos, compruébalo en el render real (`detect --viewport …`). Esa pasada no resuelve `clamp()`, `var()`, `cqi` ni el tamaño real del texto, y suele dar falsos positivos de padding, interlineado y contraste.

## Carpetas

- **`critique/`:** críticas guardadas (`critique-storage`), para ver la evolución de la puntuación. Es estado local: Impeccable la deja fuera de git con su propio `.gitignore`.
- **`config.local.json`:** preferencias de cada persona. No se sube.
