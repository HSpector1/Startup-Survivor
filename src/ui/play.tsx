import { useMemo, useState, type FormEvent } from 'react';
import { CLOSE_AFTER, NEUTRAL, ROUND_IDS, roundPeriod, type OptionId, type RoundId } from '../engine/model';
import { availability, projectOption, projectThroughMonth4, periodLabel, targetMonth, type GameState, type HorizonProjection, type Projection } from '../engine/sim';
import { balanceSheet, incomeStatement } from '../engine/ledger';
import { fmt } from '../engine/money';
import { EXECUTION_BY_POINTS, FEEDS_MONTH, executionFactors, grade, points, recordAttempt, resolved, type MasteryRecord } from '../engine/scoring';
import { CHAPTERS, CHAPTER_BLURB, OVERLAY, answerTextOf, formulaOf, roundById, roundText, workedOf } from '../content/rounds';
import { effectSummary, insightFor } from '../content/insights';
import { exportSave, chapterOf, gameInput, type Save } from '../state';
import { ChapterIcon, TruckIcon } from './art';
import { Delta, JournalView, Money, TableScroll, useFocusHeading } from './common';

const OPTS: OptionId[] = ['A', 'B', 'C'];

// ---------------------------------------------------------------- round

export function RoundView({ round, save, game, record, onRecord, onDecide }: {
  round: RoundId; save: Save; game: GameState; record: MasteryRecord;
  onRecord: (r: MasteryRecord) => void; onDecide: (o: OptionId) => void;
}) {
  const spec = roundById(round);
  const ov = OVERLAY[round];
  const head = useFocusHeading(round);
  const input = gameInput(save);
  const insight = useMemo(() => insightFor(round, input, game), [round, game]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = resolved(record);
  const text = roundText(spec);

  return (
    <article className="stack" aria-labelledby="round-title">
      <header className="round-head">
        <div className="chapter-strip">
          <ChapterIcon chapter={spec.chapter as 1 | 2 | 3 | 4 | 5} />
          <div className="round-meta">
            <span>Round {spec.number} of 25</span>
            <span aria-hidden="true">/</span>
            <span>Chapter {spec.chapter}: {CHAPTERS[spec.chapter - 1]}</span>
            <span className="tag">{periodLabel(roundPeriod(round))}</span>
          </div>
        </div>
        <h1 id="round-title" ref={head} tabIndex={-1}>{spec.title}</h1>
        <p className="objective"><span className="muted">Learning goal:</span> {text.objective}</p>
        <p className="small muted" style={{ margin: 0 }}>Course topics: {text.modules}</p>
      </header>

      <section className="card" aria-labelledby="story">
        <h2 id="story" className="sr-only">The situation</h2>
        <p style={{ fontSize: '1.08rem', margin: 0 }}>{text.scenario}</p>
      </section>

      {insight && (
        <section className="panel" aria-labelledby="yours">
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            <h2 id="yours" style={{ fontSize: '1.1rem', margin: 0 }}>{insight.title}</h2>
            <span className={`tag ${insight.tag === 'actual' ? 'actual' : 'forecast'}`}>{insight.tag === 'actual' ? 'Your actual numbers' : insight.tag === 'plan' ? 'Your plan' : 'Pro forma'}</span>
          </div>
          <dl className="insight">
            {insight.rows.map((r) => (
              <div key={r.label} className="insight-row">
                <dt>{r.label}{r.note && <span className="small muted"> · {r.note}</span>}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          {insight.note && <p className="small muted" style={{ margin: '.5rem 0 0' }}>{insight.note}</p>}
        </section>
      )}

      <KnowledgeCheck round={round} prompt={text.prompt} record={record} onRecord={onRecord} affects={!!save.masteryAffectsSales} />

      <section aria-labelledby="decide" className="stack">
        <div>
          <h2 id="decide">Your decision</h2>
          <p className="muted" style={{ margin: 0 }}>
            {ready ? ov.coach : 'Answer or reveal the practice question to unlock the decision.'}
          </p>
        </div>
        {ready && <Decision round={round} save={save} onDecide={onDecide} />}
      </section>
    </article>
  );
}

function KnowledgeCheck({ round, prompt, record, onRecord, affects }: { round: RoundId; prompt: string; record: MasteryRecord; onRecord: (r: MasteryRecord) => void; affects: boolean }) {
  const spec = roundById(round);
  const ov = OVERLAY[round];
  const mc = spec.mastery_check;
  const [value, setValue] = useState('');
  const [label, setLabel] = useState<'F' | 'U' | undefined>();
  const [msg, setMsg] = useState<{ ok: boolean; text?: string } | null>(null);
  const done = resolved(record);

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(value.replace(/[$,\s]/g, ''));
    if (value.trim() === '' || !Number.isFinite(n)) { setMsg({ ok: false, text: 'Enter a number, for example 1250 or 6.63.' }); return; }
    const g = grade({ answer: mc.answer, tolerance: mc.tolerance ?? 0, variance: ov.variance, mistakes: ov.mistakes }, { value: n, label });
    // A right amount with no F/U picked is a prompt to finish the answer, not a failed attempt.
    if (!g.incomplete) onRecord(recordAttempt(record, { value: n, label }, g.correct));
    setMsg({ ok: g.correct, text: g.message });
  }

  const answerText = answerTextOf(spec);
  const pts = points(record);

  return (
    <section className="card" aria-labelledby="check">
      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 id="check" style={{ margin: 0 }}>Knowledge check</h2>
        <span className="tag practice">Practice case: standard numbers, not your business</span>
      </div>
      <p style={{ marginTop: '.75rem', fontWeight: 600 }}>{prompt}</p>

      {!done && (
        <form className="check-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor={`ans-${round}`}>Your answer <span className="muted small">({ov.format})</span></label>
            <div className="input-wrap">
              {ov.unitLabel === '$' && <span aria-hidden="true">$</span>}
              <input id={`ans-${round}`} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)}
                aria-describedby={msg ? `fb-${round}` : undefined} />
              {ov.unitLabel !== '$' && <span aria-hidden="true">{ov.unitLabel}</span>}
            </div>
          </div>
          {ov.variance && (
            <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="small" style={{ fontWeight: 600, marginBottom: '.3rem' }}>Direction</legend>
              <div className="fu">
                <label><input type="radio" name={`fu-${round}`} checked={label === 'F'} onChange={() => setLabel('F')} /><span>F (favorable)</span></label>
                <label><input type="radio" name={`fu-${round}`} checked={label === 'U'} onChange={() => setLabel('U')} /><span>U (unfavorable)</span></label>
              </div>
            </fieldset>
          )}
          <button className="btn primary" type="submit">Check answer</button>
          {!record.hint && <button type="button" className="btn" onClick={() => onRecord({ ...record, hint: true })}>Show a hint</button>}
          {record.attempts > 0 && <button type="button" className="btn ghost" onClick={() => onRecord({ ...record, revealed: true })}>Reveal the answer</button>}
        </form>
      )}

      {record.hint && !done && <p className="formula" style={{ marginTop: '1rem' }}><strong>Hint:</strong> {formulaOf(spec)}</p>}

      <div id={`fb-${round}`} className="feedback" role="status" aria-live="polite">
        {!done && msg && !msg.ok && (
          <div className="callout bad">
            <p style={{ marginBottom: '.4rem' }}><strong>Not yet.</strong> {msg.text ?? mc.feedback_for_wrong_answers}</p>
            {msg.text && <p className="small muted" style={{ margin: 0 }}>{mc.feedback_for_wrong_answers}</p>}
          </div>
        )}
        {done && (
          <div className={`callout ${record.correct && !record.revealed ? 'good' : 'bad'}`}>
            <p style={{ marginBottom: '.4rem' }}>
              <strong>{record.correct && !record.revealed ? 'Correct.' : 'Here is the answer.'}</strong> {answerText}
              <span className="muted small"> · {pts} of 4 mastery points</span>
            </p>
            <p className="formula" style={{ margin: '.4rem 0' }}>{formulaOf(spec)}</p>
            <p style={{ margin: 0 }}>{workedOf(spec)}</p>
            {(!record.correct || record.revealed || record.attempts > 1) && <p className="small muted" style={{ margin: '.5rem 0 0' }}>{mc.feedback_for_wrong_answers}</p>}
            {affects && FEEDS_MONTH(spec.number) > 0 && (
              <p className="small" style={{ margin: '.5rem 0 0' }}>
                <strong>Execution:</strong> {Math.round(EXECUTION_BY_POINTS[pts] * 100)}% for this check. Month {FEEDS_MONTH(spec.number)} customer demand uses the average of its checks (4 points = 100%, 2 = 90%, 0 = 75%).
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function projectionRows(p: Projection): [string, string][] {
  if (p.month === 0) return [['Cash after this choice', fmt(p.cashNow)], ['Liabilities after', fmt(p.liabilitiesNow)], ['Equity after', fmt(p.equityNow)]];
  return [[`Month ${p.month} operating income`, fmt(p.operatingIncome!)], [`Cash at Month ${p.month} close`, fmt(p.cashAtClose!)]];
}

function Decision({ round, save, onDecide }: { round: RoundId; save: Save; onDecide: (o: OptionId) => void }) {
  const spec = roundById(round);
  const input = gameInput(save);
  const av = useMemo(() => availability(input, round), [round, save.choices]); // eslint-disable-line react-hooks/exhaustive-deps
  const proj = useMemo(() => OPTS.map((o) => projectOption(input, round, o)), [round, save.choices, save.mastery]); // eslint-disable-line react-hooks/exhaustive-deps
  const horizon = useMemo(() => OPTS.map((o) => projectThroughMonth4(input, round, o)), [round, save.choices, save.mastery]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pick, setPick] = useState<OptionId | null>(null);
  const m = targetMonth(round);
  const truckVariant = { A: 'used', B: 'refurbished', C: 'premium' } as const;

  return (
    <>
      <p className="small muted" style={{ margin: 0 }}>
        {m ? `Projected figures are pro forma: they assume no new action in later rounds and become actual only at each close.${m < 4 ? ` "Months ${m}–4" adds up operating income through the Month 4 close, so investments that pay back later get a fair hearing.` : ''}` : 'These decisions happen after the Month 4 close. They change the balance sheet, not Month 4 profit.'}
      </p>
      <div className="tickets" role="group" aria-label="Choose one option">
        {OPTS.map((o, i) => {
          const opt = spec.options[i];
          const blocked = !av[o].ok;
          return (
            <div key={o} className="ticket" role="button" tabIndex={0} aria-pressed={pick === o} aria-disabled={blocked}
              onClick={() => !blocked && setPick(o)} aria-describedby={blocked ? `why-${o}` : undefined}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !blocked) { e.preventDefault(); setPick(o); } }}>
              <span className="letter" aria-hidden="true">{o}</span>
              {round === 'R01' && <TruckIcon variant={truckVariant[o]} className="ticket-art" />}
              <span className="title">{opt.label}</span>
              <span className="effect">{opt.effect}</span>
              <ul className="effect-list">{effectSummary(round, o).map((t) => <li key={t}>{t}</li>)}</ul>
              <dl>
                {projectionRows(proj[i]).map(([k, v]) => (<span key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></span>))}
                {m !== 0 && m < 4 && horizon[i] && <><dt>Months {m}–4 operating income</dt><dd>{fmt(horizon[i]!.operatingIncome)}</dd></>}
              </dl>
              {proj[i].month !== 0 && proj[i].calc && proj[i].calc!.lost > 0 && <span className="small muted">{proj[i].calc!.lost.toLocaleString()} orders turned away for lack of capacity</span>}
              {blocked && <span className="blocked" id={`why-${o}`}>Not available: {av[o].reason}</span>}
            </div>
          );
        })}
      </div>
      <div className="btn-row">
        <button className="btn primary" disabled={!pick} onClick={() => pick && onDecide(pick)}>
          {pick ? `Confirm option ${pick}` : 'Pick an option'}
        </button>
        <span className="small muted">Decisions are final, like real ones. Your answers to knowledge checks never change your ledger.</span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- consequence

function HorizonCells({ h, mine, isMine }: { h: HorizonProjection; mine: HorizonProjection; isMine: boolean }) {
  return (
    <>
      <td className="num"><Money c={h.operatingIncome} /> {!isMine && <span className="small"><Delta before={mine.operatingIncome} after={h.operatingIncome} /></span>}</td>
      <td className="num"><Money c={h.cashAtMonth4} /></td>
    </>
  );
}

/** One plain sentence judging the choice on this month and, where it matters, through Month 4. */
function verdict(mine: number, best: number, mineH: number | null, bestH: number, m: number): string {
  const fair = ' A smaller number is not automatically a wrong decision: cash safety and risk matter too.';
  if (mineH === null) {
    return mine === best ? 'Your choice gives the highest projected operating income this month.' : `Another option projects ${fmt(best - mine)} more operating income this month.${fair}`;
  }
  if (mine === best && mineH === bestH) return `Your choice gives the highest projected operating income this month and through Month 4.`;
  if (mineH === bestH) return `Another option earns ${fmt(best - mine)} more in Month ${m}, but yours projects the most operating income through Month 4: it pays back later.`;
  if (mine === best) return `Your choice earns the most in Month ${m}, but another option projects ${fmt(bestH - mineH)} more through Month 4.${fair}`;
  return `Another option projects ${fmt(best - mine)} more this month and ${fmt(bestH - mineH)} more through Month 4.${fair}`;
}

export function ConsequenceView({ round, save, game, onContinue }: { round: RoundId; save: Save; game: GameState; onContinue: () => void }) {
  const spec = roundById(round);
  const chosen = save.choices[round]!;
  const head = useFocusHeading(`c-${round}`);
  const prior = { ...gameInput(save), choices: Object.fromEntries(ROUND_IDS.slice(0, ROUND_IDS.indexOf(round)).map((r) => [r, save.choices[r]])) };
  const proj = useMemo(() => OPTS.map((o) => projectOption(prior, round, o)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const horizon = useMemo(() => OPTS.map((o) => projectThroughMonth4(prior, round, o)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = proj[OPTS.indexOf(chosen)];
  const mineH = horizon[OPTS.indexOf(chosen)];
  const immediate = game.journal.filter((e) => e.round === round && !e.id.startsWith('M'));
  const before = balanceSheet(game.journal.filter((e) => e.round !== round));
  const after = balanceSheet(game.journal.filter((e) => !(e.round === round && e.id.startsWith('M'))));
  const close = CLOSE_AFTER[round];
  const m = targetMonth(round);
  const opt = spec.options[OPTS.indexOf(chosen)];
  const bestIncome = m ? Math.max(...proj.map((p) => p.operatingIncome!)) : 0;
  const showH = m !== 0 && m < 4 && !!mineH;
  const bestH = showH ? Math.max(...horizon.map((h) => h!.operatingIncome)) : 0;

  return (
    <article className="stack">
      <header className="round-head">
        <div className="round-meta"><span>Round {spec.number}: {spec.title}</span></div>
        <h1 ref={head} tabIndex={-1}>You chose {chosen}: {opt.label}</h1>
      </header>

      <section className="card">
        <h2>What posted to your books</h2>
        {immediate.length ? (
          <>
            <JournalView events={immediate} />
            <div className="kpis" style={{ marginTop: '1rem' }}>
              {([['Cash', before.cash, after.cash], ['Total assets', before.totalAssets, after.totalAssets], ['Liabilities', before.totalLiabilities, after.totalLiabilities], ['Equity', before.totalEquity, after.totalEquity]] as const).map(([l, b, a]) => (
                <div className="kpi" key={l}><div className="label">{l}</div><div className="value"><Money c={a} /></div><div className="delta"><Delta before={b} after={a} invert={l === 'Liabilities'} /></div></div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: '.75rem' }}>Before and after this decision. {after.balanced ? 'Assets still equal liabilities plus equity.' : ''}</p>
          </>
        ) : (
          <p style={{ margin: 0 }}>Nothing posts yet. This decision changes how {m ? `Month ${m}` : 'the business'} runs, and its revenue and costs post once, at the {m ? `Month ${m} close` : 'next close'}.</p>
        )}
      </section>

      {m !== 0 && (
        <section className="card">
          <h2>How your choice compares <span className="tag forecast">Pro forma</span></h2>
          <TableScroll>
            <table className="fin">
              <caption className="sr-only">Projected Month {m} results under each option</caption>
              <thead><tr><th>Option</th><th className="num">Month {m} operating income</th><th className="num">Cash at Month {m} close</th><th className="num">Orders turned away</th>
                {showH && <><th className="num">Months {m}–4 operating income</th><th className="num">Cash at Month 4 close</th></>}</tr></thead>
              <tbody>
                {proj.map((p, i) => (
                  <tr key={p.option} className={p.option === chosen ? 'sub' : undefined}>
                    <td>{p.option}: {spec.options[i].label}{p.option === chosen ? ' (your choice)' : ''}</td>
                    <td className="num"><Money c={p.operatingIncome!} /> {p.option !== chosen && <span className="small"><Delta before={mine.operatingIncome!} after={p.operatingIncome!} /></span>}</td>
                    <td className="num"><Money c={p.cashAtClose!} /></td>
                    <td className="num">{p.calc?.lost.toLocaleString() ?? '0'}</td>
                    {showH && <HorizonCells h={horizon[i]!} mine={mineH!} isMine={p.option === chosen} />}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <p className="small muted" style={{ marginTop: '.75rem' }}>
            {verdict(mine.operatingIncome!, bestIncome, showH ? mineH!.operatingIncome : null, bestH, m as number)}
            {' '}Projections assume no new action in later rounds; the same scenario events hit every option.
          </p>
        </section>
      )}

      <section className="card">
        <h2>The accounting</h2>
        <p>{spec.accounting_posting}</p>
        <p className="callout" style={{ margin: 0 }}>{OVERLAY[round].coach}</p>
      </section>

      <div className="btn-row">
        <button className="btn primary" onClick={onContinue}>
          {close ? `Close Month ${close}` : round === 'R25' ? 'See the investor report' : round === 'R05' ? 'Finish Chapter 1' : 'Next round'}
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- checkpoint

export function CheckpointView({ chapter, save, game, onContinue }: { chapter: number; save: Save; game: GameState; onContinue: () => void }) {
  const head = useFocusHeading(`cp-${chapter}`);
  const rounds = ROUND_IDS.slice((chapter - 1) * 5, chapter * 5);
  const pts = rounds.reduce((s, r) => s + points(save.mastery[r]), 0);
  const bs = balanceSheet(game.journal);
  const last = game.closes[game.closes.length - 1];
  const lastIS = last ? incomeStatement(game.journal.filter((e) => e.period === last.month)) : null;
  const truckCap = { A: 1200, B: 1550, C: 2100 }[save.choices.R01 ?? 'A'];
  const price = { A: 1000, B: 1200, C: 1400 }[save.choices.R03 ?? 'B'];

  return (
    <article className="stack">
      <header className="round-head">
        <div className="chapter-strip"><ChapterIcon chapter={chapter as 1 | 2 | 3 | 4 | 5} /><span className="round-meta">Checkpoint saved</span></div>
        <h1 ref={head} tabIndex={-1}>Chapter {chapter} complete: {CHAPTERS[chapter - 1]}</h1>
        <p className="objective">{CHAPTER_BLURB[chapter - 1]}</p>
      </header>

      <div className="kpis">
        <div className="kpi"><div className="label">Posted cash</div><div className="value"><Money c={bs.cash} /></div></div>
        <div className="kpi"><div className="label">Book equity</div><div className="value"><Money c={bs.totalEquity} /></div></div>
        {lastIS && <div className="kpi"><div className="label">Month {last.month} operating income</div><div className="value"><Money c={lastIS.operatingIncome} tone /></div></div>}
        {chapter === 1 && <div className="kpi"><div className="label">Truck capacity</div><div className="value">{truckCap.toLocaleString()} meals</div></div>}
        {chapter === 1 && <div className="kpi"><div className="label">Bowl price</div><div className="value"><Money c={price} /></div></div>}
        <div className="kpi"><div className="label">Chapter mastery</div><div className="value">{pts} / 20</div></div>
      </div>

      <section className="card">
        <h2>Your chapter in review</h2>
        <TableScroll>
          <table className="fin">
            <caption className="sr-only">Decisions and knowledge-check points this chapter</caption>
            <thead><tr><th>Round</th><th>What you learned</th><th>Your decision</th><th className="num">Points</th></tr></thead>
            <tbody>
              {rounds.map((r) => {
                const s = roundById(r);
                const o = save.choices[r];
                return (
                  <tr key={r}>
                    <td>{s.number}. {s.title}</td>
                    <td className="small">{s.objective}</td>
                    <td className="small">{o ? `${o}: ${s.options[OPTS.indexOf(o)].label}` : 'not decided'}</td>
                    <td className="num">{points(save.mastery[r])} / 4</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
        <p className="small muted" style={{ marginTop: '.75rem' }}>Mastery points measure your accounting answers. Business results are judged separately, in the books.</p>
      </section>

      <section className="panel">
        <h2 style={{ fontSize: '1.1rem' }}>Saved in this browser</h2>
        <p className="small" style={{ marginBottom: '.75rem' }}>If you close the tab, you return to this point. Export a backup file to move to another device.</p>
        <button className="btn" onClick={() => exportSave(save)}>Export a backup file</button>
      </section>

      <div className="btn-row">
        <button className="btn primary" onClick={onContinue}>{chapter < 5 ? `Start Chapter ${chapter + 1}: ${CHAPTERS[chapter]}` : 'Continue'}</button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- the till

export function Till({ save, game, score, onOpenBooks }: { save: Save; game: GameState; score: number; onOpenBooks: () => void }) {
  const bs = balanceSheet(game.journal);
  const last = game.closes[game.closes.length - 1];
  const lastIS = last ? incomeStatement(game.journal.filter((e) => e.period === last.month)) : null;
  const v = save.view;
  const current = v.kind === 'round' ? v.round : undefined;
  const pro = useMemo(() => {
    if (!current || targetMonth(current) === 0 || roundNumber(current) <= 3) return null;
    try { return projectOption(gameInput(save), current, NEUTRAL[current]); } catch { return null; }
  }, [current, save.choices, save.mastery]); // eslint-disable-line react-hooks/exhaustive-deps -- mastery feeds the execution factor (A24)
  const decided = Object.keys(save.choices).length;
  const where = current ? periodLabel(roundPeriod(current)) : v.kind === 'close' ? `Month ${v.month} close` : v.kind === 'final' ? 'Start of Month 5' : `Chapter ${v.kind === 'checkpoint' ? v.chapter : chapterOf(ROUND_IDS[Math.max(0, decided - 1)])}`;

  return (
    <aside className="till" aria-label="CFO dashboard">
      <div>
        <h2>{save.truckName}</h2>
        <div className="small" style={{ color: '#b9c7c3' }}>{where} · {decided} of 25 decisions</div>
      </div>
      <div className="half">
        <div className="small" style={{ color: '#b9c7c3' }}>Cash in the bank</div>
        <div className="big">{fmt(bs.cash)}</div>
      </div>
      <div className="half">
        <div className="small" style={{ color: '#b9c7c3' }}>Mastery score</div>
        <div className="big" style={{ color: '#eef3f1' }}>{score}<span style={{ fontSize: '1rem' }}> / 100</span></div>
      </div>
      <dl>
        <dt>Accounts receivable</dt><dd>{fmt(bs.accountsReceivable)}</dd>
        <dt>Equipment, net</dt><dd>{fmt(bs.netPPE)}</dd>
        <dt>Deposits & prepaids</dt><dd>{fmt(bs.deposits + bs.prepaidAdvertising)}</dd>
        <dt>Loans</dt><dd>{fmt(bs.totalLiabilities)}</dd>
        <dt>Owner's equity</dt><dd>{fmt(bs.totalEquity)}</dd>
      </dl>
      <div className="rule" />
      <dl>
        {lastIS ? (<><dt>Month {last.month} sales (actual)</dt><dd>{fmt(lastIS.netSales)}</dd><dt>Month {last.month} operating income</dt><dd className={lastIS.operatingIncome < 0 ? 'bad' : 'ok'}>{fmt(lastIS.operatingIncome)}</dd></>) : <><dt>Months closed</dt><dd>none yet</dd></>}
        {pro?.operatingIncome !== undefined && <><dt>Month {pro.month} so far (pro forma)</dt><dd>{fmt(pro.operatingIncome)}</dd></>}
        {save.masteryAffectsSales && pro?.month ? <><dt>Month {pro.month} execution</dt><dd>{Math.round((executionFactors(save.mastery)[pro.month as 1] ?? 1) * 1000) / 10}%</dd></> : null}
      </dl>
      <div className={bs.balanced ? 'ok small' : 'bad small'} role={bs.balanced ? undefined : 'alert'}>
        {bs.balanced ? `✓ Books balance: ${fmt(bs.totalAssets)} = ${fmt(bs.totalLiabilities)} + ${fmt(bs.totalEquity)}` : '✗ The books do not balance. Please report this.'}
      </div>
      <button className="btn" onClick={onOpenBooks}>Open the books</button>
    </aside>
  );
}

const roundNumber = (r: RoundId) => Number(r.slice(1));
