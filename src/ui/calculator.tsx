// Non-modal calculator panel: stays open beside the question so students can work the formula.
import { useEffect, useRef, useState } from 'react';
import { evaluate, formatResult } from '../calc';

const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '(', ')', '^', '%', '⌫', '+'];

/** The answer box on the current screen (round, Quick Challenge or Mastery Lab), if any. */
function answerInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('input[id^="ans-"]:not([disabled]), input[id$="-ans"]:not([disabled])');
}

/** Write into a React-controlled input so React sees the change. */
function fill(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function Calculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<{ value?: number; error?: string }>({});
  const [history, setHistory] = useState<{ expr: string; value: number }[]>([]);
  const [note, setNote] = useState<string>();
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) field.current?.focus();
    document.documentElement.classList.toggle('calc-open', open);
  }, [open]);

  function run() {
    try {
      const value = evaluate(expr);
      setResult({ value });
      setHistory((h) => [{ expr, value }, ...h.filter((x) => x.expr !== expr)].slice(0, 6));
    } catch (e) {
      setResult({ error: (e as Error).message });
    }
  }

  function press(k: string) {
    setNote(undefined);
    if (k === '⌫') setExpr((x) => x.slice(0, -1));
    else setExpr((x) => x + k);
    field.current?.focus();
  }

  function useInAnswer() {
    const v = result.value;
    if (v === undefined) return;
    const input = answerInput();
    if (!input) { setNote('This screen has no answer box. Open a round, then try again.'); return; }
    fill(input, String(Math.round(v * 1e6) / 1e6));
    setNote('Copied into your answer. Check the rounding the question asks for before you submit.');
    // On a phone the sheet covers the answer form, so step out of the way.
    if (window.matchMedia('(max-width: 640px)').matches) onClose();
    input.scrollIntoView({ block: 'center' });
    input.focus({ preventScroll: true });
  }

  return (
    <section className="calc" role="dialog" aria-modal="false" aria-labelledby="calc-title" hidden={!open}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="calc-head">
        <h2 id="calc-title">Calculator</h2>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(); }}>
        <label htmlFor="calc-expr" className="sr-only">Calculation</label>
        <input id="calc-expr" ref={field} className="calc-expr" value={expr} autoComplete="off" spellCheck={false}
          inputMode="decimal" placeholder="e.g. (12 − 5) × 1100 − 5900"
          onChange={(e) => { setExpr(e.target.value); setNote(undefined); }} />
        <output className={`calc-out ${result.error ? 'neg' : ''}`} htmlFor="calc-expr" aria-live="polite">
          {result.error ?? (result.value !== undefined ? `= ${formatResult(result.value)}` : ' ')}
        </output>
        <div className="calc-keys">
          {KEYS.map((k) => (
            <button type="button" key={k} className="calc-key" onClick={() => press(k)}
              aria-label={{ '÷': 'divide', '×': 'times', '−': 'minus', '+': 'plus', '^': 'to the power of', '%': 'percent', '⌫': 'delete last character', '.': 'decimal point', '(': 'open parenthesis', ')': 'close parenthesis' }[k] ?? k}>
              {k}
            </button>
          ))}
          <button type="button" className="calc-key" onClick={() => { setExpr(''); setResult({}); setNote(undefined); field.current?.focus(); }}>Clear</button>
          <button type="submit" className="calc-key calc-eq">=</button>
        </div>
      </form>
      <div className="btn-row" style={{ marginTop: '.6rem' }}>
        <button className="btn primary" disabled={result.value === undefined} onClick={useInAnswer}>Use in answer</button>
      </div>
      {note && <p className="small" role="status" style={{ margin: '.5rem 0 0' }}>{note}</p>}
      {history.length > 0 && (
        <details className="calc-hist">
          <summary>Recent ({history.length})</summary>
          <ul>
            {history.map((h) => (
              <li key={h.expr}>
                <button type="button" className="btn ghost" onClick={() => { setExpr(h.expr); setResult({ value: h.value }); field.current?.focus(); }}>
                  {h.expr} = {formatResult(h.value)}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="small muted" style={{ margin: '.5rem 0 0' }}>Type or tap. Enter calculates. ^ is a power, so 1.1^3 discounts three years. Esc closes.</p>
    </section>
  );
}
