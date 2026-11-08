// Landing, setup, the 5-round Quick Challenge, the Mastery Lab, glossary and sources.
// Quick Challenge and Mastery Lab keep their state in React only and never touch the saved game.
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import './extras.css';
import { NEUTRAL, ROUND_IDS, type OptionId, type RoundId } from '../engine/model';
import { availability, projectOption, runGame, type Choices } from '../engine/sim';
import { incomeStatement } from '../engine/ledger';
import { EMPTY_RECORD, grade, points, type CheckSpec, type MasteryRecord } from '../engine/scoring';
import { fmt, type Cents } from '../engine/money';
import { BONUS, BONUS_BEST, CHAPTERS, CHAPTER_BLURB, OVERLAY, ROUNDS, modulesOf, promptOf, roundById, workedOf, type Mistake, type SpecOption } from '../content/rounds';
import { ASSUMPTIONS, GLOSSARY, SOURCES } from '../content/reference';
import { DEFAULT_NAME, importSave, type Save } from '../state';
import { useFocusHeading } from './common';
import { ChapterIcon, TruckHero } from './art';

const OPTION_IDS: OptionId[] = ['A', 'B', 'C'];

/* ================================================================ Landing */

export function Landing({ hasSave, resumeLabel, onResume, onNew, onQuick, onBonus, onGlossary, onSources }: {
  hasSave: boolean; resumeLabel?: string; onResume: () => void; onNew: () => void; onQuick: () => void;
  onBonus: () => void; onGlossary: () => void; onSources: () => void;
}) {
  const h = useFocusHeading('landing');
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="muted small">Built for Auburn BUSI 7230, Cost Analysis and Systems</p>
          <h1 ref={h} tabIndex={-1}>Startup Survivor: Build a Food Truck Empire</h1>
          <p className="lede">You put $25,000 into a food truck, make the calls a real owner makes, and keep the books that prove whether they worked.</p>
          <div className="btn-row">
            {hasSave && <button className="btn primary" onClick={onResume}>{resumeLabel ?? 'Resume your game'}</button>}
            <button className={`btn ${hasSave ? '' : 'primary'}`} onClick={onNew}>Start a full career</button>
            <button className="btn" onClick={onQuick}>Quick Challenge (5 min)</button>
          </div>
        </div>
        <TruckHero name="Startup Survivor" title="A food truck parked under string lights at sunset" />
      </section>

      <section className="card" aria-labelledby="obj-h">
        <h2 id="obj-h">What you will be able to do</h2>
        <ol className="objectives">
          <li><span><strong>Interpret financial statements and metrics.</strong> Read an income statement, balance sheet and cash flow statement, and tell profit from cash.</span></li>
          <li><span><strong>Choose among alternatives with managerial accounting.</strong> Use contribution margin, break-even, relevant costs, budgets, variances and NPV to pick a course of action.</span></li>
          <li><span><strong>Explain how recognition and cost allocation change the numbers.</strong> Show how the timing of revenue and expenses, and the way you spread shared costs, move income, cash flow and reported performance.</span></li>
        </ol>
      </section>

      <section aria-labelledby="loop-h">
        <h2 id="loop-h">How a round works</h2>
        <ol className="x-steps">
          <li><strong>Learn</strong><span>Read one learning objective and a short business event.</span></li>
          <li><strong>Analyze</strong><span>Answer a knowledge check. A hint shows the formula.</span></li>
          <li><strong>Decide</strong><span>Pick one of three order tickets for your truck.</span></li>
          <li><strong>Consequence</strong><span>See the change in profit and cash, posted to real books.</span></li>
          <li><strong>Explain</strong><span>Read the worked solution and why the other choices differ.</span></li>
        </ol>
      </section>

      <section aria-labelledby="modes-h">
        <h2 id="modes-h">Choose how to play</h2>
        <div className="modes">
          <div className="card mode">
            <h3>Full career</h3>
            <p>25 rounds in 5 chapters, about 30 minutes. The game saves after every step and checkpoints each chapter, so you can stop and come back.</p>
            <div className="btn-row">
              {hasSave && <button className="btn primary" onClick={onResume}>{resumeLabel ?? 'Resume'}</button>}
              <button className={`btn ${hasSave ? '' : 'primary'}`} onClick={onNew}>Start a new company</button>
            </div>
          </div>
          <div className="card mode">
            <h3>Quick Challenge <span className="tag">For peer reviewers</span></h3>
            <p>5 key rounds on a ready-made reference business: break-even, a catering order, materials variances, a flexible budget and NPV. 5 to 8 minutes, no setup.</p>
            <div className="btn-row"><button className="btn primary" onClick={onQuick}>Play the Quick Challenge</button></div>
          </div>
          <div className="card mode">
            <h3>Mastery Lab</h3>
            <p>5 optional harder cases on allocation, step costs, inventory, fair evaluation and NPV stress tests. They never change your company.</p>
            <div className="btn-row"><button className="btn" onClick={onBonus}>Open the Mastery Lab</button></div>
          </div>
          <div className="card mode">
            <h3>Reference</h3>
            <p>Look up any term, or read the model's assumptions, sources and accessibility notes.</p>
            <div className="btn-row">
              <button className="btn" onClick={onGlossary}>Glossary</button>
              <button className="btn" onClick={onSources}>Sources and assumptions</button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ch-h">
        <h2 id="ch-h">The five chapters</h2>
        <ol className="x-chapters">
          {CHAPTERS.map((c, i) => (
            <li key={c} className="chapter-strip">
              <ChapterIcon chapter={(i + 1) as 1 | 2 | 3 | 4 | 5} />
              <div><strong>Chapter {i + 1}: {c}</strong><br /><span className="small muted">{CHAPTER_BLURB[i]}</span></div>
            </li>
          ))}
        </ol>
      </section>

      <p className="panel small">No login and no personal data. Your progress stays in this browser. Every screen works with a keyboard: Tab moves between controls, and Enter or Space picks a ticket.</p>
    </div>
  );
}

/* ================================================================ Setup */

export function Setup({ hasSave, onStart, onBack, onImported }: {
  hasSave: boolean; onStart: (name: string, masteryAffectsSales: boolean) => void; onBack: () => void; onImported: (s: Save) => void;
}) {
  const h = useFocusHeading('setup');
  const [name, setName] = useState(DEFAULT_NAME);
  const [armed, setArmed] = useState(false);
  const [affects, setAffects] = useState(true);
  const [importError, setImportError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (hasSave && !armed) { setArmed(true); return; }
    onStart(name, affects);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(undefined);
    try { onImported(await importSave(file)); } catch (err) { setImportError((err as Error).message); }
  }

  return (
    <div className="stack x-narrow">
      <h1 ref={h} tabIndex={-1}>Open your food truck</h1>
      <form className="card stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="truck-name">Name your truck</label>
          <input id="truck-name" className="x-text" value={name} maxLength={28} onChange={(e) => { setName(e.target.value); setArmed(false); }}
            aria-describedby="truck-name-help" autoComplete="off" />
          <span id="truck-name-help" className="small muted">Up to 28 characters. Use a business name, not your own name. Leave it blank to use "{DEFAULT_NAME}".</span>
        </div>
        <div className="panel">
          <h2 className="x-h3">Your first transaction</h2>
          <p>You invest $25,000 of your own cash. The business records it as:</p>
          <div className="x-journal" role="table" aria-label="Opening journal entry">
            <div role="row"><span role="cell">Dr Cash</span><span role="cell" className="num">$25,000.00</span><span role="cell" /></div>
            <div role="row"><span role="cell" className="x-cr">Cr Owner's capital</span><span role="cell" /><span role="cell" className="num">$25,000.00</span></div>
          </div>
          <p className="small">This is equity, not revenue: the business has more cash because you own more of it, not because it earned anything.</p>
          <p className="small">Chapter 1 asks you to buy a truck, pick a location, set a bowl price and find your break-even point. Your first month of sales closes in Chapter 2.</p>
        </div>
        <div className="panel">
          <label className="x-check">
            <input type="checkbox" checked={affects} onChange={(e) => setAffects(e.target.checked)} aria-describedby="affects-help" />
            <span><strong>Mastery affects sales</strong></span>
          </label>
          <p id="affects-help" className="small" style={{ margin: '.4rem 0 0' }}>
            A business runs as well as its owner understands the numbers. Each month, customer demand is scaled by your knowledge-check results for that month:
            4 of 4 points gives 100% of normal demand, 2 points 90%, and 0 points 75%. Contract sales (catering, the corporate order) are not affected.
            Sales still post normally, so the books stay exact. Turn this off to play with the pure spec numbers.
          </p>
        </div>
        {hasSave && armed && (
          <div className="banner warn" role="alert">Starting a new company replaces your saved game. Export a backup first if you want to keep it.</div>
        )}
        <div className="btn-row">
          <button type="submit" className="btn primary">{hasSave && armed ? 'Replace my saved game' : 'Start Chapter 1'}</button>
          <button type="button" className="btn" onClick={onBack}>Back</button>
        </div>
        {hasSave && !armed && <p className="small muted">You already have a saved game. Starting asks you to confirm first.</p>}
      </form>

      <section className="card stack" aria-labelledby="import-h">
        <h2 id="import-h" className="x-h3">Import a backup file</h2>
        <p className="small">Load a .json save you exported earlier. The game replays every decision to check the file before it opens.</p>
        <div className="field">
          <label htmlFor="import-file">Backup file (.json)</label>
          <input id="import-file" type="file" accept=".json,application/json" onChange={onFile} />
        </div>
        {importError && <div className="banner" role="alert">Import failed: {importError}</div>}
      </section>
    </div>
  );
}

/* ================================================================ Knowledge check (shared) */

interface CheckProps {
  id: string; prompt: string; format: string; unit: string; formula: string; worked: string;
  spec: CheckSpec; fallback?: string; record: MasteryRecord; onRecord: (r: MasteryRecord) => void;
}

function answerText(spec: CheckSpec, unit: string) {
  const n = spec.variance ? Math.abs(spec.answer) : spec.answer;
  const body = unit === '$' ? fmt(Math.round(n * 100)) : `${n.toLocaleString('en-US')} ${unit}`;
  return spec.variance ? `${body} ${spec.variance}` : body;
}

function Check({ id, prompt, format, unit, formula, worked, spec, fallback, record, onRecord }: CheckProps) {
  const [raw, setRaw] = useState('');
  const [label, setLabel] = useState<'F' | 'U'>();
  const [msg, setMsg] = useState<string>();
  const done = record.correct || record.revealed;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (done) return;
    if (!raw.trim()) { setMsg('Enter a number first.'); return; }
    const value = Number(raw.replace(/[$,\s]/g, '').replace(/[−–]/g, '-'));
    if (!Number.isFinite(value)) { setMsg('Enter a plain number, such as 843 or -50.'); return; }
    const res = grade(spec, { value, label });
    // A right amount with no F/U picked is a prompt to finish the answer, not a failed attempt.
    if (!res.incomplete) onRecord({ ...record, attempts: record.attempts + 1, correct: res.correct });
    setMsg(res.correct ? undefined : res.message ?? fallback ?? 'Not quite. Check each step of the formula.');
  }

  return (
    <section className="card stack" aria-labelledby={`${id}-check`}>
      <div className="btn-row"><h3 id={`${id}-check`} className="x-m0">Knowledge check</h3><span className="tag practice">Practice case</span></div>
      <p className="objective">{prompt}</p>
      <form className="check-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor={`${id}-ans`}>Your answer</label>
          <div className="input-wrap">
            {unit === '$' && <span aria-hidden="true">$</span>}
            <input id={`${id}-ans`} inputMode="decimal" autoComplete="off" value={raw} disabled={done}
              onChange={(e) => setRaw(e.target.value)} aria-describedby={`${id}-fmt`} />
            {unit !== '$' && <span>{unit}</span>}
          </div>
          <span id={`${id}-fmt`} className="small muted">{format}</span>
        </div>
        {spec.variance && (
          <fieldset className="x-fu-set">
            <legend className="small"><strong>Direction</strong></legend>
            <div className="fu">
              {(['F', 'U'] as const).map((d) => (
                <label key={d}>
                  <input type="radio" name={`${id}-fu`} value={d} checked={label === d} disabled={done} onChange={() => setLabel(d)} />
                  <span>{d === 'F' ? 'F (favorable)' : 'U (unfavorable)'}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <button type="submit" className="btn primary" disabled={done}>Check answer</button>
      </form>

      <div className="btn-row">
        {!done && !record.hint && <button className="btn" onClick={() => onRecord({ ...record, hint: true })}>Show a hint (max 2 points)</button>}
        {!done && record.attempts > 0 && <button className="btn ghost" onClick={() => { onRecord({ ...record, revealed: true }); setMsg(undefined); }}>Reveal the answer (0 points)</button>}
        <span className="small muted">Attempts: {record.attempts}</span>
      </div>
      {record.hint && <p className="formula"><strong>Hint, the formula:</strong> {formula}</p>}

      <div aria-live="polite">
        {!done && msg && (
          <div className="callout bad feedback">
            <p><strong>Not yet.</strong> {msg}</p>
            {fallback && msg !== fallback && <p className="small">{fallback}</p>}
          </div>
        )}
        {done && (
          <div className={`callout ${record.correct && !record.revealed ? 'good' : 'bad'} feedback`}>
            <p><strong>{record.revealed ? 'Answer revealed.' : 'Correct.'}</strong> The answer is {answerText(spec, unit)}. You earned {points(record)} of 4 points.</p>
            <p className="formula"><strong>Worked solution:</strong> {worked}</p>
            {fallback && <p className="small"><strong>Common trap:</strong> {fallback}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================================================ Quick Challenge */

const QUICK: RoundId[] = ['R04', 'R10', 'R17', 'R19', 'R24'];
const REFERENCE: Choices = Object.fromEntries(ROUND_IDS.map((r, i) => [r, 'ABBCCACCCCAACCCCCCAAAACBB'[i] as OptionId]));
const R24_NPV: Cents = 364_932; // +$3,649.32 (worked solution)

const RECAP: Record<string, string> = {
  R04: 'Break-even units = fixed costs / contribution margin per unit, rounded up. Depreciation is a fixed cost even though it uses no cash.',
  R10: 'A special order is worth its incremental contribution minus its own fixed costs, less any regular sales it pushes out of a full kitchen.',
  R17: 'Price variance uses actual quantity; quantity variance uses standard price. Each points to a different cause.',
  R19: 'Flex the budget to actual volume first. Actual minus flexible isolates spending; flexible minus static isolates volume.',
  R24: 'NPV values the project. Financing changes cash and debt today but never the project\'s NPV.',
  B1: 'Allocation spreads a cost you already pay. The total stays the same.',
  B2: 'Step costs arrive in lumps. More sales can mean less profit.',
  B3: 'Inventory you still hold is an asset. Only ingredients used become expense.',
  B4: 'Judge managers on what they control.',
  B5: 'A stress test shows how far a forecast can fall before NPV turns negative.',
};

function priorChoices(r: RoundId): Choices {
  const out: Choices = {};
  ROUND_IDS.slice(0, ROUND_IDS.indexOf(r)).forEach((x) => { out[x] = REFERENCE[x]; });
  return out;
}

interface MetricTable { labels: string[]; values: Record<OptionId, (Cents | null)[]>; note: string }

/** Projected effect of each option on the reference business. Throws if the engine refuses. */
function projectQuick(r: RoundId): MetricTable {
  const prior = priorChoices(r);
  const p = Object.fromEntries(OPTION_IDS.map((o) => [o, projectOption({ choices: prior }, r, o)])) as Record<OptionId, ReturnType<typeof projectOption>>;
  if (r === 'R24') {
    return {
      labels: ['Cash right after', 'Liabilities right after', 'Project NPV'],
      values: Object.fromEntries(OPTION_IDS.map((o) => [o, [p[o].cashNow, p[o].liabilitiesNow, o === 'C' ? null : R24_NPV]])) as MetricTable['values'],
      note: 'Start of Month 5, after the Month 4 close. Buying with cash and financing 60% give the same NPV, +$3,649.32: the loan changes cash and debt, not the project.',
    };
  }
  const m = p.A.month;
  const labels = [`Month ${m} operating income`, `Cash at Month ${m} close`];
  const values = Object.fromEntries(OPTION_IDS.map((o) => [o, [p[o].operatingIncome ?? null, p[o].cashAtClose ?? null]])) as MetricTable['values'];
  let note = `Pro forma. Later rounds in Month ${m} are held at their "no new action" option.`;
  if (r === 'R19') {
    // R19B and R19C start in Month 4, so Month 3 is the same for all three; show Month 4 too.
    labels.push('Month 4 operating income', 'Cash at Month 4 close');
    for (const o of OPTION_IDS) {
      const c: Choices = { ...prior, R19: o };
      ROUND_IDS.slice(19, 23).forEach((x) => { c[x] = NEUTRAL[x]; });
      const g = runGame({ choices: c }, { projection: true });
      const close = g.closes.find((x) => x.month === 4);
      if (!close) throw new Error('The Month 4 projection did not close.');
      values[o].push(incomeStatement(g.journal.filter((e) => e.period === 4)).operatingIncome, close.cashAfter);
    }
    note = 'Pro forma. Cutting marketing and raising prices start in Month 4, so Month 3 is the same for all three. Months 3 and 4 hold later rounds at their "no new action" option.';
  }
  return { labels, values, note };
}

const show = (c: Cents | null) => (c === null ? 'n/a' : fmt(c));

function Ticket({ opt, pressed, blocked, onPick, children }: { opt: SpecOption; pressed: boolean; blocked?: string; onPick: () => void; children?: ReactNode }) {
  return (
    <button type="button" className="ticket" aria-pressed={pressed} aria-disabled={blocked ? true : undefined}
      onClick={() => { if (!blocked) onPick(); }}>
      <span className="letter">{opt.id}</span>
      <span className="title">{opt.label}</span>
      <span className="effect">{opt.effect}</span>
      {children}
      {blocked && <span className="blocked">Not available: {blocked}</span>}
    </button>
  );
}

interface QuickResult { record: MasteryRecord; choice?: OptionId }

function QuickProblem({ r, n, result, onChange, onNext, last }: {
  r: RoundId; n: number; result: QuickResult; onChange: (q: QuickResult) => void; onNext: () => void; last: boolean;
}) {
  const round = roundById(r);
  const ov = OVERLAY[r];
  const h = useFocusHeading(`quick-${r}`);
  const resolved = result.record.correct || result.record.revealed;

  const proj = useMemo(() => {
    try { return { table: projectQuick(r), avail: availability({ choices: priorChoices(r) }, r) }; } catch (e) { return { error: (e as Error).message }; }
  }, [r]);

  return (
    <article className="stack">
      <header className="round-head">
        <div className="round-meta"><span>Problem {n} of 5</span><span aria-hidden="true">·</span><span>Round {round.number}, Chapter {round.chapter}</span><span className="tag">Reference business</span></div>
        <h1 ref={h} tabIndex={-1} className="x-h1">{round.title}</h1>
        <p className="objective"><span className="muted">Objective:</span> {round.objective}</p>
        <p className="small muted">Course modules: {modulesOf(round)}</p>
      </header>
      <div className="panel"><h2 className="x-h3">Scenario</h2><p className="x-m0">{round.scenario}</p></div>

      <Check id={r} prompt={promptOf(round)} format={ov.format} unit={ov.unitLabel} formula={round.mastery_check.formula} worked={workedOf(round)}
        spec={{ answer: round.mastery_check.answer, tolerance: round.mastery_check.tolerance ?? 0, variance: ov.variance, mistakes: ov.mistakes }}
        fallback={round.mastery_check.feedback_for_wrong_answers} record={result.record} onRecord={(record) => onChange({ ...result, record })} />

      {resolved && (
        <section className="stack" aria-labelledby={`${r}-decide`}>
          <h2 id={`${r}-decide`} className="x-h3">Decide for the reference business</h2>
          {'error' in proj
            ? <div className="banner" role="alert">The projection could not be computed: {proj.error} The tickets below show the option text only.</div>
            : <p className="small muted">{proj.table.note}</p>}
          <div className="tickets">
            {round.options.map((o) => {
              const blocked = 'avail' in proj && proj.avail ? (proj.avail[o.id].ok ? undefined : proj.avail[o.id].reason) : undefined;
              return (
                <Ticket key={o.id} opt={o} pressed={result.choice === o.id} blocked={blocked} onPick={() => onChange({ ...result, choice: o.id })}>
                  {'table' in proj && proj.table && (
                    <dl>
                      {proj.table.labels.map((l, i) => (<div key={l} className="x-dl-row"><dt>{l}</dt><dd>{show(proj.table!.values[o.id][i])}</dd></div>))}
                    </dl>
                  )}
                </Ticket>
              );
            })}
          </div>
          {result.choice && 'table' in proj && proj.table && <Consequence r={r} choice={result.choice} table={proj.table} />}
          {result.choice && 'error' in proj && <p className="callout">{ov.coach}</p>}
          {result.choice && (
            <div className="btn-row"><button className="btn primary" onClick={onNext}>{last ? 'See your results' : 'Next problem'}</button></div>
          )}
        </section>
      )}
    </article>
  );
}

function Consequence({ r, choice, table }: { r: RoundId; choice: OptionId; table: MetricTable }) {
  const round = roundById(r);
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus(); }, [choice]);
  const chosen = table.values[choice];
  const label = (o: OptionId) => round.options.find((x) => x.id === o)?.label ?? o;
  return (
    <section className="card stack" aria-labelledby={`${r}-cons`}>
      <h3 id={`${r}-cons`} ref={ref} tabIndex={-1}>Consequence: you chose {choice}, {label(choice)}</h3>
      <div className="table-scroll">
        <table className="fin">
          <caption className="sr-only">Each option compared with your choice</caption>
          <thead>
            <tr><th scope="col">Option</th>{table.labels.map((l) => <th key={l} scope="col" className="num">{l}</th>)}</tr>
          </thead>
          <tbody>
            {OPTION_IDS.map((o) => (
              <tr key={o} className={o === choice ? 'x-chosen' : undefined}>
                <th scope="row">{o}{o === choice ? ' (your choice)' : ''}</th>
                {table.values[o].map((v, i) => {
                  const base = chosen[i];
                  const d = v !== null && base !== null && o !== choice ? v - base : null;
                  return (
                    <td key={i} className="num">
                      {show(v)}
                      {d !== null && <span className="x-delta">{d === 0 ? 'same' : `${fmt(d, { sign: true })} vs yours`}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><strong>How the books record it:</strong> {round.accounting_posting}</p>
      <p className="callout"><strong>Coach:</strong> {OVERLAY[r].coach}</p>
      <p className="callout good">A choice that earns less this month is not automatically wrong. Cash cushions, capacity and risk can justify it. Defend your reasoning with the numbers above.</p>
    </section>
  );
}

export function QuickChallenge({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(-1); // -1 intro, 0..4 problems, 5 summary
  const [results, setResults] = useState<QuickResult[]>(() => QUICK.map(() => ({ record: EMPTY_RECORD })));
  const total = results.reduce((s, x) => s + points(x.record), 0);

  if (step < 0) return <QuickIntro onStart={() => setStep(0)} onExit={onExit} />;
  if (step >= QUICK.length) {
    return <Summary title="Quick Challenge results" kind="quick" score={total}
      rows={QUICK.map((r, i) => ({ id: r, title: roundById(r).title, record: results[i].record, choice: results[i].choice ? `${results[i].choice}, ${roundById(r).options.find((o) => o.id === results[i].choice)?.label}` : 'none' }))}
      onExit={onExit} onAgain={() => { setResults(QUICK.map(() => ({ record: EMPTY_RECORD }))); setStep(0); }} />;
  }
  return (
    <div className="stack">
      <ScoreBar step={step} score={total} onExit={onExit} />
      <QuickProblem key={QUICK[step]} r={QUICK[step]} n={step + 1} result={results[step]} last={step === QUICK.length - 1}
        onChange={(q) => setResults((rs) => rs.map((x, i) => (i === step ? q : x)))} onNext={() => setStep(step + 1)} />
    </div>
  );
}

function QuickIntro({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const h = useFocusHeading('quick-intro');
  return (
    <div className="stack x-narrow">
      <h1 ref={h} tabIndex={-1}>Quick Challenge</h1>
      <p className="lede">Five key rounds from the full game, about 5 to 8 minutes.</p>
      <div className="panel stack">
        <p className="x-m0"><span className="tag">Reference business</span> Each problem runs on a ready-made company: the reference path the team checked to the cent. It is not your company and nothing is saved. Your choices here show their projected effect on that business.</p>
        <ol className="x-list">
          {QUICK.map((r) => <li key={r}><strong>{roundById(r).title}.</strong> {roundById(r).objective}</li>)}
        </ol>
        <p className="x-m0 small">Score: 4 points for a right first answer with no hint, 2 after a hint or retry, 0 if you reveal it. 20 points in all.</p>
      </div>
      <div className="btn-row">
        <button className="btn primary" onClick={onStart}>Start problem 1</button>
        <button className="btn" onClick={onExit}>Back to start</button>
      </div>
    </div>
  );
}

function ScoreBar({ step, score, onExit }: { step: number; score: number; onExit: () => void }) {
  return (
    <div className="x-scorebar">
      <div className="x-pips" aria-hidden="true">{QUICK.map((_, i) => <span key={i} className={i < step ? 'done' : i === step ? 'now' : ''} />)}</div>
      <span className="small"><strong>{score}</strong> of 20 points</span>
      <button className="btn ghost" onClick={onExit}>Leave</button>
    </div>
  );
}

function Summary({ title, kind, score, rows, extra, onExit, onAgain }: {
  title: string; kind: 'quick' | 'bonus'; score: number; extra?: ReactNode;
  rows: { id: string; title: string; record: MasteryRecord; choice: string; best?: boolean }[]; onExit: () => void; onAgain: () => void;
}) {
  const h = useFocusHeading(`${kind}-summary`);
  return (
    <div className="stack">
      <h1 ref={h} tabIndex={-1}>{title}</h1>
      <div className="kpis">
        <div className="kpi"><div className="label">Knowledge-check score</div><div className="value">{score} / 20</div></div>
        {extra}
      </div>
      <div className="table-scroll">
        <table className="fin">
          <caption>Problem by problem</caption>
          <thead><tr><th scope="col">Problem</th><th scope="col" className="num">Points</th><th scope="col">How</th><th scope="col">Your decision</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <th scope="row">{x.title}</th>
                <td className="num">{points(x.record)} / 4</td>
                <td>{x.record.revealed ? 'Revealed' : x.record.correct ? `${x.record.attempts} ${x.record.attempts === 1 ? 'try' : 'tries'}${x.record.hint ? ', hint used' : ''}` : 'Not answered'}</td>
                <td>{x.choice}{x.best === undefined ? '' : x.best ? ' (best)' : ' (not the best)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card">
        <h2 className="x-h3">Concept recap</h2>
        <ul className="x-list">{rows.map((x) => <li key={x.id}><strong>{x.title}:</strong> {RECAP[x.id]}</li>)}</ul>
      </section>
      <div className="btn-row">
        {kind === 'quick' && <button className="btn primary" onClick={onExit}>Play the full career</button>}
        <button className="btn" onClick={onAgain}>Try again</button>
        <button className="btn" onClick={onExit}>Back to start</button>
      </div>
    </div>
  );
}

/* ================================================================ Mastery Lab */

const BONUS_CHECK: Record<string, { answer: number; tolerance: number; mistakes: Mistake[] }> = {
  B1: { answer: 450, tolerance: 0.01, mistakes: [{ value: 900, message: 'That is an equal split. Use the prep-hour driver: 25 of 100 hours.' }, { value: 1350, message: 'That is the bowls\' share. The question asks for wraps.' }] },
  B2: { answer: -50, tolerance: 0.01, mistakes: [{ value: 350, message: 'That is the extra contribution only. Subtract the $400 shift cost.' }] },
  B3: { answer: 280, tolerance: 0.01, mistakes: [{ value: 720, message: '$720 is the cost of ingredients used, which becomes expense. The question asks what is left.' }, { value: 1000, message: 'That is what you bought. Subtract the $720 used in meals sold.' }] },
  B4: { answer: 0, tolerance: 0.01, mistakes: [{ value: 500, message: 'The storm is outside the kitchen manager\'s control, so none of it is a controllable cost.' }] },
  B5: { answer: 688, tolerance: 1, mistakes: [{ value: 3649, message: 'That is the original NPV at $6,500 a year. Use the stressed $5,525.' }, { value: 7100, message: 'You did not discount. Each future dollar is worth less today at 12%.' }, { value: -1219, message: 'You left out the $3,000 resale in Year 4 (PV $1,906.55).' }] },
};

interface BonusResult { record: MasteryRecord; choice?: OptionId }

function BonusCase({ n, result, onChange, onNext, last }: { n: number; result: BonusResult; onChange: (b: BonusResult) => void; onNext: () => void; last: boolean }) {
  const b = BONUS[n];
  const h = useFocusHeading(`bonus-${b.id}`);
  const cfg = BONUS_CHECK[b.id];
  const best = BONUS_BEST[b.id];
  const resolved = result.record.correct || result.record.revealed;
  return (
    <article className="stack">
      <header className="round-head">
        <div className="round-meta"><span>Case {n + 1} of {BONUS.length}</span><span aria-hidden="true">·</span><span>Topic: {b.topic}</span></div>
        <h1 ref={h} tabIndex={-1} className="x-h1">{b.title}</h1>
      </header>
      <div className="panel"><h2 className="x-h3">Scenario</h2><p className="x-m0">{b.scenario}</p></div>
      <Check id={b.id} prompt={b.mastery_check.prompt} format={b.id === 'B2' ? 'Dollars; enter a loss as a negative number' : b.id === 'B5' ? 'Dollars, rounded to the nearest dollar' : 'Dollars'}
        unit="$" formula={b.mastery_check.formula} worked={b.mastery_check.worked_solution} spec={{ answer: cfg.answer, tolerance: cfg.tolerance, mistakes: cfg.mistakes }}
        fallback={b.feedback_for_wrong_answers} record={result.record} onRecord={(record) => onChange({ ...result, record })} />
      {resolved && (
        <section className="stack" aria-labelledby={`${b.id}-judge`}>
          <h2 id={`${b.id}-judge`} className="x-h3">Your judgment</h2>
          <div className="tickets">
            {b.options.map((o) => <Ticket key={o.id} opt={o} pressed={result.choice === o.id} onPick={() => onChange({ ...result, choice: o.id })} />)}
          </div>
          {result.choice && (
            <div className="card stack" aria-live="polite">
              <p className={`callout ${result.choice === best ? 'good' : 'bad'}`}>
                <strong>{result.choice === best ? 'Best choice.' : `Not the best choice. The best is ${best}.`}</strong> {b.feedback_for_wrong_answers}
              </p>
              <ul className="x-list">
                {b.options.map((o) => <li key={o.id}><strong>{o.id}, {o.label}{o.id === best ? ' (best)' : ''}:</strong> {o.effect}</li>)}
              </ul>
              <div className="btn-row"><button className="btn primary" onClick={onNext}>{last ? 'See your results' : 'Next case'}</button></div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

export function BonusLab({ onExit }: { onExit: () => void }) {
  const fresh = () => BONUS.map(() => ({ record: EMPTY_RECORD }) as BonusResult);
  const [step, setStep] = useState(-1);
  const [results, setResults] = useState<BonusResult[]>(fresh);
  const h = useFocusHeading('bonus-intro');
  const total = results.reduce((s, x) => s + points(x.record), 0);
  const judged = results.filter((x, i) => x.choice === BONUS_BEST[BONUS[i].id]).length;

  if (step < 0) {
    return (
      <div className="stack x-narrow">
        <h1 ref={h} tabIndex={-1}>Mastery Lab</h1>
        <p className="lede">Five optional harder cases. Each has a knowledge check and a judgment call.</p>
        <p className="panel">These are standalone practice cases. They never touch your company's ledger or your saved game.</p>
        <ol className="x-list">{BONUS.map((b) => <li key={b.id}><strong>{b.title}</strong> <span className="muted small">({b.topic})</span></li>)}</ol>
        <div className="btn-row">
          <button className="btn primary" onClick={() => setStep(0)}>Start case 1</button>
          <button className="btn" onClick={onExit}>Back to start</button>
        </div>
      </div>
    );
  }
  if (step >= BONUS.length) {
    return <Summary title="Mastery Lab results" kind="bonus" score={total}
      extra={<div className="kpi"><div className="label">Best judgment calls</div><div className="value">{judged} / {BONUS.length}</div></div>}
      rows={BONUS.map((b, i) => ({ id: b.id, title: b.title, record: results[i].record, choice: results[i].choice ?? 'none', best: results[i].choice ? results[i].choice === BONUS_BEST[b.id] : undefined }))}
      onExit={onExit} onAgain={() => { setResults(fresh()); setStep(0); }} />;
  }
  return (
    <div className="stack">
      <div className="x-scorebar">
        <span className="tag practice">Practice case: never touches your ledger</span>
        <span className="small"><strong>{total}</strong> of 20 points</span>
        <button className="btn ghost" onClick={onExit}>Leave</button>
      </div>
      <BonusCase key={step} n={step} result={results[step]} last={step === BONUS.length - 1}
        onChange={(q) => setResults((rs) => rs.map((x, i) => (i === step ? q : x)))} onNext={() => setStep(step + 1)} />
    </div>
  );
}

/* ================================================================ Glossary */

const placeName = (id: string) => {
  const r = ROUNDS.find((x) => x.id === id);
  if (r) return `Round ${r.number}: ${r.title}`;
  const b = BONUS.find((x) => x.id === id);
  return b ? `Mastery Lab ${b.id}: ${b.title}` : id;
};

export function GlossaryPage({ onExit }: { onExit: () => void }) {
  const h = useFocusHeading('glossary');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const list = GLOSSARY.filter((g) => !needle || `${g.term} ${g.definition} ${g.formula ?? ''}`.toLowerCase().includes(needle));
  return (
    <div className="stack x-narrow">
      <div className="btn-row x-between"><h1 ref={h} tabIndex={-1} className="x-m0">Glossary</h1><button className="btn" onClick={onExit}>Back to start</button></div>
      <div className="field">
        <label htmlFor="gloss-q">Search terms</label>
        <input id="gloss-q" type="search" className="x-text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="For example: contribution margin" />
      </div>
      <p className="small muted" aria-live="polite">{list.length} of {GLOSSARY.length} terms</p>
      {list.map((g) => (
        <article key={g.term} className="card">
          <h2 className="x-h3">{g.term}</h2>
          <dl className="x-defs">
            <dt>Definition</dt><dd>{g.definition}</dd>
            {g.formula && <><dt>Formula</dt><dd className="formula">{g.formula}</dd></>}
            {g.example && <><dt>Example</dt><dd>{g.example}</dd></>}
            {g.rounds.length > 0 && <><dt>Where it appears</dt><dd>{g.rounds.map(placeName).join('; ')}</dd></>}
          </dl>
        </article>
      ))}
      {!list.length && <p>No term matches "{q}". Try a shorter word.</p>}
    </div>
  );
}

/* ================================================================ Sources and assumptions */

const RESOLVED_RULES: { rule: string; text: string }[] = [
  { rule: 'Who gets served first', text: 'When orders exceed capacity, the kitchen serves catering first, then walk-up bowls, wraps and premium bowls, then direct pickup and coupons, then delivery app orders.' },
  { rule: 'Demand is not sales', text: 'You book revenue and food cost only for meals you actually serve. Customers you turn away show up as lost demand, not as sales.' },
  { rule: 'The Month 3 budget', text: 'Your Month 3 budget locks after Round 15. It leaves out the bad weather and the food-waste surcharge, so both show up later as variances.' },
  { rule: 'Variances', text: 'Every variance appears as a positive amount plus F (favorable: raised income) or U (unfavorable: lowered income).' },
  { rule: 'Dropping wraps (Round 20)', text: 'If you drop wraps, wrap buyers leave rather than switch to bowls. You gain only the 100 new bowl prospects, and the wrap menu fee stops.' },
  { rule: 'Cash reserve', text: 'Equipment upgrades, the second truck and owner distributions require you to keep $2,000 in the bank, based on cash already posted. A blocked ticket tells you why.' },
  { rule: 'Rescue', text: 'If cash falls below $0 at a month close, you choose an owner contribution or a bridge loan of the shortfall plus $2,000 (1.5% a month), or restart the chapter. Neither is revenue.' },
];

export function SourcesPage({ onExit }: { onExit: () => void }) {
  const h = useFocusHeading('sources');
  return (
    <div className="stack x-narrow">
      <div className="btn-row x-between"><h1 ref={h} tabIndex={-1} className="x-m0">Sources and assumptions</h1><button className="btn" onClick={onExit}>Back to start</button></div>

      <section className="card">
        <h2>Expected time</h2>
        <ul className="x-list">
          <li>Full career: about 30 minutes for 25 rounds. It saves as you go.</li>
          <li>Quick Challenge: 5 to 8 minutes for 5 rounds on a reference business.</li>
          <li>Mastery Lab: about 10 minutes for 5 optional cases.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Key rules the game applies</h2>
        <dl className="x-defs">{RESOLVED_RULES.map((r) => <div key={r.rule}><dt>{r.rule}</dt><dd>{r.text}</dd></div>)}</dl>
      </section>

      <section className="card">
        <h2>Model assumptions</h2>
        <dl className="x-defs">{ASSUMPTIONS.map((a) => <div key={a.area}><dt>{a.area}</dt><dd>{a.rule}</dd></div>)}</dl>
      </section>

      <section className="card">
        <h2>Sources</h2>
        <dl className="x-defs">{SOURCES.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.detail}</dd></div>)}</dl>
      </section>

      <section className="card">
        <h2>Accessibility</h2>
        <ul className="x-list">
          <li>Tab and Shift+Tab move between controls. Enter or Space picks an order ticket or presses a button.</li>
          <li>Left and right arrow keys switch tabs in the financial reports.</li>
          <li>Each new screen moves focus to its heading, so screen readers start at the top.</li>
          <li>Feedback never relies on color alone: it uses words, signs and F or U labels.</li>
          <li>The game has no audio. It respects your device's reduced-motion setting.</li>
          <li>Layouts fit a 375-pixel phone screen without sideways scrolling.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Originality</h2>
        <p>The team drew every illustration as original SVG art for this game. The game reproduces no textbook problems, solutions or figures. Easton, Financial &amp; Managerial Accounting for MBAs, 7th edition, is credited only as topic inspiration. All businesses and numbers are fictional.</p>
      </section>
    </div>
  );
}
