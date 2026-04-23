/**
 * Slider primitive
 *
 * Renders a <input type="range"> with the iPIXEL fill gradient and a live
 * value label. `attachSlider` wires the --value CSS var and text label.
 */

export function renderSlider({
  id,
  min = 0,
  max = 100,
  value = 50,
  unit = '',
  showValue = true,
  valueFormatter,
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const label = valueFormatter ? valueFormatter(value) : `${value}${unit}`;
  return `
    <div class="slider-row">
      <input type="range" class="slider" id="${id}" min="${min}" max="${max}" value="${value}" style="--value:${pct}%">
      ${showValue ? `<span class="slider-value" id="${id}-val">${label}</span>` : ''}
    </div>`;
}

export function attachSlider(root, id, { onInput, onChange, unit = '', valueFormatter } = {}) {
  const slider = root.getElementById(id);
  if (!slider) return;
  const valEl = root.getElementById(`${id}-val`);
  const min = Number(slider.min);
  const max = Number(slider.max);

  const apply = (raw) => {
    const v = Number(raw);
    const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
    slider.style.setProperty('--value', `${pct}%`);
    if (valEl) valEl.textContent = valueFormatter ? valueFormatter(v) : `${v}${unit}`;
    return v;
  };

  apply(slider.value);

  slider.addEventListener('input', (e) => {
    const v = apply(e.target.value);
    onInput?.(v, e);
  });

  if (onChange) {
    slider.addEventListener('change', (e) => onChange(Number(e.target.value), e));
  }
}
