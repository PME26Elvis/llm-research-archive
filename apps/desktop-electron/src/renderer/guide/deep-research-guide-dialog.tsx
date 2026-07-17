import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDeepResearchGuide,
  getGuideDigest,
  isGuideSectionId,
  type GuideLocale,
  type GuideSectionId,
} from '@research-observatory/deep-research-guide';

interface DeepResearchGuideDialogProps {
  locale: GuideLocale;
  initialSection: GuideSectionId;
  onClose: () => void;
}

const attributionLabels = {
  'verified-fact': 'verifiedFact',
  'vendor-claim': 'providerClaim',
  'repository-synthesis': 'repositorySynthesis',
} as const;

export function DeepResearchGuideDialog({
  locale,
  initialSection,
  onClose,
}: DeepResearchGuideDialogProps) {
  const guide = getDeepResearchGuide(locale);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sectionRefs = useRef(new Map<GuideSectionId, HTMLElement>());
  const [currentSection, setCurrentSection] = useState<GuideSectionId>(
    isGuideSectionId(initialSection) ? initialSection : 'guide.overview',
  );
  const [sourceId, setSourceId] = useState(guide.sources[0]?.id ?? '');
  const source = useMemo(
    () => guide.sources.find((candidate) => candidate.id === sourceId) ?? guide.sources[0],
    [guide.sources, sourceId],
  );

  useEffect(() => {
    const app = document.querySelector<HTMLElement>('[data-testid="app-ready"]');
    if (app) app.inert = true;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hidden && !element.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (app) app.inert = false;
    };
  }, [onClose]);

  useEffect(() => {
    const selected = sectionRefs.current.get(currentSection);
    requestAnimationFrame(() => selected?.scrollIntoView({ block: 'start' }));
  }, [currentSection]);

  function registerSection(sectionId: GuideSectionId) {
    return (element: HTMLElement | null) => {
      if (element) sectionRefs.current.set(sectionId, element);
      else sectionRefs.current.delete(sectionId);
    };
  }

  function navigate(sectionId: GuideSectionId) {
    setCurrentSection(sectionId);
    sectionRefs.current.get(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function sourceButtons(sourceIds: string[]) {
    return (
      <div className="guide-source-links">
        {sourceIds.map((id) => (
          <button key={id} type="button" onClick={() => setSourceId(id)}>
            {guide.ui.source}: {id}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="guide-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="guide-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="classic-guide-title"
        data-testid="classic-deep-research-guide"
        data-guide-version={guide.guideVersion}
        data-guide-digest={getGuideDigest(locale)}
        data-guide-provider-count={guide.providers.length}
        data-guide-timeline-count={guide.timeline.length}
        data-guide-source-count={guide.sources.length}
      >
        <header className="guide-dialog-header">
          <div>
            <p className="guide-section-kicker">
              Research Observatory Guide · v{guide.guideVersion}
            </p>
            <h2 id="classic-guide-title">{guide.title}</h2>
            <p>{guide.subtitle}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            {guide.ui.close}
          </button>
        </header>
        <p className="guide-dialog-disclaimer">{guide.disclaimer}</p>
        <div className="guide-dialog-layout">
          <nav className="guide-dialog-nav" aria-label={guide.title}>
            <p>
              {guide.ui.researchCutoff}: <strong>{guide.researchCutoff}</strong>
            </p>
            {guide.sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                aria-current={currentSection === section.id ? 'true' : undefined}
                onClick={() => navigate(section.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {section.label}
              </button>
            ))}
          </nav>
          <main className="guide-dialog-content" data-guide-content>
            <section
              ref={registerSection('guide.overview')}
              data-guide-section="guide.overview"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[0].label}</p>
              <h3>{guide.sections[0].title}</h3>
              <p className="guide-lead">{guide.overview.definition}</p>
              <p>{guide.overview.umbrellaNote}</p>
              <div className="guide-naming-grid" role="list">
                {guide.overview.namingRows.map((row) => (
                  <article key={row.providerId} role="listitem" data-provider={row.providerId}>
                    <p>{row.provider}</p>
                    <h4>{row.productName}</h4>
                    <small>{row.exactBrand}</small>
                  </article>
                ))}
              </div>
            </section>

            <section
              ref={registerSection('guide.workflow')}
              data-guide-section="guide.workflow"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[1].label}</p>
              <h3>{guide.sections[1].title}</h3>
              <p>{guide.sections[1].intro}</p>
              <ol className="guide-workflow">
                {guide.workflow.map((step, index) => (
                  <li key={step.title}>
                    <span>{index + 1}</span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              ref={registerSection('guide.distinctions')}
              data-guide-section="guide.distinctions"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[2].label}</p>
              <h3>{guide.sections[2].title}</h3>
              <p>{guide.sections[2].intro}</p>
              <div className="guide-distinction-grid">
                {guide.distinctions.map((item) => (
                  <article key={item.title}>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section
              ref={registerSection('guide.timeline')}
              data-guide-section="guide.timeline"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[3].label}</p>
              <h3>{guide.sections[3].title}</h3>
              <p>{guide.sections[3].intro}</p>
              <ol className="guide-timeline">
                {guide.timeline.map((event) => (
                  <li key={event.id} data-provider={event.providerId}>
                    <time dateTime={event.date}>{event.date}</time>
                    <div>
                      <div className="guide-timeline-heading">
                        <h4>{event.title}</h4>
                        <span>{guide.ui[attributionLabels[event.attribution]]}</span>
                      </div>
                      <p className="guide-model-context">{event.modelContext}</p>
                      <p>{event.summary}</p>
                      {sourceButtons(event.sourceIds)}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              ref={registerSection('guide.providers')}
              data-guide-section="guide.providers"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[4].label}</p>
              <h3>{guide.sections[4].title}</h3>
              <p>{guide.sections[4].intro}</p>
              <div className="guide-provider-list">
                {guide.providers.map((provider, index) => (
                  <details key={provider.id} open={index === 0} data-provider={provider.id}>
                    <summary>
                      <span>{provider.provider}</span>
                      <strong>{provider.productName}</strong>
                    </summary>
                    <div className="guide-provider-body">
                      <p className="guide-naming-note">{provider.namingNote}</p>
                      <dl>
                        <dt>{guide.ui.launch}</dt>
                        <dd>{provider.launchDate ?? guide.ui.notStated}</dd>
                        <dt>{guide.ui.modelContext}</dt>
                        <dd>{provider.modelContext}</dd>
                      </dl>
                      <p>{provider.summary}</p>
                      <h4>{guide.ui.characteristics}</h4>
                      <ul>
                        {provider.characteristics.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <h4>{guide.ui.limitations}</h4>
                      <ul>
                        {provider.limitations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {sourceButtons(provider.sourceIds)}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <section
              ref={registerSection('guide.comparison')}
              data-guide-section="guide.comparison"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[5].label}</p>
              <h3>{guide.sections[5].title}</h3>
              <p>{guide.sections[5].intro}</p>
              <div className="guide-comparison-scroll" tabIndex={0}>
                <table className="guide-comparison">
                  <thead>
                    <tr>
                      <th scope="col">{guide.ui.field}</th>
                      {guide.providers.map((provider) => (
                        <th key={provider.id} scope="col">
                          {provider.productName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guide.comparison.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {guide.providers.map((provider) => (
                          <td key={provider.id}>{row.values[provider.id]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              ref={registerSection('guide.archive')}
              data-guide-section="guide.archive"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[6].label}</p>
              <h3>{guide.sections[6].title}</h3>
              <p>{guide.sections[6].intro}</p>
              <div className="guide-archive-grid">
                <article>
                  <h4>{guide.ui.whyPreserve}</h4>
                  <ul>
                    {guide.archive.rationale.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h4>{guide.ui.whatPreserved}</h4>
                  <ul>
                    {guide.archive.preserves.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h4>{guide.ui.notGuaranteed}</h4>
                  <ul>
                    {guide.archive.doesNotGuarantee.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section
              ref={registerSection('guide.verify')}
              data-guide-section="guide.verify"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[7].label}</p>
              <h3>{guide.sections[7].title}</h3>
              <p>{guide.sections[7].intro}</p>
              <ol className="guide-checklist">
                {guide.verificationChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>

            <section
              ref={registerSection('guide.sources')}
              data-guide-section="guide.sources"
              tabIndex={-1}
            >
              <p className="guide-section-kicker">{guide.sections[8].label}</p>
              <h3>{guide.sections[8].title}</h3>
              <p>{guide.sections[8].intro}</p>
              <p>
                <strong>{guide.ui.researchCutoff}:</strong> {guide.researchCutoff}
              </p>
              <p>{guide.negativeFinding.finding}</p>
              <p>{guide.negativeFinding.handlingRule}</p>
              <details>
                <summary>{guide.ui.editorialMethod}</summary>
                <ul>
                  {guide.editorialRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </details>
            </section>
          </main>

          <aside className="guide-dialog-evidence" aria-label={guide.sections[8].title}>
            {source && (
              <article aria-live="polite">
                <p className="guide-source-provider">{source.provider}</p>
                <h3>{source.title}</h3>
                <dl>
                  <dt>{guide.ui.published}</dt>
                  <dd>{source.publicationDate ?? guide.ui.notStated}</dd>
                  <dt>{guide.ui.accessed}</dt>
                  <dd>{source.accessedDate}</dd>
                  <dt>{guide.ui.authority}</dt>
                  <dd>{source.authority}</dd>
                </dl>
                <h4>{guide.ui.claimScope}</h4>
                <ul>
                  {source.claimScope.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
                {source.editorialNote && (
                  <p className="guide-editorial-note">{source.editorialNote}</p>
                )}
                <button
                  type="button"
                  onClick={() => void window.observatory.openExternal(source.url)}
                >
                  {guide.ui.openOfficialSource}
                </button>
              </article>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
