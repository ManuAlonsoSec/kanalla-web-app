import { LOCAL } from '../../../data/datos';

const TZ = 'Europe/Madrid';
const PLURAL: Record<string, string> = { sábado: 'sábados', domingo: 'domingos' };

export interface Hoy {
  /** «jueves» */
  dia: string;
  /** «19:00–23:30», «12:00–16:00 y 19:00–00:00» o «Los lunes descansamos» */
  texto: string;
  abierto: boolean;
}

/**
 * Horario de hoy en Galapagar (hora de Madrid), sacado de local.json.
 * Se calcula en el navegador: el HTML prerenderizado no sabe qué día es.
 * El horario de reparto es el mismo que el del local.
 */
export function horarioDeHoy(fecha = new Date()): Hoy {
  const en = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: TZ }).format(fecha);
  const dia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: TZ }).format(fecha);
  const turnos = LOCAL.horarioSchema.filter((h) => h.dias.includes(en)).map((h) => `${h.abre}–${h.cierra}`);
  if (!turnos.length) return { dia, texto: `Los ${PLURAL[dia] ?? dia} descansamos`, abierto: false };
  return { dia, texto: turnos.join(' y '), abierto: true };
}
