import React, { useEffect, useState } from 'react';
import { loadWorkspaceRuntime } from '../runtime/workspace-runtime.ts';
import { getWorkAreas } from '../registry/workarea-registry.ts';

function Badge({ children, tone = 'dark' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function WorkAreaCard({ workArea, active, onSelect }) {
  return (
    <button className={`portal-card workarea-card ${active ? 'active' : ''}`} onClick={() => onSelect(workArea.id)}>
      <Badge>{workArea.id}</Badge>
      <h3>{workArea.title}</h3>
      <p>{workArea.description}</p>
      <small>{workArea.cardIds.length} cards</small>
    </button>
  );
}

function RuntimeCard({ card }) {
  return (
    <article className="module runtime-card">
      <Badge tone={card.protected ? 'red' : 'green'}>{card.kind}</Badge>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <small>{card.sqlTable ? `SQL: ${card.sqlTable}` : 'Runtime card'}</small>
    </article>
  );
}

export default function SteelCraftWorkspace({ status }) {
  const workAreas = getWorkAreas();
  const [activeWorkAreaId, setActiveWorkAreaId] = useState('command-center');
  const [runtime, setRuntime] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState('Loading Steel Craft runtime...');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setRuntimeStatus('Loading Steel Craft runtime...');
      try {
        const nextRuntime = await loadWorkspaceRuntime(activeWorkAreaId, 'SCB-2026-0001');
        if (!cancelled) {
          setRuntime(nextRuntime);
          setRuntimeStatus('Steel Craft runtime active');
        }
      } catch (error) {
        if (!cancelled) setRuntimeStatus(`Runtime error: ${error.message}`);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [activeWorkAreaId]);

  const project = runtime?.project;
  const cards = runtime?.state?.cards || [];

  return (
    <main className="app-shell steelcraft-workspace">
      <header className="hero">
        <div>
          <Badge tone="red">Steel Craft OS</Badge>
          <h1>{runtime?.manifest?.title || 'Command Center'}</h1>
          <p>One Master Project Record. Many Work Areas. Every card attaches to the same project history.</p>
          <p className="connection-status">{status} · {runtimeStatus}</p>
        </div>
        <aside className="hero-panel">
          <span>Active Project</span>
          <strong>{project?.projectNumber || 'SCB-2026-0001'}</strong>
          <small>{project?.name || 'Example Project Record'} · Stage: {project?.stage || 'estimating'}</small>
        </aside>
      </header>

      <section className="card">
        <div className="section-heading">
          <Badge>Work Areas</Badge>
          <h2>Steel Craft Command Center</h2>
          <p>CRM, estimating, proposal, contract, billing, delivery, erection, vendor, customer, documents, change orders, and activity all reference one project record.</p>
        </div>
        <div className="portal-grid landing-grid">
          {workAreas.map((workArea) => (
            <WorkAreaCard key={workArea.id} workArea={workArea} active={workArea.id === activeWorkAreaId} onSelect={setActiveWorkAreaId} />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <Badge>Runtime Cards</Badge>
          <h2>{runtime?.manifest?.title || 'Loading'} Cards</h2>
          <p>{runtime?.manifest?.description || 'Loading active work area cards.'}</p>
        </div>
        <div className="module-grid four-up">
          {cards.map((card) => <RuntimeCard key={card.id} card={card} />)}
        </div>
      </section>
    </main>
  );
}
