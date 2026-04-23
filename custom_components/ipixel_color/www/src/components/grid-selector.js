/**
 * Grid selector primitive
 *
 * Renders a grid of clickable buttons with single or multi-select state.
 * Works with existing `.button-grid`, `.mode-btn`, `.effect-btn`, `.day-btn`,
 * `.screen-btn`, etc. styles by accepting class names as options.
 */

export function renderGridSelector(items, {
  selected,
  itemClass = 'mode-btn',
  gridClass = 'button-grid button-grid-3',
  dataAttr = 'value',
  label = (i) => i.name,
  value = (i) => i.value,
  extraClass = () => '',
  title,
} = {}) {
  const isSelected = Array.isArray(selected)
    ? (v) => selected.some((s) => String(s) === String(v))
    : (v) => String(v) === String(selected);

  const body = items.map((item) => {
    const v = value(item);
    const active = isSelected(v) ? ' active' : '';
    const extra = extraClass(item);
    const extraCls = extra ? ` ${extra}` : '';
    const t = title ? ` title="${title(item)}"` : '';
    return `<button class="${itemClass}${active}${extraCls}" data-${dataAttr}="${v}"${t}>${label(item)}</button>`;
  }).join('');

  return `<div class="${gridClass}">${body}</div>`;
}

/**
 * Wire click handlers on a grid.
 * - single: clears `.active` on siblings, sets it on clicked item, calls onSelect(value, el)
 * - multi:  toggles `.active` on clicked item, calls onSelect(value, isActive, el)
 */
export function attachGridSelector(root, selector, { onSelect, multi = false, attr = 'value' } = {}) {
  root.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget;
      const v = el.dataset[attr];
      if (multi) {
        const active = el.classList.toggle('active');
        onSelect?.(v, active, el);
      } else {
        root.querySelectorAll(selector).forEach((b) => b.classList.remove('active'));
        el.classList.add('active');
        onSelect?.(v, el);
      }
    });
  });
}
