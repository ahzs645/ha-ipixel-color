/**
 * Form dialog primitive
 *
 * Encapsulates the show/hide pattern used by playlist and schedule cards for
 * their add/edit forms. The card passes a body string and this wraps it in a
 * styled container with Cancel/Save actions.
 */

export function renderFormDialog({
  id = 'form-dialog',
  visible = false,
  body = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitClass = 'btn btn-primary',
  cancelClass = 'btn btn-secondary',
} = {}) {
  return `
    <div class="form-dialog" id="${id}" ${visible ? '' : 'style="display:none;"'}>
      ${body}
      <div class="form-actions">
        <button class="${cancelClass}" data-form-action="cancel">${cancelLabel}</button>
        <button class="${submitClass}" data-form-action="submit">${submitLabel}</button>
      </div>
    </div>`;
}

export function attachFormDialog(root, id, { onCancel, onSubmit } = {}) {
  const form = root.getElementById(id);
  if (!form) return null;
  form.querySelector('[data-form-action="cancel"]')?.addEventListener('click', (e) => {
    form.style.display = 'none';
    onCancel?.(e);
  });
  form.querySelector('[data-form-action="submit"]')?.addEventListener('click', (e) => {
    onSubmit?.(e);
  });
  return {
    show() { form.style.display = 'block'; },
    hide() { form.style.display = 'none'; },
    el: form,
  };
}
