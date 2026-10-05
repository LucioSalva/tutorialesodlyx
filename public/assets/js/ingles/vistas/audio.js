/** Vista: elegir acento y velocidad del audio pregenerado. */
import { preferencias, fijarPreferencias, cargarConfig } from '../voz.js';

export async function montar() {
  const form = document.querySelector('[data-voz-form]');
  const estado = document.querySelector('[data-voz-estado]');
  const p = preferencias();
  form.acento.value = p.acento;
  form.velocidad.value = String(p.velocidad);
  const pintar = async () => {
    try {
      const c = await cargarConfig();
      const a = c.acentos[form.acento.value];
      estado.textContent = `Suena: ${a.nombre} a ${String(form.velocidad.value).replace('.', ',')}×.`;
    } catch { estado.textContent = 'No se pudo cargar la configuración del audio.'; }
  };
  form.addEventListener('change', () => {
    fijarPreferencias({ acento: form.acento.value, velocidad: Number(form.velocidad.value) });
    pintar();
  });
  pintar();
}
