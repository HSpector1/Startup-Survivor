// Small shared presentational pieces used by every screen.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt, type Cents } from '../engine/money';
import { ACCOUNTS, type JournalEvent } from '../engine/ledger';

/** A money amount. `tone` colors it by sign; negative amounts never rely on color alone (they carry a minus). */
export function Money({ c, tone, sign, noCents }: { c: Cents; tone?: boolean; sign?: boolean; noCents?: boolean }) {
  const cls = tone ? (c > 0 ? 'pos' : c < 0 ? 'neg' : undefined) : undefined;
  return <span className={cls}>{fmt(c, { sign, noCents })}</span>;
}

/** A signed variance shown the Easton way: amount plus F (favorable) or U (unfavorable). */
export function Variance({ c }: { c: Cents }) {
  if (c === 0) return <span>$0.00</span>;
  const f = c > 0;
  return (
    <span className={f ? 'pos' : 'neg'}>
      {fmt(Math.abs(c))} {f ? 'F' : 'U'}
      <span className="sr-only">{f ? ' favorable' : ' unfavorable'}</span>
    </span>
  );
}

export function Delta({ before, after, invert }: { before: Cents; after: Cents; invert?: boolean }) {
  const d = after - before;
  if (d === 0) return <span className="muted">no change</span>;
  const good = invert ? d < 0 : d > 0;
  return <span className={good ? 'pos' : 'neg'}>{fmt(d, { sign: true })}</span>;
}

/**
 * Horizontal scroll container for wide statements. When the table is wider than the screen (phones), it becomes a
 * keyboard-focusable region, so arrow keys can scroll it, and it says that more columns exist off to the side.
 */
export function TableScroll({ children, label = 'Table, scrolls sideways', hint = true }: { children: ReactNode; label?: string; hint?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div>
      <div ref={ref} className="table-scroll" tabIndex={overflows ? 0 : undefined} role={overflows ? 'region' : undefined} aria-label={overflows ? label : undefined}>
        {children}
      </div>
      {overflows && hint && <p className="small muted table-hint">Scroll sideways to see every column.</p>}
    </div>
  );
}

/** Journal entries in textbook form: debits first, credits indented. */
export function JournalView({ events, empty }: { events: JournalEvent[]; empty?: string }) {
  if (!events.length) return <p className="muted">{empty ?? 'No journal entries.'}</p>;
  return (
    <div>
      {events.map((e) => (
        <div className="journal-entry" key={e.id}>
          <div className="small"><strong>{e.memo}</strong> <span className="muted">({e.id})</span></div>
          <TableScroll label={`Journal entry ${e.id}, scrolls sideways`} hint={false}>
            <table aria-label={`Journal entry ${e.id}`}>
              <thead className="sr-only"><tr><th>Account</th><th>Memo</th><th>Debit</th><th>Credit</th></tr></thead>
              <tbody>
                {[...e.lines].sort((a, b) => (b.dr ? 1 : 0) - (a.dr ? 1 : 0)).map((l, i) => (
                  <tr key={i}>
                    <td className={l.cr ? 'cr' : undefined}>{l.dr ? 'Dr' : 'Cr'} {ACCOUNTS[l.account].label}</td>
                    <td className="muted small">{l.memo}</td>
                    <td className="num">{l.dr ? fmt(l.dr) : ''}</td>
                    <td className="num">{l.cr ? fmt(l.cr) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      ))}
    </div>
  );
}

/** Modal sheet built on <dialog> so focus trapping and Escape come from the browser. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-labelledby="sheet-title">
      <div className="sheet-head">
        <h2 id="sheet-title" style={{ margin: 0 }}>{title}</h2>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="sheet-body">{open ? children : null}</div>
    </dialog>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value);
            if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].id);
            if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Move focus to a screen's heading when the screen changes, so keyboard and screen-reader users land at the top. */
export function useFocusHeading(key: string) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); window.scrollTo({ top: 0 }); }, [key]);
  return ref;
}
