import { LOCAL } from '../../../data/datos';
import { buildRestaurantJsonLd } from './seo';
import { horarioDeHoy } from './hoy';

// Horario oficial (manda el del asistente de pedidos):
//   Lunes cerrado · Martes a jueves 19:45–23:00 · Viernes y sábado 13:00–15:30 y
//   19:45–23:30 · Domingo 13:00–15:30 y 19:45–23:00
const SEMANA: Record<string, string> = {
  '2026-11-16': 'Los lunes descansamos',
  '2026-11-17': '19:45–23:00',
  '2026-11-18': '19:45–23:00',
  '2026-11-19': '19:45–23:00',
  '2026-11-20': '13:00–15:30 y 19:45–23:30',
  '2026-11-21': '13:00–15:30 y 19:45–23:30',
  '2026-11-22': '13:00–15:30 y 19:45–23:00',
};

describe('horario', () => {
  it('la cabecera «Hoy» dice el horario oficial cada día de la semana', () => {
    for (const [fecha, texto] of Object.entries(SEMANA)) {
      expect(horarioDeHoy(new Date(`${fecha}T12:00:00+01:00`)).texto, fecha).toBe(texto);
    }
    expect(horarioDeHoy(new Date('2026-11-16T12:00:00+01:00'))).toEqual({ dia: 'lunes', texto: 'Los lunes descansamos', abierto: false });
  });

  it('el pie dice lo mismo que la cabecera', () => {
    const pie = Object.fromEntries(LOCAL.horario.map((h) => [h.dias, h.turnos.join(' y ')]));
    expect(pie).toEqual({
      Lunes: '',
      'Martes a jueves': '19:45–23:00',
      'Viernes y sábado': '13:00–15:30 y 19:45–23:30',
      Domingo: '13:00–15:30 y 19:45–23:00',
    });
  });

  it('el JSON-LD dice lo mismo que la cabecera', () => {
    const spec = buildRestaurantJsonLd()['openingHoursSpecification'] as { dayOfWeek: string[]; opens: string; closes: string }[];
    const porDia = new Map<string, string[]>();
    for (const s of spec) {
      for (const d of s.dayOfWeek) {
        const dia = d.replace('https://schema.org/', '');
        porDia.set(dia, [...(porDia.get(dia) ?? []), `${s.opens}–${s.closes}`]);
      }
    }
    expect(Object.fromEntries([...porDia].map(([d, t]) => [d, t.join(' y ')]))).toEqual({
      Tuesday: '19:45–23:00',
      Wednesday: '19:45–23:00',
      Thursday: '19:45–23:00',
      Friday: '13:00–15:30 y 19:45–23:30',
      Saturday: '13:00–15:30 y 19:45–23:30',
      Sunday: '13:00–15:30 y 19:45–23:00',
    });
    expect(porDia.has('Monday')).toBe(false);
  });

  it('usa la hora de Madrid, no la del navegador', () => {
    expect(horarioDeHoy(new Date('2026-11-15T22:30:00Z')).dia).toBe('domingo');
    expect(horarioDeHoy(new Date('2026-11-15T23:30:00Z')).dia).toBe('lunes');
  });
});
