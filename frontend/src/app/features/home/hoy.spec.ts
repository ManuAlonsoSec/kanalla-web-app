import { horarioDeHoy } from './hoy';

describe('horarioDeHoy', () => {
  it('los lunes descansamos', () => {
    expect(horarioDeHoy(new Date('2026-11-16T12:00:00+01:00'))).toEqual({ dia: 'lunes', texto: 'Los lunes descansamos', abierto: false });
  });

  it('de martes a jueves, solo cenas', () => {
    expect(horarioDeHoy(new Date('2026-11-19T12:00:00+01:00')).texto).toBe('19:00–23:30');
  });

  it('el fin de semana, dos turnos', () => {
    expect(horarioDeHoy(new Date('2026-11-21T12:00:00+01:00')).texto).toBe('12:00–16:00 y 19:00–00:00');
  });

  it('usa la hora de Madrid, no la del navegador', () => {
    // Domingo 23:30 en Madrid = lunes para quien esté en Tokio
    expect(horarioDeHoy(new Date('2026-11-15T22:30:00Z')).dia).toBe('domingo');
    // Lunes 00:30 en Madrid = todavía domingo en UTC
    expect(horarioDeHoy(new Date('2026-11-15T23:30:00Z')).dia).toBe('lunes');
  });
});
