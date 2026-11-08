import { useEffect, useMemo, useState } from 'react';
import { CLOSE_AFTER, ROUND_IDS, type Month, type OptionId, type RoundId } from './engine/model';
import { runGame, type Rescue } from './engine/sim';
import { EMPTY_RECORD, points, type MasteryRecord } from './engine/scoring';
import { chapterOf, loadSave, newSave, nextRound, storeSave, type Save, type View } from './state';
import { ReportsDialog, MonthCloseView, FinalReport } from './ui/reports';
import { Landing, Setup, QuickChallenge, BonusLab, GlossaryPage, SourcesPage } from './ui/extras';
import { RoundView, ConsequenceView, CheckpointView, Till } from './ui/play';
import { Calculator } from './ui/calculator';

export type Screen = 'landing' | 'setup' | 'play' | 'quick' | 'bonus' | 'glossary' | 'sources';

export default function App() {
  const [initial] = useState(loadSave);
  const [save, setSave] = useState<Save | null>(initial.save);
  const [loadError, setLoadError] = useState<string | undefined>('error' in initial ? initial.error : undefined);
  const [storeError, setStoreError] = useState<string | undefined>();
  const [screen, setScreen] = useState<Screen>('landing');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => { setStoreError(storeSave(save)); }, [save]);

  const game = useMemo(() => (save ? runGame({ choices: save.choices, rescues: save.rescues }) : null), [save]);
  const score = save ? ROUND_IDS.reduce((s, r) => s + points(save.mastery[r]), 0) : 0;

  const go = (view: View) => setSave((s) => (s ? { ...s, view } : s));

  function start(name: string) { setSave(newSave(name)); setLoadError(undefined); setScreen('play'); }
  function restart() { setSave(null); setScreen('setup'); }

  function recordMastery(r: RoundId, rec: MasteryRecord) {
    setSave((s) => (s ? { ...s, mastery: { ...s.mastery, [r]: rec } } : s));
  }

  function decide(r: RoundId, o: OptionId) {
    setSave((s) => (s ? { ...s, choices: { ...s.choices, [r]: o }, view: { kind: 'consequence', round: r } } : s));
  }

  /** Where to go after acknowledging a decision's consequences. */
  function afterConsequence(r: RoundId) {
    const m = CLOSE_AFTER[r];
    if (m) return go({ kind: 'close', month: m });
    if (r === 'R25') return go({ kind: 'final' });
    if (r === 'R05') return toCheckpoint(1);
    go({ kind: 'round', round: nextRound(r)! });
  }

  function afterClose(m: Month) {
    if (m === 4) return go({ kind: 'round', round: 'R24' });
    toCheckpoint(m + 1); // Month 1 close ends chapter 2, Month 2 ends 3, Month 3 ends 4
  }

  function toCheckpoint(chapter: number) {
    setSave((s) => {
      if (!s) return s;
      const snap = { choices: { ...s.choices }, rescues: { ...s.rescues }, mastery: { ...s.mastery } };
      return { ...s, view: { kind: 'checkpoint', chapter }, checkpoints: { ...s.checkpoints, [chapter + 1]: snap } };
    });
  }

  function afterCheckpoint(chapter: number) {
    go({ kind: 'round', round: ROUND_IDS[chapter * 5] });
  }

  function rescue(m: Month, kind: Rescue) {
    setSave((s) => (s ? { ...s, rescues: { ...s.rescues, [m]: kind } } : s));
  }

  /** Reload the snapshot taken when the current chapter began. */
  function restartChapter() {
    setSave((s) => {
      if (!s) return s;
      const lastRound = ROUND_IDS.filter((r) => s.choices[r]).pop() ?? 'R01';
      const ch = chapterOf(lastRound);
      const snap = s.checkpoints[ch] ?? s.checkpoints[1]!;
      return { ...s, choices: snap.choices, rescues: snap.rescues, mastery: snap.mastery, view: { kind: 'round', round: ROUND_IDS[(ch - 1) * 5] } };
    });
  }

  const resumeLabel = save ? `Resume ${save.truckName}` : undefined;
  const v = save?.view;

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => setScreen('landing')}>Startup <span>Survivor</span></button>
          {screen === 'play' && save && (
            <div className="progress" aria-label={`Progress: ${Object.keys(save.choices).length} of 25 rounds decided`}>
              {ROUND_IDS.map((r, i) => (
                <span key={r} style={{ display: 'contents' }}>
                  {i > 0 && i % 5 === 0 && <span className="gap" />}
                  <span className={`slip ${save.choices[r] ? 'done' : (v?.kind === 'round' && v.round === r) ? 'now' : ''}`} />
                </span>
              ))}
            </div>
          )}
          <div className="btn-row">
            <button className="btn" aria-expanded={calcOpen} aria-controls="calc-title" onClick={() => setCalcOpen((o) => !o)}>Calculator</button>
            {screen === 'play' && save && <button className="btn" onClick={() => setReportsOpen(true)}>Open the books</button>}
            {screen !== 'play' && save && <button className="btn primary" onClick={() => setScreen('play')}>{resumeLabel}</button>}
          </div>
        </div>
      </header>

      {(loadError || storeError) && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <div className="banner warn" role="alert">{loadError ?? storeError}</div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="page">
        {screen === 'landing' && (
          <Landing hasSave={!!save} resumeLabel={resumeLabel} onResume={() => setScreen('play')} onNew={() => setScreen('setup')}
            onQuick={() => setScreen('quick')} onBonus={() => setScreen('bonus')} onGlossary={() => setScreen('glossary')} onSources={() => setScreen('sources')} />
        )}
        {screen === 'setup' && <Setup hasSave={!!save} onStart={start} onBack={() => setScreen('landing')}
          onImported={(s) => { setSave(s); setLoadError(undefined); setScreen('play'); }} />}
        {screen === 'quick' && <QuickChallenge onExit={() => setScreen('landing')} />}
        {screen === 'bonus' && <BonusLab onExit={() => setScreen('landing')} />}
        {screen === 'glossary' && <GlossaryPage onExit={() => setScreen('landing')} />}
        {screen === 'sources' && <SourcesPage onExit={() => setScreen('landing')} />}

        {screen === 'play' && save && game && v && (
          <div className="play-grid">
            <div>
              {v.kind === 'round' && (
                <RoundView key={v.round} round={v.round} save={save} game={game}
                  record={save.mastery[v.round] ?? EMPTY_RECORD} onRecord={(rec) => recordMastery(v.round, rec)}
                  onDecide={(o) => decide(v.round, o)} />
              )}
              {v.kind === 'consequence' && <ConsequenceView key={v.round} round={v.round} save={save} game={game} onContinue={() => afterConsequence(v.round)} />}
              {v.kind === 'close' && (
                <MonthCloseView key={v.month} month={v.month} game={game} truckName={save.truckName}
                  onContinue={() => afterClose(v.month)} onRescue={(k) => rescue(v.month, k)} onRestartChapter={restartChapter} />
              )}
              {v.kind === 'checkpoint' && <CheckpointView key={v.chapter} chapter={v.chapter} save={save} game={game} onContinue={() => afterCheckpoint(v.chapter)} />}
              {v.kind === 'final' && <FinalReport game={game} save={save} score={score} onRestart={restart} onBonus={() => setScreen('bonus')} />}
            </div>
            <Till save={save} game={game} score={score} onOpenBooks={() => setReportsOpen(true)} />
          </div>
        )}
      </main>

      {save && game && <ReportsDialog open={reportsOpen} onClose={() => setReportsOpen(false)} game={game} truckName={save.truckName} />}

      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />

      <footer className="footer">
        Startup Survivor is an original teaching game for Auburn BUSI 7230. All businesses and numbers are fictional. No login, no tracking: progress stays in this browser.
      </footer>
    </div>
  );
}
