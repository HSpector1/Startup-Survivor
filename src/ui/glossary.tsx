// The glossary: one searchable list used by the standalone page and by the in-game panel (top bar, every mode).
// The panel is a native modal <dialog>, so it traps focus, closes on Escape and returns focus to the button that
// opened it. It never touches game state: the question, typed answer and calculator underneath stay as they were.
import { useId, useState } from 'react';
import { BONUS, ROUNDS } from '../content/rounds';
import { GLOSSARY, searchGlossary } from '../content/reference';
import { Sheet } from './common';
import './review.css';

const placeName = (id: string) => {
  const r = ROUNDS.find((x) => x.id === id);
  if (r) return `Round ${r.number}: ${r.title}`;
  const b = BONUS.find((x) => x.id === id);
  return b ? `Mastery Lab ${b.id}: ${b.title}` : id;
};

const QUICK_TERMS = ['ABC', 'CVP', 'NPV', 'CM', 'Relevant cost', 'Favorable variance', 'APV'];

export function GlossaryList({ initialQuery = '', autoFocus = false, headingLevel = 2 }: { initialQuery?: string; autoFocus?: boolean; headingLevel?: 2 | 3 }) {
  const [q, setQ] = useState(initialQuery);
  const id = useId();
  const list = searchGlossary(q);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="stack gloss">
      <div className="field">
        <label htmlFor={`${id}-q`}>Search by term or abbreviation</label>
        <input id={`${id}-q`} type="text" role="searchbox" enterKeyHint="search" className="x-text" value={q} onChange={(e) => setQ(e.target.value)} data-autofocus={autoFocus || undefined}
          placeholder="For example: ABC, NPV or contribution margin" autoComplete="off" spellCheck={false} aria-describedby={`${id}-count`} />
      </div>
      <div className="gloss-chips" role="group" aria-label="Common searches">
        {QUICK_TERMS.map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={q.toLowerCase() === t.toLowerCase()} onClick={() => setQ(t)}>{t}</button>
        ))}
        {q && <button type="button" className="chip ghost" onClick={() => setQ('')}>Show all</button>}
      </div>
      <p id={`${id}-count`} className="small muted" aria-live="polite" style={{ margin: 0 }}>{list.length} of {GLOSSARY.length} terms</p>
      {list.map((g) => (
        <article key={g.term} className="card gloss-entry">
          <H className="x-h3">{g.term}</H>
          {g.aliases?.length ? <p className="small muted" style={{ margin: '-.2rem 0 .5rem' }}>Also searched as: {g.aliases.join(', ')}</p> : null}
          <dl className="x-defs">
            <dt>Definition</dt><dd>{g.definition}</dd>
            {g.formula && <><dt>Formula</dt><dd className="formula">{g.formula}</dd></>}
            {g.example && <><dt>Example</dt><dd>{g.example}</dd></>}
            {g.rounds.length > 0 && <><dt>Where it appears</dt><dd>{g.rounds.map(placeName).join('; ')}</dd></>}
          </dl>
        </article>
      ))}
      {!list.length && <p>No term matches "{q}". Try a shorter word or an abbreviation.</p>}
    </div>
  );
}

export function GlossaryDialog({ open, query, onClose }: { open: boolean; query: string; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Glossary" className="sheet-side">
      {/* Keyed on the query so a "look this up" link opens on that term. */}
      <GlossaryList key={query} initialQuery={query} autoFocus headingLevel={3} />
    </Sheet>
  );
}
