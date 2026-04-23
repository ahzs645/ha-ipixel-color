/**
 * Color row primitive
 *
 * Renders one or more labeled color pickers on a single row.
 */

export function renderColorRow(colors) {
  const parts = colors.map((c, i) => {
    const marginLeft = i > 0 ? ' style="margin-left:16px;"' : '';
    return `<span class="color-row-label"${marginLeft}>${c.label}:</span>
      <input type="color" class="color-picker" id="${c.id}" value="${c.value}">`;
  });
  return `<div class="color-row">${parts.join('')}</div>`;
}

export function attachColorRow(root, ids, onInput) {
  ids.forEach((id) => {
    root.getElementById(id)?.addEventListener('input', (e) => onInput?.(id, e.target.value, e));
  });
}
