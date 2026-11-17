import { TestBed } from '@angular/core/testing';
import { LOCAL } from '../../../../data/datos';
import {
  AHORRO_MAX,
  BURGERS_COMBO,
  ComandaService,
  EXTRAS,
  INICIO_PEDIDO,
  SALUDO,
  ahorroCombo,
  comboKey,
  precioCombo,
} from './comanda.service';

const STORAGE_KEY = 'kanalla_comanda_v1';
const ZONA_KEY = 'kanalla_zona_v1';

describe('ComandaService', () => {
  let comanda: ComandaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    comanda = TestBed.inject(ComandaService);
  });

  it('apunta, suma cantidades y separa productos, envío y total', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.apuntar('racion-de-patatas');
    expect(comanda.unidades()).toBe(3);
    expect(comanda.subtotal()).toBe(1400 * 2 + 400);
    expect(comanda.envio()).toBe(200);
    expect(comanda.total()).toBe(1400 * 2 + 400 + 200);
    expect(comanda.porPlato().get('la-puerca')).toBe(2);
  });

  it('sin nada apuntado no hay envío ni total', () => {
    expect(comanda.envio()).toBe(0);
    expect(comanda.total()).toBe(0);
    expect(comanda.puedeEnviar()).toBe(false);
    expect(comanda.aviso()).toBeNull();
  });

  it('ignora ids que no existen', () => {
    comanda.apuntar('no-existe');
    comanda.apuntar('combo-sofa:la-puerca'); // falta una burger
    comanda.apuntar('combo-sofa:menu-infantil+la-puerca'); // excluida del combo
    comanda.apuntar('combo-sofa:hamburguesa-del-mes+la-puerca'); // excluida del combo
    expect(comanda.lineas().length).toBe(0);
  });

  it('quita de una en una y borra la línea al llegar a cero', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.quitar('la-puerca');
    expect(comanda.porPlato().get('la-puerca')).toBe(1);
    comanda.quitar('la-puerca');
    expect(comanda.lineas().length).toBe(0);
  });

  it('no pasa de 20 unidades por línea', () => {
    for (let i = 0; i < 25; i++) comanda.apuntar('la-puerca');
    expect(comanda.unidades()).toBe(20);
  });

  it('vacía y deshace', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('racion-de-patatas');
    comanda.vaciar();
    expect(comanda.lineas().length).toBe(0);
    expect(comanda.puedeDeshacer()).toBe(true);
    comanda.deshacer();
    expect(comanda.unidades()).toBe(2);
    expect(comanda.puedeDeshacer()).toBe(false);
  });

  // ── Combo Sofá ──────────────────────────────────────────────────────────────
  it('en el combo entran siete burgers; no la del mes ni el menú infantil', () => {
    expect(BURGERS_COMBO.map((p) => p.id).sort()).toEqual(
      ['la-bribona', 'la-clasica', 'la-kanalla', 'la-necesaria-vegana', 'la-puerca', 'la-ramona-2-0', 'la-sinverguenza'].sort(),
    );
  });

  it('el combo cuesta 35 €, 36 € o 37 € según las burgers', () => {
    expect(precioCombo(['la-kanalla', 'la-bribona'])).toBe(3500);
    expect(precioCombo(['la-ramona-2-0', 'la-necesaria-vegana'])).toBe(3500);
    expect(precioCombo(['la-sinverguenza', 'la-sinverguenza'])).toBe(3500); // se puede repetir
    expect(precioCombo(['la-puerca', 'la-kanalla'])).toBe(3600);
    expect(precioCombo(['la-clasica', 'la-bribona'])).toBe(3600);
    expect(precioCombo(['la-puerca', 'la-clasica'])).toBe(3700);
    expect(precioCombo(['la-puerca', 'la-puerca'])).toBe(3700);
  });

  it('la clave del combo no depende del orden de las burgers', () => {
    expect(comboKey(['la-puerca', 'la-kanalla'])).toBe(comboKey(['la-kanalla', 'la-puerca']));
    comanda.apuntar(comboKey(['la-puerca', 'la-kanalla']));
    comanda.apuntar(comboKey(['la-kanalla', 'la-puerca']));
    expect(comanda.lineas().length).toBe(1);
    expect(comanda.combos()).toBe(2);
    expect(comanda.subtotal()).toBe(7200);
  });

  it('el ahorro es carta (burgers + patatas 4 € + tequeños 12 €) menos el precio del combo', () => {
    expect(ahorroCombo(['la-kanalla', 'la-kanalla'])).toBe(1350 * 2 + 400 + 1200 - 3500); // 8,00 €
    expect(ahorroCombo(['la-puerca', 'la-clasica'])).toBe(1400 + 1350 + 400 + 1200 - 3700); // 6,50 €
    expect(ahorroCombo(['la-bribona', 'la-bribona'])).toBe(1250 * 2 + 400 + 1200 - 3500); // 6,00 €
  });

  it('«Te ahorras hasta» es el máximo posible con las burgers permitidas', () => {
    let max = 0;
    for (const a of BURGERS_COMBO) for (const b of BURGERS_COMBO) max = Math.max(max, ahorroCombo([a.id, b.id]));
    expect(AHORRO_MAX).toBe(max);
    expect(AHORRO_MAX).toBe(800);
  });

  // ── Zona, pedido mínimo y envío ─────────────────────────────────────────────
  it('sin zona no se puede mandar', () => {
    comanda.apuntar(comboKey(['la-puerca', 'la-clasica']));
    expect(comanda.puedeEnviar()).toBe(false);
    expect(comanda.aviso()).toBe('Elige tu zona de reparto para mandar el pedido.');
  });

  it('solo acepta zonas de reparto reales', () => {
    comanda.elegirZona('Madrid');
    expect(comanda.zona()).toBeNull();
    comanda.elegirZona('Colmenarejo');
    expect(comanda.zona()).toBe('Colmenarejo');
    comanda.elegirZona(null);
    expect(comanda.zona()).toBeNull();
  });

  it('el mínimo se calcula sobre los productos, sin el envío', () => {
    comanda.elegirZona('Galapagar'); // mínimo 20 €
    comanda.apuntar('la-kanalla'); // 13,50
    comanda.apuntar('racion-de-patatas'); // 4,00 → 17,50 de productos, 19,50 con envío
    expect(comanda.total()).toBe(1950);
    expect(comanda.falta()).toBe(250);
    expect(comanda.puedeEnviar()).toBe(false);
    comanda.apuntar('pepsi'); // 2,50 → 20,00 justos
    expect(comanda.falta()).toBe(0);
    expect(comanda.puedeEnviar()).toBe(true);
    expect(comanda.aviso()).toBeNull();
  });

  it('mínimos: Galapagar 20 €, Colmenarejo 30 €, Torrelodones 40 €, Collado Villalba 40 €', () => {
    const minimos: Record<string, number> = {};
    for (const z of ['Galapagar', 'Colmenarejo', 'Torrelodones', 'Collado Villalba']) {
      comanda.elegirZona(z);
      minimos[z] = comanda.minimo();
    }
    expect(minimos).toEqual({ Galapagar: 2000, Colmenarejo: 3000, Torrelodones: 4000, 'Collado Villalba': 4000 });
  });

  // ── Criterios de aceptación ─────────────────────────────────────────────────
  it('ACEPTACIÓN: combo La Puerca + La Clásica a Colmenarejo → 37,00 €, envío 2,00 €, total 39,00 €', () => {
    comanda.apuntar(comboKey(['la-puerca', 'la-clasica']));
    comanda.elegirZona('Colmenarejo');
    expect(comanda.lineas()[0].precio).toBe(3700);
    expect(comanda.envio()).toBe(200);
    expect(comanda.total()).toBe(3900);
    expect(comanda.puedeEnviar()).toBe(true);
    expect(comanda.mensaje()).toBe(
      [
        'Hola Kanalla, quiero hacer un pedido a domicilio:',
        '',
        '1 x COMBO SOFÁ (La Clásica +1€ + La Puerca +1€, ración de patatas y tequeños): 37,00€',
        '',
        'Zona: Colmenarejo',
        'Envío: 2,00€',
        'Total orientativo: 39,00€',
        '',
        'Dirección: ',
      ].join('\n'),
    );
  });

  it('ACEPTACIÓN: combo La Kanalla + La Bribona a Torrelodones → 35,00 €, faltan 5,00 € y no se puede mandar', () => {
    comanda.apuntar(comboKey(['la-kanalla', 'la-bribona']));
    comanda.elegirZona('Torrelodones');
    expect(comanda.lineas()[0].precio).toBe(3500);
    expect(comanda.aviso()).toBe('Te faltan 5,00 € para el mínimo de Torrelodones');
    expect(comanda.puedeEnviar()).toBe(false);
  });

  it('ACEPTACIÓN: el mensaje del ejemplo sale tal cual (combo + La Kanalla a Colmenarejo)', () => {
    comanda.apuntar(comboKey(['la-clasica', 'la-puerca']));
    comanda.apuntar('la-kanalla');
    comanda.elegirZona('Colmenarejo');
    expect(comanda.mensaje()).toBe(
      [
        'Hola Kanalla, quiero hacer un pedido a domicilio:',
        '',
        '1 x COMBO SOFÁ (La Clásica +1€ + La Puerca +1€, ración de patatas y tequeños): 37,00€',
        '1 x La Kanalla: 13,50€',
        '',
        'Zona: Colmenarejo',
        'Envío: 2,00€',
        'Total orientativo: 52,50€',
        '',
        'Dirección: ',
      ].join('\n'),
    );
  });

  // ── Mensaje de WhatsApp ─────────────────────────────────────────────────────
  it('el mensaje empieza exactamente como espera el asistente de pedidos', () => {
    expect(INICIO_PEDIDO).toBe('Hola Kanalla, quiero hacer un pedido a domicilio:');
    comanda.apuntar('la-kanalla');
    expect(comanda.mensaje().startsWith('Hola Kanalla, quiero hacer un pedido a domicilio:\n\n')).toBe(true);
  });

  it('«+1€» solo junto a La Puerca o La Clásica', () => {
    comanda.apuntar(comboKey(['la-puerca', 'la-kanalla']));
    comanda.apuntar(comboKey(['la-bribona', 'la-ramona-2-0']));
    const m = comanda.mensaje();
    expect(m).toContain('1 x COMBO SOFÁ (La Kanalla + La Puerca +1€, ración de patatas y tequeños): 36,00€');
    expect(m).toContain('1 x COMBO SOFÁ (La Bribona + La Ramona 2.0, ración de patatas y tequeños): 35,00€');
  });

  it('lleva cantidades, lo que está a consultar y el enlace de WhatsApp', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.apuntar('hamburguesa-del-mes');
    comanda.elegirZona('Galapagar');
    const m = comanda.mensaje();
    expect(m).toContain('2 x La Puerca: 28,00€');
    expect(m).toContain('1 x Hamburguesa del mes: precio a consultar');
    expect(m).toContain('Total orientativo: 30,00€ + lo que haya que consultar');
    expect(m.endsWith('Dirección: ')).toBe(true);
    expect(comanda.whatsapp()).toMatch(/^https:\/\/wa\.me\/34668569390\?text=Hola%20Kanalla/);
    expect(decodeURIComponent(comanda.whatsapp().split('text=')[1])).toBe(m);
  });

  it('sin comanda, el mensaje es exactamente el saludo que reconoce el asistente (sin dos puntos ni productos)', () => {
    expect(SALUDO).toBe('Hola Kanalla, quiero hacer un pedido a domicilio');
    expect(comanda.mensaje()).toBe('Hola Kanalla, quiero hacer un pedido a domicilio');
    expect(decodeURIComponent(comanda.whatsapp().split('text=')[1])).toBe('Hola Kanalla, quiero hacer un pedido a domicilio');
    // El talón «Pide directo» y la barra del móvil usan el mismo saludo
    expect(decodeURIComponent(LOCAL.whatsapp.href.split('text=')[1])).toBe('Hola Kanalla, quiero hacer un pedido a domicilio');
    expect(LOCAL.whatsapp.href.startsWith('https://wa.me/34668569390?text=')).toBe(true);
  });

  // ── Extras: siempre con su burger ───────────────────────────────────────────
  it('los extras de burger son carne, huevo/bacon, aguacate, queso y pan sin gluten', () => {
    expect(EXTRAS.map((p) => p.id)).toEqual(['carne', 'huevo-bacon', 'aguacate', 'queso', 'pan-sin-gluten']);
  });

  it('un extra no se puede apuntar suelto', () => {
    for (const e of EXTRAS) comanda.apuntar(e.id);
    expect(comanda.lineas().length).toBe(0);
  });

  it('solo las hamburguesas admiten extras', () => {
    comanda.apuntar('tequenos~queso');
    comanda.apuntar('la-kanalla~tequenos');
    comanda.apuntar('la-kanalla~queso.queso');
    expect(comanda.lineas().length).toBe(0);
    comanda.apuntar('tequenos');
    expect(comanda.lineas()[0].burgers).toEqual([]);
    comanda.alternarExtra('tequenos', 0, 'queso');
    expect(comanda.lineas().map((l) => l.key)).toEqual(['tequenos']);
  });

  it('el extra va con su burger: nombre, precio y mensaje', () => {
    comanda.apuntar('la-ramona-2-0');
    comanda.alternarExtra('la-ramona-2-0', 0, 'queso');
    const l = comanda.lineas()[0];
    expect(l.key).toBe('la-ramona-2-0~queso');
    expect(l.precio).toBe(1270 + 150);
    expect(l.detalle).toBe('+ extra de queso');
    expect(comanda.mensaje()).toContain('1 x La Ramona 2.0 (+ extra de queso): 14,20€');
    // y se quita igual
    comanda.alternarExtra('la-ramona-2-0~queso', 0, 'queso');
    expect(comanda.lineas()[0].key).toBe('la-ramona-2-0');
    expect(comanda.mensaje()).toContain('1 x La Ramona 2.0: 12,70€');
  });

  it('varios extras en la misma burger, en el orden de la carta', () => {
    comanda.apuntar('la-kanalla');
    comanda.alternarExtra('la-kanalla', 0, 'pan-sin-gluten');
    comanda.alternarExtra('la-kanalla~pan-sin-gluten', 0, 'carne');
    comanda.alternarExtra('la-kanalla~carne.pan-sin-gluten', 0, 'aguacate');
    expect(comanda.lineas()[0].key).toBe('la-kanalla~carne.aguacate.pan-sin-gluten');
    expect(comanda.lineas()[0].precio).toBe(1350 + 600 + 200 + 100);
    expect(comanda.mensaje()).toContain('1 x La Kanalla (+ extra de carne, extra de aguacate y pan sin gluten): 22,50€');
  });

  it('el extra vale para todas las unidades de la línea y conserva la línea', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    const uid = comanda.lineas()[0].uid;
    comanda.alternarExtra('la-puerca', 0, 'queso');
    expect(comanda.lineas().length).toBe(1);
    expect(comanda.lineas()[0].uid).toBe(uid);
    expect(comanda.lineas()[0].cantidad).toBe(2);
    expect(comanda.subtotal()).toBe((1400 + 150) * 2);
    expect(comanda.porPlato().get('la-puerca')).toBe(2);
    expect(comanda.mensaje()).toContain('2 x La Puerca (+ extra de queso): 31,00€');
  });

  it('una burger con extra y otra sin él son dos líneas; si quedan iguales, se juntan', () => {
    comanda.apuntar('la-puerca');
    comanda.alternarExtra('la-puerca', 0, 'queso');
    comanda.apuntar('la-puerca');
    expect(comanda.lineas().map((l) => [l.key, l.cantidad])).toEqual([['la-puerca~queso', 1], ['la-puerca', 1]]);
    comanda.alternarExtra('la-puerca', 0, 'queso');
    expect(comanda.lineas().map((l) => [l.key, l.cantidad])).toEqual([['la-puerca~queso', 2]]);
  });

  it('en el combo, cada burger lleva sus extras', () => {
    comanda.apuntar(comboKey(['la-puerca', 'la-clasica']));
    const key = comanda.lineas()[0].key;
    expect(comanda.lineas()[0].burgers.map((b) => b.nombre)).toEqual(['La Clásica', 'La Puerca']);
    comanda.alternarExtra(key, 1, 'queso');
    const l = comanda.lineas()[0];
    expect(l.key).toBe('combo-sofa:la-clasica+la-puerca~queso');
    expect(l.precio).toBe(3700 + 150);
    expect(comanda.mensaje()).toContain(
      '1 x COMBO SOFÁ (La Clásica +1€ + La Puerca +1€ con extra de queso, ración de patatas y tequeños): 38,50€',
    );
  });

  it('ACEPTACIÓN: ningún extra aparece como línea suelta en el mensaje', () => {
    comanda.apuntar(comboKey(['la-kanalla', 'la-bribona']));
    comanda.apuntar('la-puerca');
    comanda.apuntar('racion-de-patatas');
    comanda.alternarExtra(comanda.lineas()[0].key, 0, 'aguacate');
    comanda.alternarExtra('la-puerca', 0, 'carne');
    comanda.alternarExtra('la-puerca~carne', 0, 'huevo-bacon');
    comanda.elegirZona('Galapagar');
    const productos = comanda
      .mensaje()
      .split('\n')
      .filter((l) => /^\d+ x /.test(l));
    expect(productos).toEqual([
      '1 x COMBO SOFÁ (La Bribona con extra de aguacate + La Kanalla, ración de patatas y tequeños): 37,00€',
      '1 x La Puerca (+ extra de carne y extra de huevo o bacon): 21,50€',
      '1 x Ración de patatas: 4,00€',
    ]);
    for (const l of productos) expect(l).not.toMatch(/^\d+ x (Extra|Pan sin gluten|Carne|Queso|Aguacate|Huevo)/i);
  });

  it('ACEPTACIÓN: el mensaje del brief sale tal cual (combo con extra + La Ramona 2.0 con extra, a Colmenarejo)', () => {
    comanda.apuntar(comboKey(['la-clasica', 'la-puerca']));
    comanda.alternarExtra(comanda.lineas()[0].key, 1, 'queso');
    comanda.apuntar('la-ramona-2-0');
    comanda.alternarExtra('la-ramona-2-0', 0, 'queso');
    comanda.elegirZona('Colmenarejo');
    expect(comanda.mensaje()).toBe(
      [
        'Hola Kanalla, quiero hacer un pedido a domicilio:',
        '',
        '1 x COMBO SOFÁ (La Clásica +1€ + La Puerca +1€ con extra de queso, ración de patatas y tequeños): 38,50€',
        '1 x La Ramona 2.0 (+ extra de queso): 14,20€',
        '',
        'Zona: Colmenarejo',
        'Envío: 2,00€',
        'Total orientativo: 54,70€',
        '',
        'Dirección: ',
      ].join('\n'),
    );
  });

  // ── Guardado en el navegador ────────────────────────────────────────────────
  it('guarda solo ids, cantidades y zona, y lo recupera con los precios de la carta', () => {
    comanda.restaurar();
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.alternarExtra('la-puerca', 0, 'queso');
    comanda.elegirZona('Torrelodones');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([{ key: 'la-puerca~queso', cantidad: 2 }]);
    expect(localStorage.getItem(ZONA_KEY)).toBe('Torrelodones');

    TestBed.resetTestingModule();
    const otra = TestBed.inject(ComandaService);
    otra.restaurar();
    expect(otra.subtotal()).toBe(3100);
    expect(otra.zona()).toBe('Torrelodones');
    expect(otra.falta()).toBe(900);
    expect(otra.lineas()[0].burgers[0].extras).toEqual(['queso']);
  });

  it('descarta lo guardado si está corrupto o trae platos o zonas que ya no existen', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json');
    comanda.restaurar();
    expect(comanda.lineas().length).toBe(0);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { key: 'plato-retirado', cantidad: 2 },
        { key: 'la-puerca', cantidad: 999 },
        { key: 'la-puerca', cantidad: 1 },
        { key: 'queso', cantidad: 1 }, // extra suelto de una comanda guardada con la versión anterior
        null,
        7,
      ]),
    );
    localStorage.setItem(ZONA_KEY, 'Majadahonda');
    TestBed.resetTestingModule();
    const otra = TestBed.inject(ComandaService);
    otra.restaurar();
    expect(otra.lineas().map((l) => [l.key, l.cantidad])).toEqual([['la-puerca', 20]]);
    expect(otra.zona()).toBeNull();
  });
});
