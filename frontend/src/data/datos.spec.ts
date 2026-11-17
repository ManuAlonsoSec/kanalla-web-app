import { buildRestaurantJsonLd } from '../app/features/home/seo';
import { CARTA, COMBO, LOCAL, PLATOS, centimos, euros, eurosCorto, minimoDe } from './datos';

// Precios del TPV (catálogo «KANALLA PEDIDOS» de Last.app), que es la fuente de verdad.
const TPV: Record<string, number> = {
  tequenos: 1200,
  aguacate: 200,
  queso: 150,
  carne: 600,
  'huevo-bacon': 150,
  'pan-sin-gluten': 100,
  'racion-de-patatas': 400,
  'aros-de-cebolla': 750,
  'tarta-de-manzana': 600,
  pepsi: 250,
  'pepsi-zhero': 250,
  'aquarius-naranja': 250,
  'aquarius-limon': 250,
  nestea: 250,
  'fanta-naranja': 250,
  'fanta-limon': 250,
  'mahou-clasica': 300,
};

describe('datos de la carta', () => {
  it('convierte precios a céntimos y de vuelta', () => {
    expect(centimos('14,00€')).toBe(1400);
    expect(centimos('13,50€')).toBe(1350);
    expect(centimos('4€')).toBe(400);
    expect(centimos('Consultar')).toBeNull();
    expect(euros(1350)).toBe('13,50€');
    expect(euros(4100)).toBe('41,00€');
    expect(eurosCorto(100)).toBe('1€');
    expect(eurosCorto(150)).toBe('1,50€');
  });

  it('cada plato tiene un id único', () => {
    const ids = CARTA.flatMap((s) => s.platos.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(PLATOS.size).toBe(ids.length);
  });

  it('los precios de la carta son los del TPV', () => {
    for (const [id, cents] of Object.entries(TPV)) {
      expect(PLATOS.has(id), id).toBe(true);
      expect(centimos(PLATOS.get(id)!.precio), id).toBe(cents);
    }
  });

  it('aros de cebolla en entrantes, tarta de manzana en postres y la sección de bebidas', () => {
    const sec = (id: string) => CARTA.find((s) => s.id === id)!.platos.map((p) => p.id);
    expect(sec('entrantes')).toContain('aros-de-cebolla');
    expect(PLATOS.get('aros-de-cebolla')!.descripcion).toBe('Aros de cebolla en nuestro rebozado casero.');
    expect(sec('postres')).toContain('tarta-de-manzana');
    expect(sec('bebidas')).toEqual([
      'pepsi', 'pepsi-zhero', 'aquarius-naranja', 'aquarius-limon', 'nestea', 'fanta-naranja', 'fanta-limon', 'mahou-clasica',
    ]);
    const bebidas = CARTA.find((s) => s.id === 'bebidas')!.platos.map((p) => p.nombre).join(' ');
    expect(bebidas).not.toMatch(/agua|schweppes|lipton/i);
  });

  it('la hamburguesa del mes sigue «a consultar»', () => {
    expect(PLATOS.get('hamburguesa-del-mes')!.precio).toBe('Consultar');
  });

  it('el JSON-LD lleva los mismos precios que la carta visible', () => {
    type Item = { name: string; offers?: { price: string; priceCurrency: string } };
    const menu = buildRestaurantJsonLd()['hasMenu'] as { hasMenuSection: { name: string; hasMenuItem: Item[] }[] };
    const enLd = menu.hasMenuSection.flatMap((s) => s.hasMenuItem);
    const enCarta = CARTA.flatMap((s) => s.platos);
    expect(enLd.length).toBe(enCarta.length);
    for (const p of enCarta) {
      const item = enLd.find((i) => i.name === p.nombre)!;
      const cents = centimos(p.precio);
      if (cents === null) expect(item.offers, p.nombre).toBeUndefined();
      else expect(Math.round(Number(item.offers!.price) * 100), p.nombre).toBe(cents);
    }
    expect(menu.hasMenuSection.map((s) => s.name)).toContain('Bebidas');
  });

  it('el combo se compone de platos que existen y tienen precio', () => {
    for (const id of [...COMBO.incluye, ...COMBO.excluidas, ...Object.keys(COMBO.suplementos ?? {})]) expect(PLATOS.has(id), id).toBe(true);
    for (const id of COMBO.incluye) expect(centimos(PLATOS.get(id)!.precio), id).not.toBeNull();
    expect(centimos(COMBO.precio)).toBe(3500);
    expect(COMBO.suplementos).toEqual({ 'la-puerca': '1€', 'la-clasica': '1€' });
  });

  it('pedido mínimo por zona y envío fijo', () => {
    expect(LOCAL.zonasReparto).toEqual(['Galapagar', 'Colmenarejo', 'Torrelodones', 'Collado Villalba']);
    expect(LOCAL.zonasReparto.map(minimoDe)).toEqual([2000, 3000, 4000, 4000]);
    expect(centimos(LOCAL.gastosEnvio ?? '')).toBe(200);
  });
});
