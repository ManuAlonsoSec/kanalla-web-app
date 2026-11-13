import { TestBed } from '@angular/core/testing';
import { AHORRO_MAX, BURGERS_COMBO, ComandaService, ahorroCombo, comboKey } from './comanda.service';

const STORAGE_KEY = 'kanalla_comanda_v1';

describe('ComandaService', () => {
  let comanda: ComandaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    comanda = TestBed.inject(ComandaService);
  });

  it('apunta, suma cantidades y calcula el total orientativo', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.apuntar('racion-de-patatas');
    expect(comanda.unidades()).toBe(3);
    expect(comanda.total()).toBe(1400 * 2 + 400);
    expect(comanda.porPlato().get('la-puerca')).toBe(2);
  });

  it('ignora ids que no existen', () => {
    comanda.apuntar('no-existe');
    comanda.apuntar('combo-sofa:la-puerca'); // falta una burger
    comanda.apuntar('combo-sofa:menu-infantil+la-puerca'); // excluida del combo
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

  it('el Combo Sofá cuesta 35 € y la clave no depende del orden', () => {
    expect(comboKey(['la-puerca', 'la-kanalla'])).toBe(comboKey(['la-kanalla', 'la-puerca']));
    comanda.apuntar(comboKey(['la-puerca', 'la-kanalla']));
    comanda.apuntar(comboKey(['la-kanalla', 'la-puerca']));
    expect(comanda.lineas().length).toBe(1);
    expect(comanda.combos()).toBe(2);
    expect(comanda.total()).toBe(7000);
  });

  it('el ahorro del combo nunca supera el máximo anunciado (7 €)', () => {
    expect(AHORRO_MAX).toBe(700);
    for (const a of BURGERS_COMBO) {
      for (const b of BURGERS_COMBO) {
        const ahorro = ahorroCombo([a.id, b.id]);
        expect(ahorro, `${a.id}+${b.id}`).toBeGreaterThan(0);
        expect(ahorro, `${a.id}+${b.id}`).toBeLessThanOrEqual(AHORRO_MAX);
      }
    }
  });

  it('el mensaje de WhatsApp lleva platos, cantidades, COMBO SOFÁ, total y «Dirección: »', () => {
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    comanda.apuntar(comboKey(['la-puerca', 'la-kanalla']));
    comanda.apuntar('hamburguesa-del-mes');
    const m = comanda.mensaje();
    expect(m).toContain('2 x La Puerca: 28,00€');
    expect(m).toContain('1 x COMBO SOFÁ (La Kanalla + La Puerca, ración de patatas y tequeños): 35,00€');
    expect(m).toContain('precio a consultar');
    expect(m).toContain('Total orientativo: 63,00€ + lo que haya que consultar');
    expect(m.endsWith('Dirección: ')).toBe(true);
    expect(comanda.whatsapp()).toMatch(/^https:\/\/wa\.me\/34668569390\?text=Hola%20Kanalla/);
    expect(decodeURIComponent(comanda.whatsapp().split('text=')[1])).toBe(m);
  });

  it('sin nada apuntado, el mensaje es un saludo', () => {
    expect(comanda.mensaje()).toBe('Hola Kanalla, quiero hacer un pedido a domicilio.');
  });

  it('guarda en el navegador solo ids y cantidades, y lo recupera con los precios de la carta', () => {
    comanda.restaurar();
    comanda.apuntar('la-puerca');
    comanda.apuntar('la-puerca');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([{ key: 'la-puerca', cantidad: 2 }]);

    TestBed.resetTestingModule();
    const otra = TestBed.inject(ComandaService);
    otra.restaurar();
    expect(otra.total()).toBe(2800);
  });

  it('descarta lo guardado si está corrupto o trae platos que ya no existen', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json');
    comanda.restaurar();
    expect(comanda.lineas().length).toBe(0);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ key: 'plato-retirado', cantidad: 2 }, { key: 'la-puerca', cantidad: 999 }, { key: 'la-puerca', cantidad: 1 }, null, 7]),
    );
    TestBed.resetTestingModule();
    const otra = TestBed.inject(ComandaService);
    otra.restaurar();
    expect(otra.lineas().map((l) => [l.key, l.cantidad])).toEqual([['la-puerca', 20]]);
  });
});
