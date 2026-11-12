import { CARTA, COMBO, LOCAL, PLATOS, centimos, euros } from './datos';

describe('datos de la carta', () => {
  it('convierte precios a céntimos y de vuelta', () => {
    expect(centimos('14,00€')).toBe(1400);
    expect(centimos('13,50€')).toBe(1350);
    expect(centimos('4€')).toBe(400);
    expect(centimos('Consultar')).toBeNull();
    expect(euros(1350)).toBe('13,50€');
    expect(euros(4100)).toBe('41,00€');
  });

  it('cada plato tiene un id único', () => {
    const ids = CARTA.flatMap((s) => s.platos.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(PLATOS.size).toBe(ids.length);
  });

  it('el combo se compone de platos que existen y tienen precio', () => {
    for (const id of [...COMBO.incluye, ...COMBO.excluidas]) expect(PLATOS.has(id), id).toBe(true);
    for (const id of COMBO.incluye) expect(centimos(PLATOS.get(id)!.precio), id).not.toBeNull();
    expect(centimos(COMBO.precio)).toBe(3500);
  });

  it('el pedido mínimo cubre todas las zonas de reparto, una sola vez', () => {
    const zonas = (LOCAL.pedidoMinimo ?? []).flatMap((m) => m.zonas);
    expect([...zonas].sort()).toEqual([...LOCAL.zonasReparto].sort());
    for (const m of LOCAL.pedidoMinimo ?? []) expect(centimos(m.importe), m.importe).not.toBeNull();
    expect(centimos(LOCAL.gastosEnvio ?? '')).toBe(200);
  });
});
