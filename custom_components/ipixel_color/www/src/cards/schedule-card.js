/**
 * iPIXEL Schedule Card
 * Tabbed: Timeline / Power / Content
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState, createStorage } from '../state.js';
import {
  renderGridSelector, attachGridSelector,
  renderToggle, attachToggle,
  renderTabs, attachTabs, renderPanel,
  renderFormDialog, attachFormDialog,
} from '../components/index.js';

const scheduleStore = createStorage('iPIXEL_Schedules', () => []);
const powerScheduleStore = createStorage('iPIXEL_PowerSchedule',
  () => ({ enabled: false, onTime: '07:00', offTime: '22:00' }));

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TABS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'power', label: 'Power' },
  { id: 'content', label: 'Content' },
];

const EDIT_ICON = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>';
const DELETE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';

export class iPIXELScheduleCard extends iPIXELCardBase {
  constructor() {
    super();
    this._activeTab = 'timeline';
    this._schedules = scheduleStore.load();
    this._powerSchedule = powerScheduleStore.load();
    this._editingSlot = null;
    this._formVisible = false;
    this._checkInterval = null;
  }

  connectedCallback() {
    this._checkInterval = setInterval(() => this._checkSchedules(), 60000);
    this._checkSchedules();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._checkInterval) clearInterval(this._checkInterval);
  }

  _checkSchedules() {
    const now = new Date();
    const currentTime = this._formatTime(now);
    const currentDay = now.getDay();

    for (const schedule of this._schedules) {
      if (!schedule.enabled) continue;
      if (schedule.days && !schedule.days.includes(currentDay)) continue;
      if (schedule.startTime !== currentTime) continue;

      updateDisplayState({
        text: schedule.text || '',
        mode: schedule.mode || 'text',
        effect: schedule.effect || 'fixed',
        fgColor: schedule.fgColor || '#ff6600',
        bgColor: schedule.bgColor || '#000000',
      });

      if (schedule.mode === 'text' && schedule.text) {
        this.callService('ipixel_color', 'display_text', {
          text: schedule.text,
          effect: schedule.effect,
          color_fg: this.hexToRgb(schedule.fgColor),
          color_bg: this.hexToRgb(schedule.bgColor),
        });
      } else if (schedule.mode === 'clock') {
        this.callService('ipixel_color', 'set_clock_mode', { style: 1 });
      }
    }
  }

  _formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  _timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const active = this._activeTab;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 32px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; z-index: 2; }
        .timeline-block { position: absolute; height: 100%; border-radius: 2px; z-index: 1; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] {
          padding: 6px 10px; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: inherit;
        }
        .schedule-list {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 12px; max-height: 250px; overflow-y: auto;
        }
        .schedule-item {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          background: rgba(255,255,255,0.05); border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .schedule-item .toggle-switch { width: 36px; height: 20px; }
        .schedule-item .toggle-switch::after { width: 16px; height: 16px; }
        .schedule-item .toggle-switch.active::after { transform: translateX(16px); }
        .schedule-info { flex: 1; min-width: 0; }
        .schedule-name { font-weight: 500; font-size: 0.9em; }
        .schedule-time { font-size: 0.75em; opacity: 0.6; }
        .schedule-actions button {
          padding: 4px; background: transparent; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer; border-radius: 4px;
        }
        .schedule-actions button:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .day-selector { display: flex; gap: 4px; flex-wrap: wrap; }
        .day-btn {
          width: 32px; height: 32px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
          background: transparent; color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 0.75em; transition: all 0.2s;
        }
        .day-btn.active {
          background: var(--ipixel-primary); border-color: var(--ipixel-primary); color: #fff;
        }
        .current-time { font-size: 0.85em; opacity: 0.7; text-align: right; margin-bottom: 4px; }
      </style>
      <ha-card>
        <div class="card-content">
          ${renderTabs(TABS, active)}
          ${renderPanel('timeline', active === 'timeline', this._renderTimelineTab())}
          ${renderPanel('power', active === 'power', this._renderPowerTab())}
          ${renderPanel('content', active === 'content', this._renderContentTab())}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _renderTimelineTab() {
    const now = new Date();
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
    const currentTime = this._formatTime(now);

    const scheduleBlocks = this._schedules.filter(s => s.enabled).map(s => {
      const startMins = this._timeToMinutes(s.startTime);
      const endMins = s.endTime ? this._timeToMinutes(s.endTime) : startMins + 60;
      const startPos = (startMins / 1440) * 100;
      const width = ((endMins - startMins) / 1440) * 100;
      return `<div class="timeline-block" style="left: ${startPos}%; width: ${width}%; background: ${s.fgColor || '#03a9f4'}40;" title="${this.escapeHtml(s.name || 'Schedule')}"></div>`;
    }).join('');

    return `
      <div class="current-time">Current: ${currentTime}</div>
      <div class="section-title">24h Timeline</div>
      <div class="timeline">
        <div class="timeline-header">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
        <div class="timeline-bar">
          ${scheduleBlocks}
          <div class="timeline-now" style="left: ${nowPos}%;"></div>
        </div>
      </div>
      ${this._schedules.length === 0 ? `
        <div class="empty-state" style="margin-top: 12px;">
          No schedules configured yet — head to the Content tab to add one.
        </div>` : ''}`;
  }

  _renderPowerTab() {
    return `
      <div class="section-title">Power Schedule</div>
      <div class="subsection">
        <div class="power-row">
          ${renderToggle({ id: 'power-toggle', active: this._powerSchedule.enabled })}
          <label>On:</label>
          <input type="time" id="power-on" value="${this._powerSchedule.onTime}">
          <label>Off:</label>
          <input type="time" id="power-off" value="${this._powerSchedule.offTime}">
          <button class="btn btn-primary" id="save-power">Save</button>
        </div>
      </div>`;
  }

  _renderContentTab() {
    const dayItems = DAY_NAMES.map((name, i) => ({ value: i, name }));

    return `
      <div class="section-title">Content Schedules</div>
      <div class="schedule-list" id="schedule-list">
        ${this._schedules.length === 0 ? `
          <div class="empty-state" style="padding: 20px;">No schedules configured</div>
        ` : this._schedules.map((slot, i) => this._renderScheduleItem(slot, i)).join('')}
      </div>

      <button class="btn btn-secondary" id="add-slot" style="width: 100%;">+ Add Schedule</button>

      ${renderFormDialog({
        id: 'slot-form',
        visible: this._formVisible,
        submitLabel: 'Save Schedule',
        body: `
          <div class="form-row">
            <label>Name</label>
            <input type="text" class="text-input" id="slot-name" placeholder="Morning Message">
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Start Time</label>
              <input type="time" class="text-input" id="slot-start" value="08:00" style="width: 100%;">
            </div>
            <div class="form-row">
              <label>End Time (optional)</label>
              <input type="time" class="text-input" id="slot-end" style="width: 100%;">
            </div>
          </div>
          <div class="form-row">
            <label>Days</label>
            ${renderGridSelector(dayItems, {
              selected: [0, 1, 2, 3, 4, 5, 6],
              itemClass: 'day-btn',
              gridClass: 'day-selector',
              dataAttr: 'day',
            })}
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Mode</label>
              <select class="dropdown" id="slot-mode">
                <option value="text">Text</option>
                <option value="clock">Clock</option>
                <option value="off">Power Off</option>
              </select>
            </div>
            <div class="form-row">
              <label>Effect</label>
              <select class="dropdown" id="slot-effect">
                <option value="fixed">Fixed</option>
                <option value="scroll_ltr">Scroll Left</option>
                <option value="scroll_rtl">Scroll Right</option>
                <option value="blink">Blink</option>
              </select>
            </div>
          </div>
          <div class="form-row" id="text-row">
            <label>Text</label>
            <input type="text" class="text-input" id="slot-text" placeholder="Good Morning!">
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Text Color</label>
              <input type="color" id="slot-fg-color" value="#ff6600" style="width: 100%; height: 32px;">
            </div>
            <div class="form-row">
              <label>Background</label>
              <input type="color" id="slot-bg-color" value="#000000" style="width: 100%; height: 32px;">
            </div>
          </div>`,
      })}`;
  }

  _renderScheduleItem(slot, i) {
    const days = slot.days ? slot.days.map(d => DAY_NAMES[d]).join(', ') : 'Daily';
    const name = this.escapeHtml(slot.name || `Schedule ${i + 1}`);
    return `
      <div class="schedule-item" data-index="${i}">
        <div class="toggle-switch${slot.enabled ? ' active' : ''}" data-action="toggle" data-index="${i}"></div>
        <div class="schedule-info">
          <div class="schedule-name">${name}</div>
          <div class="schedule-time">
            ${slot.startTime}${slot.endTime ? ' - ' + slot.endTime : ''} · ${days} · ${slot.mode || 'text'}
          </div>
        </div>
        <div class="schedule-actions">
          <button data-action="edit" data-index="${i}" title="Edit">${EDIT_ICON}</button>
          <button data-action="delete" data-index="${i}" title="Delete">${DELETE_ICON}</button>
        </div>
      </div>`;
  }

  _attachListeners() {
    attachTabs(this.shadowRoot, (id) => { this._activeTab = id; this.render(); });

    // Power tab
    attachToggle(this.shadowRoot, 'power-toggle', (v) => { this._powerSchedule.enabled = v; });
    this.shadowRoot.getElementById('save-power')?.addEventListener('click', () => {
      this._powerSchedule.onTime = this.shadowRoot.getElementById('power-on')?.value || '07:00';
      this._powerSchedule.offTime = this.shadowRoot.getElementById('power-off')?.value || '22:00';
      powerScheduleStore.save(this._powerSchedule);
      this.callService('ipixel_color', 'set_power_schedule', {
        enabled: this._powerSchedule.enabled,
        on_time: this._powerSchedule.onTime,
        off_time: this._powerSchedule.offTime,
      });
    });

    // Content tab
    this.shadowRoot.getElementById('add-slot')?.addEventListener('click', () => this._showForm());

    attachFormDialog(this.shadowRoot, 'slot-form', {
      onCancel: () => { this._formVisible = false; this._editingSlot = null; },
      onSubmit: () => this._saveSlot(),
    });

    attachGridSelector(this.shadowRoot, '.day-btn', { multi: true, attr: 'day' });

    this.shadowRoot.getElementById('slot-mode')?.addEventListener('change', (e) => {
      const textRow = this.shadowRoot.getElementById('text-row');
      if (textRow) textRow.style.display = e.target.value === 'text' ? 'block' : 'none';
    });

    this.shadowRoot.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this._schedules[index].enabled = !this._schedules[index].enabled;
        scheduleStore.save(this._schedules);
        e.currentTarget.classList.toggle('active', this._schedules[index].enabled);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this._showForm(this._schedules[index], index);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        if (confirm('Delete this schedule?')) {
          this._schedules.splice(index, 1);
          scheduleStore.save(this._schedules);
          this.render();
        }
      });
    });
  }

  _showForm(slot = null, index = null) {
    this._editingSlot = index;
    this._formVisible = true;
    this.render();
    if (slot) this._fillSlotForm(slot);
    else this._resetSlotForm();
  }

  _resetSlotForm() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    if ($('slot-name')) $('slot-name').value = '';
    if ($('slot-start')) $('slot-start').value = '08:00';
    if ($('slot-end')) $('slot-end').value = '';
    if ($('slot-mode')) $('slot-mode').value = 'text';
    if ($('slot-effect')) $('slot-effect').value = 'fixed';
    if ($('slot-text')) $('slot-text').value = '';
    if ($('slot-fg-color')) $('slot-fg-color').value = '#ff6600';
    if ($('slot-bg-color')) $('slot-bg-color').value = '#000000';
    this.shadowRoot.querySelectorAll('.day-btn').forEach(btn => btn.classList.add('active'));
    if ($('text-row')) $('text-row').style.display = 'block';
  }

  _fillSlotForm(slot) {
    const $ = (id) => this.shadowRoot.getElementById(id);
    if ($('slot-name')) $('slot-name').value = slot.name || '';
    if ($('slot-start')) $('slot-start').value = slot.startTime || '08:00';
    if ($('slot-end')) $('slot-end').value = slot.endTime || '';
    if ($('slot-mode')) $('slot-mode').value = slot.mode || 'text';
    if ($('slot-effect')) $('slot-effect').value = slot.effect || 'fixed';
    if ($('slot-text')) $('slot-text').value = slot.text || '';
    if ($('slot-fg-color')) $('slot-fg-color').value = slot.fgColor || '#ff6600';
    if ($('slot-bg-color')) $('slot-bg-color').value = slot.bgColor || '#000000';

    const selectedDays = slot.days || [0, 1, 2, 3, 4, 5, 6];
    this.shadowRoot.querySelectorAll('.day-btn').forEach(btn => {
      btn.classList.toggle('active', selectedDays.includes(parseInt(btn.dataset.day)));
    });
    if ($('text-row')) $('text-row').style.display = slot.mode === 'text' ? 'block' : 'none';
  }

  _saveSlot() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    const selectedDays = Array.from(this.shadowRoot.querySelectorAll('.day-btn.active'))
      .map(btn => parseInt(btn.dataset.day));

    const slot = {
      name: $('slot-name')?.value || 'Schedule',
      startTime: $('slot-start')?.value || '08:00',
      endTime: $('slot-end')?.value || '',
      days: selectedDays.length === 7 ? null : selectedDays,
      mode: $('slot-mode')?.value || 'text',
      effect: $('slot-effect')?.value || 'fixed',
      text: $('slot-text')?.value || '',
      fgColor: $('slot-fg-color')?.value || '#ff6600',
      bgColor: $('slot-bg-color')?.value || '#000000',
      enabled: true,
    };

    if (this._editingSlot !== null) this._schedules[this._editingSlot] = slot;
    else this._schedules.push(slot);

    scheduleStore.save(this._schedules);
    this._formVisible = false;
    this._editingSlot = null;
    this.render();
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
