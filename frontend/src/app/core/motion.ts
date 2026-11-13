// ──────────────────────────────────────────────────────────────────────────────
// Movimiento de la web pública (emil-design-eng). Ya no hay revelados al hacer
// scroll ni progresos ligados al scroll: lo poco que se mueve es CSS (pulsación,
// hover, llamas del logo, barra y hoja) o Web Animations en respuesta a una acción
// (el ticket al apuntar). Todo respeta «reducir movimiento».
// ──────────────────────────────────────────────────────────────────────────────

export function prefersReducedMotion(win: Window): boolean {
  return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
