// Q42 date-range calendar (WAI-ARIA APG Date Picker Dialog pattern, range
// variant) — lazy chunk, mounted only when the trip-dates sheet opens.
// Contract: 44px cells (touch-field floor), roving tabindex, full keyboard
// (arrows / PageUp-Down / Home-End / Enter-Space), ISO 8601 output, and
// aria-selected range semantics. No dependencies.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameDay = (a, b) => a && b && iso(a) === iso(b);

export function mountRangeCalendar(root, { start, end, onChange } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let selStart = start ? new Date(`${start}T00:00:00`) : null;
  let selEnd = end ? new Date(`${end}T00:00:00`) : null;
  let focusDate = selStart ? new Date(selStart) : new Date(today);
  const view = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  let keyboard = false; // only restore focus after keyboard navigation

  const emit = () => onChange && onChange({ start: selStart ? iso(selStart) : null, end: selEnd ? iso(selEnd) : null });

  function pick(d) {
    if (!selStart || selEnd || d < selStart) {
      selStart = d;
      selEnd = null;
    } else {
      selEnd = d;
    }
    emit();
  }

  function render() {
    const hadFocus = root.contains(document.activeElement);
    const y = view.getFullYear();
    const m = view.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let cells = '';
    let day = 1;
    for (let w = 0; w < 6; w++) {
      cells += '<tr role="row">';
      for (let d = 0; d < 7; d++) {
        if ((w === 0 && d < firstDow) || day > daysInMonth) {
          cells += '<td role="gridcell" class="cal-cell empty"></td>';
          continue;
        }
        const date = new Date(y, m, day);
        const isStart = sameDay(date, selStart);
        const isEnd = sameDay(date, selEnd);
        const inRange = selStart && selEnd && date > selStart && date < selEnd;
        const cls = ['cal-cell', isStart ? 'cal-start' : '', isEnd ? 'cal-end' : '', inRange ? 'cal-in' : ''].filter(Boolean).join(' ');
        const selected = isStart || isEnd || inRange;
        const label = `${DOW[date.getDay()]}, ${MONTHS[m]} ${day}, ${y}`;
        cells +=
          `<td role="gridcell" aria-selected="${selected}" class="${cls}">` +
          `<button type="button" class="cal-day" tabindex="${sameDay(date, focusDate) ? 0 : -1}" ` +
          `data-date="${iso(date)}" aria-label="${label}${isStart ? ', trip start' : isEnd ? ', trip end' : ''}">${day}</button></td>`;
        day++;
      }
      cells += '</tr>';
      if (day > daysInMonth) break;
    }

    root.innerHTML =
      `<div class="cal-head">` +
      `<button type="button" class="cal-nav" data-cal="prev" aria-label="Previous month">‹</button>` +
      `<span class="cal-label" aria-live="polite">${MONTHS[m]} ${y}</span>` +
      `<button type="button" class="cal-nav" data-cal="next" aria-label="Next month">›</button>` +
      `</div>` +
      `<table role="grid" class="cal-grid" aria-label="Trip dates">` +
      `<thead><tr role="row">${DOW.map((d) => `<th role="columnheader" abbr="${d}">${d.slice(0, 2)}</th>`).join('')}</tr></thead>` +
      `<tbody>${cells}</tbody></table>`;

    if (keyboard || hadFocus) {
      // Keep focus on the focused day across re-renders (APG roving tabindex):
      // without this, picking a date drops focus to <body> and the keyboard
      // range selection dies mid-flow.
      const btn = root.querySelector(`.cal-day[data-date="${iso(focusDate)}"]`);
      if (btn) btn.focus();
      keyboard = false;
    }
  }

  function moveFocus(days) {
    focusDate = new Date(focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate() + days);
    if (focusDate.getMonth() !== view.getMonth() || focusDate.getFullYear() !== view.getFullYear()) {
      view.setFullYear(focusDate.getFullYear(), focusDate.getMonth(), 1);
    }
    keyboard = true;
    render();
  }

  function shiftMonth(delta) {
    view.setMonth(view.getMonth() + delta);
    focusDate = new Date(view.getFullYear(), view.getMonth(), Math.min(focusDate.getDate(), new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()));
    keyboard = true;
    render();
  }

  root.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-cal]');
    if (nav) {
      shiftMonth(nav.dataset.cal === 'next' ? 1 : -1);
      return;
    }
    const day = e.target.closest('.cal-day');
    if (!day) return;
    focusDate = new Date(`${day.dataset.date}T00:00:00`);
    pick(focusDate);
    render();
  });

  root.addEventListener('keydown', (e) => {
    const key = e.key;
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (key in moves) {
      e.preventDefault();
      moveFocus(moves[key]);
    } else if (key === 'PageUp') {
      e.preventDefault();
      shiftMonth(e.shiftKey ? -12 : -1);
    } else if (key === 'PageDown') {
      e.preventDefault();
      shiftMonth(e.shiftKey ? 12 : 1);
    } else if (key === 'Home' || key === 'End') {
      e.preventDefault();
      const dow = focusDate.getDay();
      moveFocus(key === 'Home' ? -dow : 6 - dow);
    }
  });

  render();
}
