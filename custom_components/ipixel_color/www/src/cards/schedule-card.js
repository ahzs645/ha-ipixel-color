/**
 * iPIXEL Schedule Card
 * Time-based content scheduling and power automation
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { getDisplayState, updateDisplayState } from '../state.js';

// Storage key for schedules
const SCHEDULES_STORAGE_KEY = 'iPIXEL_Schedules';

export class iPIXELScheduleCard extends iPIXELCardBase {
  constructor() {
    super();
    this._schedules = this._loadSchedules();
    this._powerSchedule = this._loadPowerSchedule();
    this._editingSlot = null;
    this._checkInterval = null;
  }

  connectedCallback() {
    // Check schedules every minute
    this._checkInterval = setInterval(() => this._checkSchedules(), 60000);
    this._checkSchedules();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
    }
  }

  _loadSchedules() {
    try {
      const saved = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  _saveSchedules() {
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(this._schedules));
    } catch (e) {
      console.warn('iPIXEL: Failed to save schedules', e);
    }
  }

  _loadPowerSchedule() {
    try {
      const saved = localStorage.getItem('iPIXEL_PowerSchedule');
      return saved ? JSON.parse(saved) : { enabled: false, onTime: '07:00', offTime: '22:00' };
    } catch (e) {
      return { enabled: false, onTime: '07:00', offTime: '22:00' };
    }
  }

  _savePowerSchedule() {
    try {
      localStorage.setItem('iPIXEL_PowerSchedule', JSON.stringify(this._powerSchedule));
    } catch (e) {
      console.warn('iPIXEL: Failed to save power schedule', e);
    }
  }

  _checkSchedules() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0 = Sunday

    // Check content schedules
    for (const schedule of this._schedules) {
      if (!schedule.enabled) continue;
      if (schedule.days && !schedule.days.includes(currentDay)) continue;

      if (schedule.startTime === currentTime) {
        // Apply this schedule
        updateDisplayState({
          text: schedule.text || '',
          mode: schedule.mode || 'text',
          effect: schedule.effect || 'fixed',
          fgColor: schedule.fgColor || '#ff6600',
          bgColor: schedule.bgColor || '#000000'
        });

        if (schedule.mode === 'text' && schedule.text) {
          this.callService('ipixel_color', 'display_text', {
            text: schedule.text,
            effect: schedule.effect,
            color_fg: this.hexToRgb(schedule.fgColor),
            color_bg: this.hexToRgb(schedule.bgColor)
          });
        } else if (schedule.mode === 'clock') {
          this.callService('ipixel_color', 'set_clock_mode', { style: 1 });
        }
      }
    }
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;
    const now = new Date();
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Generate schedule blocks for timeline
    const scheduleBlocks = this._schedules.filter(s => s.enabled).map(s => {
      const startMins = this._timeToMinutes(s.startTime);
      const endMins = s.endTime ? this._timeToMinutes(s.endTime) : startMins + 60;
      const startPos = (startMins / 1440) * 100;
      const width = ((endMins - startMins) / 1440) * 100;
      return `<div class="timeline-block" style="left: ${startPos}%; width: ${width}%; background: ${s.fgColor || '#03a9f4'}40;" title="${s.name || 'Schedule'}"></div>`;
    }).join('');

    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 32px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; left: ${nowPos}%; z-index: 2; }
        .timeline-block { position: absolute; height: 100%; border-radius: 2px; z-index: 1; }
        .power-section { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] {
          padding: 6px 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          color: inherit;
        }
        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          max-height: 250px;
          overflow-y: auto;
        }
        .schedule-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .schedule-toggle {
          width: 36px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }
        .schedule-toggle.active {
          background: var(--primary-color, #03a9f4);
        }
        .schedule-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .schedule-toggle.active::after {
          transform: translateX(16px);
        }
        .schedule-info { flex: 1; min-width: 0; }
        .schedule-name { font-weight: 500; font-size: 0.9em; }
        .schedule-time { font-size: 0.75em; opacity: 0.6; }
        .schedule-actions button {
          padding: 4px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          border-radius: 4px;
        }
        .schedule-actions button:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .add-slot-form {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }
        .form-row { margin-bottom: 12px; }
        .form-row label { display: block; font-size: 0.8em; opacity: 0.7; margin-bottom: 4px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .day-selector {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .day-btn {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          background: transparent;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .day-btn.selected {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
          color: #fff;
        }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .current-time { font-size: 0.85em; opacity: 0.7; text-align: right; margin-bottom: 4px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="current-time">Current: ${currentTime}</div>

          <div class="section-title">Timeline</div>
          <div class="timeline">
            <div class="timeline-header">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
            <div class="timeline-bar">
              ${scheduleBlocks}
              <div class="timeline-now"></div>
            </div>
          </div>

          <div class="section-title">Power Schedule</div>
          <div class="power-section">
            <div class="power-row">
              <div class="schedule-toggle ${this._powerSchedule.enabled ? 'active' : ''}" id="power-toggle"></div>
              <label>On:</label>
              <input type="time" id="power-on" value="${this._powerSchedule.onTime}">
              <label>Off:</label>
              <input type="time" id="power-off" value="${this._powerSchedule.offTime}">
              <button class="btn btn-primary" id="save-power">Save</button>
            </div>
          </div>

          <div class="section-title">Content Schedules</div>
          <div class="schedule-list" id="schedule-list">
            ${this._schedules.length === 0 ? `
              <div class="empty-state" style="padding: 20px; text-align: center; opacity: 0.5;">
                No schedules configured
              </div>
            ` : this._schedules.map((slot, i) => `
              <div class="schedule-item" data-index="${i}">
                <div class="schedule-toggle ${slot.enabled ? 'active' : ''}" data-action="toggle" data-index="${i}"></div>
                <div class="schedule-info">
                  <div class="schedule-name">${this._escapeHtml(slot.name || 'Schedule ' + (i + 1))}</div>
                  <div class="schedule-time">
                    ${slot.startTime}${slot.endTime ? ' - ' + slot.endTime : ''} ·
                    ${slot.days ? slot.days.map(d => dayNames[d]).join(', ') : 'Daily'} ·
                    ${slot.mode || 'text'}
                  </div>
                </div>
                <div class="schedule-actions">
                  <button data-action="edit" data-index="${i}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                  </button>
                  <button data-action="delete" data-index="${i}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <button class="btn btn-secondary" id="add-slot" style="width: 100%;">+ Add Schedule</button>

          <div class="add-slot-form" id="slot-form" style="display: none;">
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
              <div class="day-selector" id="day-selector">
                ${dayNames.map((name, i) => `
                  <button type="button" class="day-btn selected" data-day="${i}">${name}</button>
                `).join('')}
              </div>
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
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" id="cancel-slot">Cancel</button>
              <button class="btn btn-primary" id="save-slot">Save Schedule</button>
            </div>
          </div>
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _attachListeners() {
    // Power toggle
    this.shadowRoot.getElementById('power-toggle')?.addEventListener('click', (e) => {
      this._powerSchedule.enabled = !this._powerSchedule.enabled;
      e.currentTarget.classList.toggle('active', this._powerSchedule.enabled);
    });

    // Save power schedule
    this.shadowRoot.getElementById('save-power')?.addEventListener('click', () => {
      this._powerSchedule.onTime = this.shadowRoot.getElementById('power-on')?.value || '07:00';
      this._powerSchedule.offTime = this.shadowRoot.getElementById('power-off')?.value || '22:00';
      this._savePowerSchedule();

      this.callService('ipixel_color', 'set_power_schedule', {
        enabled: this._powerSchedule.enabled,
        on_time: this._powerSchedule.onTime,
        off_time: this._powerSchedule.offTime
      });
    });

    // Add slot button
    this.shadowRoot.getElementById('add-slot')?.addEventListener('click', () => {
      this._editingSlot = null;
      this._resetSlotForm();
      this.shadowRoot.getElementById('slot-form').style.display = 'block';
    });

    // Cancel button
    this.shadowRoot.getElementById('cancel-slot')?.addEventListener('click', () => {
      this.shadowRoot.getElementById('slot-form').style.display = 'none';
      this._editingSlot = null;
    });

    // Day selector
    this.shadowRoot.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('selected');
      });
    });

    // Mode change (show/hide text field)
    this.shadowRoot.getElementById('slot-mode')?.addEventListener('change', (e) => {
      const textRow = this.shadowRoot.getElementById('text-row');
      if (textRow) {
        textRow.style.display = e.target.value === 'text' ? 'block' : 'none';
      }
    });

    // Save slot
    this.shadowRoot.getElementById('save-slot')?.addEventListener('click', () => {
      const selectedDays = Array.from(this.shadowRoot.querySelectorAll('.day-btn.selected'))
        .map(btn => parseInt(btn.dataset.day));

      const slot = {
        name: this.shadowRoot.getElementById('slot-name')?.value || 'Schedule',
        startTime: this.shadowRoot.getElementById('slot-start')?.value || '08:00',
        endTime: this.shadowRoot.getElementById('slot-end')?.value || '',
        days: selectedDays.length === 7 ? null : selectedDays,
        mode: this.shadowRoot.getElementById('slot-mode')?.value || 'text',
        effect: this.shadowRoot.getElementById('slot-effect')?.value || 'fixed',
        text: this.shadowRoot.getElementById('slot-text')?.value || '',
        fgColor: this.shadowRoot.getElementById('slot-fg-color')?.value || '#ff6600',
        bgColor: this.shadowRoot.getElementById('slot-bg-color')?.value || '#000000',
        enabled: true
      };

      if (this._editingSlot !== null) {
        this._schedules[this._editingSlot] = slot;
      } else {
        this._schedules.push(slot);
      }

      this._saveSchedules();
      this.shadowRoot.getElementById('slot-form').style.display = 'none';
      this._editingSlot = null;
      this.render();
    });

    // Toggle schedule
    this.shadowRoot.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this._schedules[index].enabled = !this._schedules[index].enabled;
        this._saveSchedules();
        e.currentTarget.classList.toggle('active', this._schedules[index].enabled);
      });
    });

    // Edit schedule
    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        const slot = this._schedules[index];
        if (slot) {
          this._editingSlot = index;
          this._fillSlotForm(slot);
          this.shadowRoot.getElementById('slot-form').style.display = 'block';
        }
      });
    });

    // Delete schedule
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        if (confirm('Delete this schedule?')) {
          this._schedules.splice(index, 1);
          this._saveSchedules();
          this.render();
        }
      });
    });
  }

  _resetSlotForm() {
    this.shadowRoot.getElementById('slot-name').value = '';
    this.shadowRoot.getElementById('slot-start').value = '08:00';
    this.shadowRoot.getElementById('slot-end').value = '';
    this.shadowRoot.getElementById('slot-mode').value = 'text';
    this.shadowRoot.getElementById('slot-effect').value = 'fixed';
    this.shadowRoot.getElementById('slot-text').value = '';
    this.shadowRoot.getElementById('slot-fg-color').value = '#ff6600';
    this.shadowRoot.getElementById('slot-bg-color').value = '#000000';
    this.shadowRoot.querySelectorAll('.day-btn').forEach(btn => btn.classList.add('selected'));
    this.shadowRoot.getElementById('text-row').style.display = 'block';
  }

  _fillSlotForm(slot) {
    this.shadowRoot.getElementById('slot-name').value = slot.name || '';
    this.shadowRoot.getElementById('slot-start').value = slot.startTime || '08:00';
    this.shadowRoot.getElementById('slot-end').value = slot.endTime || '';
    this.shadowRoot.getElementById('slot-mode').value = slot.mode || 'text';
    this.shadowRoot.getElementById('slot-effect').value = slot.effect || 'fixed';
    this.shadowRoot.getElementById('slot-text').value = slot.text || '';
    this.shadowRoot.getElementById('slot-fg-color').value = slot.fgColor || '#ff6600';
    this.shadowRoot.getElementById('slot-bg-color').value = slot.bgColor || '#000000';

    const selectedDays = slot.days || [0, 1, 2, 3, 4, 5, 6];
    this.shadowRoot.querySelectorAll('.day-btn').forEach(btn => {
      btn.classList.toggle('selected', selectedDays.includes(parseInt(btn.dataset.day)));
    });

    this.shadowRoot.getElementById('text-row').style.display = slot.mode === 'text' ? 'block' : 'none';
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
