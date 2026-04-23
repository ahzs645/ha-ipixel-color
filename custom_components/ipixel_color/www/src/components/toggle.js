/**
 * Toggle switch primitive
 *
 * Renders the iOS-style switch used across controls, schedule, and gallery.
 */

export function renderToggle({ id, active = false, label, labelRight = false, padding } = {}) {
  const labelHtml = label ? `<span class="toggle-label">${label}</span>` : '';
  const style = padding ? ` style="padding:${padding};"` : '';
  return `
    <div class="toggle-row"${style}>
      ${labelRight ? '' : labelHtml}
      <div class="toggle-switch${active ? ' active' : ''}" id="${id}"></div>
      ${labelRight ? labelHtml : ''}
    </div>`;
}

export function attachToggle(root, id, onChange) {
  const el = root.getElementById(id);
  if (!el) return;
  el.addEventListener('click', (e) => {
    const active = !e.currentTarget.classList.contains('active');
    e.currentTarget.classList.toggle('active', active);
    onChange?.(active, e);
  });
}
