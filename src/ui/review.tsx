// Final-report sections added 2026-11-14: Business Performance grade card, Areas to Improve,
// Review Your Missed Answers and Business Decisions to Reconsider. Presentation only; content/review.ts does the work.
import { useId } from 'react';
import type { BusinessGrade } from '../engine/business';
import type { MasteryRecord } from '../engine/scoring';
import type { RoundId } from '../engine/model';
import { fmt } from '../engine/money';
import { ADVANCED_STUDY, areasToImprove, missedAnswers, topicResults, whyIdentified, type BusinessStory, type DecisionInsight } from '../content/review';
import './review.css';

type Mastery = Partial<Record<RoundId, MasteryRecord>>;

/** The grade placard, styled like the letter grade a health inspector posts in a food truck's window. */
export function GradeCard({ grade, story }: { grade: BusinessGrade; story: BusinessStory }) {
  const id = useId();
  return (
    <section className={`card grade-card grade-${grade.letter}`} aria-labelledby={`${id}-h`}>
      <div className="grade-top">
        <div className="grade-placard" role="img" aria-label={`Business performance grade ${grade.letter}`}>
          <span className="grade-kicker" aria-hidden="true">Business grade</span>
          <span className="grade-letter" aria-hidden="true">{grade.letter}</span>
          <span className="grade-score" aria-hidden="true">{grade.score.toFixed(1)} / 100</span>
        </div>
        <div className="grade-copy">
          <p className="muted small grade-eyebrow">Business performance</p>
          <h2 id={`${id}-h`}>Grade {grade.letter}: {grade.title}</h2>
          <p>{story.narrative}</p>
          <p className="small muted" style={{ margin: 0 }}>A fun rating of the business, separate from your accounting mastery score. It uses only Months 1–4 results, so financing and the start-of-Month-5 decisions (a second truck, a distribution) neither raise nor lower it.</p>
        </div>
      </div>

      <h3 className="grade-sub">What earned the grade</h3>
      <ul className="grade-dims">
        {grade.dimensions.map((d) => (
          <li key={d.key}>
            <div className="grade-dim-head"><strong>{d.label}</strong><span>{d.points} / {d.max}</span></div>
            <div className="grade-meter" aria-hidden="true"><span style={{ width: `${(d.points / d.max) * 100}%` }} /></div>
            <p className="small" style={{ margin: '.3rem 0 0' }}>{d.detail}</p>
          </li>
        ))}
      </ul>

      <h3 className="grade-sub">Lessons for next time</h3>
      <ul className="x-list">{story.lessons.map((l) => <li key={l}>{l}</li>)}</ul>

      <h3 className="grade-sub">Business badges</h3>
      <ul className="badges">
        {story.badges.map((b) => (
          <li key={b.name} className={b.earned ? 'earned' : 'locked'}>
            <strong>{b.name}</strong> <span className="sr-only">{b.earned ? '(earned)' : '(not earned)'}</span>
            <span className="small">{b.why}</span>
          </li>
        ))}
      </ul>
      <details className="small">
        <summary>How the grade works</summary>
        <p>Profitability (40 points): Months 1–4 operating income, full marks at $12,000, plus 2.5 points for each profitable month. Liquidity (20): cash at the Month 4 close, after removing any rescue cash, divided by average monthly fixed costs; full marks at 3.5 months. Trajectory (20): Month 4 operating income minus Month 1, from −$2,000 (0) to +$3,000 (20). Resilience (20): 12 points for needing no emergency funding, plus up to 8 for the lowest month-end cash (full at $10,000).</p>
        <p style={{ margin: 0 }}>A 85+, B 66+, C 50+, D 35+, otherwise F. A business that needed a rescue cannot rate above C. Owner capital, loans and rescues never count as income, and equipment counts only through depreciation.</p>
      </details>
    </section>
  );
}

export function AreasToImprove({ mastery, onGlossary }: { mastery: Mastery; onGlossary: (q: string) => void }) {
  const areas = areasToImprove(mastery);
  const strengths = topicResults(mastery).filter((t) => t.earned === t.max);
  return (
    <section className="card stack" aria-labelledby="areas-h">
      <h2 id="areas-h">Your areas to improve</h2>
      {areas.length === 0 ? (
        <>
          <p className="callout good" style={{ margin: 0 }}><strong>No weak areas.</strong> You answered every knowledge check correctly on the first try without a hint. For a further stretch:</p>
          <ul className="x-list">{ADVANCED_STUDY.map((a) => <li key={a}>{a}</li>)}</ul>
        </>
      ) : (
        <>
          <p className="small muted" style={{ margin: 0 }}>Ranked by the share of knowledge-check points you lost in each subject. These come only from your answers, not from your business decisions.</p>
          <ol className="areas">
            {areas.map((t) => (
              <li key={t.topic.id} className="area">
                <div className="area-head">
                  <h3>{t.topic.name}</h3>
                  <span className="tag">{t.earned} / {t.max} points</span>
                </div>
                <p className="small">{whyIdentified(t)} Rounds in this subject: {t.topic.rounds.map((r) => Number(r.slice(1))).join(', ')}.</p>
                <p>{t.topic.review}</p>
                <p className="formula"><strong>Formula:</strong> {t.topic.formula}</p>
                <p className="small"><strong>Worked example:</strong> {t.topic.example}</p>
                <p className="small"><strong>Practice next:</strong> {t.topic.practice}</p>
                <button className="btn ghost" onClick={() => onGlossary(t.topic.glossary)}>Look up “{t.topic.glossary}” in the glossary</button>
              </li>
            ))}
          </ol>
        </>
      )}
      {strengths.length > 0 && (
        <p className="small" style={{ margin: 0 }}><strong>Strengths:</strong> {strengths.map((t) => t.topic.name).join('; ')} (every check right first time).</p>
      )}
    </section>
  );
}

export function MissedAnswers({ mastery, onGlossary }: { mastery: Mastery; onGlossary: (q: string) => void }) {
  const items = missedAnswers(mastery);
  return (
    <section className="card stack" aria-labelledby="missed-h">
      <h2 id="missed-h">Review your missed answers</h2>
      {items.length === 0 ? (
        <p className="callout good" style={{ margin: 0 }}><strong>Perfect run.</strong> All 25 knowledge checks were right on the first try with no hints. Nothing to review here.</p>
      ) : (
        <>
          <p className="small muted" style={{ margin: 0 }}>{items.length} {items.length === 1 ? 'question' : 'questions'} where you missed, used the hint or revealed the answer. Open a card to see the worked solution.</p>
          <div className="missed">
            {items.map((m) => (
              <details key={m.round} className={`missed-card ${m.status}`}>
                <summary>
                  <span className="missed-round">Round {m.number}</span>
                  <span className="missed-title">{m.title}</span>
                  <span className="missed-meta small">{m.topic} · {m.statusText} · {m.points}/4</span>
                </summary>
                <div className="missed-body">
                  <p><strong>Question:</strong> {m.prompt}</p>
                  <div className="missed-answers">
                    <div>
                      <p className="small muted" style={{ margin: 0 }}>Your {m.wrongAnswers && m.wrongAnswers.length > 1 ? 'answers' : 'answer'}</p>
                      {m.wrongAnswers === null
                        ? <p className="small" style={{ margin: 0 }}>Not recorded. This game was saved before the game kept answer history, so only the attempt count is known ({m.statusText.toLowerCase()}).</p>
                        : m.wrongAnswers.length === 0
                          ? <p className="small" style={{ margin: 0 }}>{m.unrecordedAttempts ? 'Earlier answers were not recorded.' : m.status === 'hint' ? 'No wrong answer: you used the hint, then answered correctly.' : 'You revealed the answer without a wrong entry on record.'}</p>
                          : <ul className="x-list">{m.wrongAnswers.map((w, i) => <li key={i}><span className="neg">{w.text}</span>{w.diagnosis && <span className="small"> · {w.diagnosis}</span>}</li>)}</ul>}
                      {m.wrongAnswers !== null && m.unrecordedAttempts > 0 && m.wrongAnswers.length > 0 && <p className="small muted" style={{ margin: 0 }}>{m.unrecordedAttempts} earlier {m.unrecordedAttempts === 1 ? 'attempt was' : 'attempts were'} not recorded.</p>}
                    </div>
                    <div>
                      <p className="small muted" style={{ margin: 0 }}>Correct answer</p>
                      <p className="pos" style={{ margin: 0, fontWeight: 800 }}>{m.correctAnswer}</p>
                    </div>
                  </div>
                  <p className="formula"><strong>Formula:</strong> {m.formula}</p>
                  <p><strong>Worked solution:</strong> {m.worked}</p>
                  {m.concept && <p className="small"><strong>The concept:</strong> {m.concept}</p>}
                  {m.glossaryTerm && <button className="btn ghost" onClick={() => onGlossary(m.glossaryTerm!)}>Glossary: {m.glossaryTerm}</button>}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function DecisionsToReconsider({ insights }: { insights: DecisionInsight[] }) {
  return (
    <section className="card stack" aria-labelledby="decisions-h">
      <div className="btn-row"><h2 id="decisions-h" className="x-m0">Business decisions to reconsider</h2><span className="tag forecast">Simulation</span></div>
      <p className="small muted" style={{ margin: 0 }}>
        Each comparison replays your whole game with one decision changed and every other decision, rescue and mastery result kept. It is a hypothetical path, not a promise: with a different choice you might have decided differently later. Your actual results above are unchanged.
      </p>
      {insights.length === 0 ? (
        <p style={{ margin: 0 }}>No single change to Rounds 1–23 would have added $500 or more of Months 1–4 operating income without breaking a later decision or forcing a rescue. Your decisions held up well against the alternatives.</p>
      ) : (
        <ol className="areas">
          {insights.map((d) => (
            <li key={d.round} className="area">
              <h3>Round {d.number}: {d.title}</h3>
              <p>{d.summary}</p>
              <ul className="x-list small">{d.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="small" style={{ margin: '.5rem 0 0' }}><strong>Think about:</strong> {d.lesson}</p>
              <p className="small muted" style={{ margin: '.3rem 0 0' }}>Months 1–4 operating income {fmt(d.actualOI)} actual vs {fmt(d.altOI)} simulated; Month 4 cash {fmt(d.actualCash)} vs {fmt(d.altCash)}.</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
