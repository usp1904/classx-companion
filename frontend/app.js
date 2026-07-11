const { useState, useRef, useEffect } = React;

function sampleViz() {
  return {
    rendererType: 'COORDINATE_GRAPH',
    syllabusSource: 'RD_SHARMA',
    visualizationProperties: {
      functionString: '2x^2 - 5x + 3',
      curveColor: '#2163b8',
      gridRange: { xMin: -3, xMax: 5, yMin: -4, yMax: 8 }
    }
  };
}

function drawCoordinateGraph(canvas, viz) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const props = viz.visualizationProperties || {};
  const range = props.gridRange || { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
  const mapX = x => (x - range.xMin) / (range.xMax - range.xMin) * w;
  const mapY = y => h - (y - range.yMin) / (range.yMax - range.yMin) * h;

  ctx.strokeStyle = '#edf2f7';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const gx = range.xMin + (range.xMax - range.xMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(mapX(gx), 0); ctx.lineTo(mapX(gx), h); ctx.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    const gy = range.yMin + (range.yMax - range.yMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(0, mapY(gy)); ctx.lineTo(w, mapY(gy)); ctx.stroke();
  }

  ctx.strokeStyle = '#4f6d9d';
  ctx.lineWidth = 1.5;
  if (range.yMin <= 0 && range.yMax >= 0) {
    ctx.beginPath(); ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0)); ctx.stroke();
  }
  if (range.xMin <= 0 && range.xMax >= 0) {
    ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h); ctx.stroke();
  }

  if (props.functionString) {
    const expression = normalizeFunctionString(props.functionString);
    let f;
    try { f = new Function('x', `return ${expression}`); } catch (e) { return; }
    ctx.strokeStyle = props.curveColor || '#2163b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const steps = 320;
    for (let i = 0; i <= steps; i++) {
      const x = range.xMin + (range.xMax - range.xMin) * i / steps;
      let y = NaN;
      try { y = f(x); } catch (e) { y = NaN; }
      const px = mapX(x), py = mapY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function normalizeFunctionString(fn) {
  let expr = fn.replace(/\^/g, '**');
  expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
  expr = expr.replace(/([a-zA-Z])\(/g, '$1*(');
  expr = expr.replace(/(\d)\(/g, '$1*(');
  expr = expr.replace(/\)([a-zA-Z0-9])/g, ')*$1');
  return expr;
}

function drawGeometry(canvas, viz) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const props = viz.visualizationProperties || {};
  const coords = props.coordinates || {};
  const points = Object.entries(coords).map(([k, v]) => ({ k, x: v[0], y: v[1] }));
  if (!points.length) return;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  const pad = 32;
  const mapX = x => pad + (x - xMin) / (xMax - xMin || 1) * (w - pad * 2);
  const mapY = y => h - (pad + (y - yMin) / (yMax - yMin || 1) * (h - pad * 2));

  const A = coords.A, B = coords.B, C = coords.C;
  if (A && B && C) {
    ctx.strokeStyle = '#2f436a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(mapX(A[0]), mapY(A[1])); ctx.lineTo(mapX(B[0]), mapY(B[1])); ctx.lineTo(mapX(C[0]), mapY(C[1])); ctx.closePath(); ctx.stroke();
  }

  points.forEach(p => {
    const px = mapX(p.x), py = mapY(p.y);
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = '14px sans-serif'; ctx.fillText(p.k, px + 10, py - 10);
  });
}

function drawOptics(canvas, viz) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const props = viz.visualizationProperties || {};
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = '#394a64'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, 24); ctx.lineTo(cx, h - 24); ctx.stroke();
  const objX = cx + (props.objectPositionCm || -30) * 0.4;
  const objY = cy - 50;
  ctx.fillStyle = '#0f62fe'; ctx.beginPath(); ctx.arc(objX, objY, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111827'; ctx.font = '15px sans-serif'; ctx.fillText('Object', objX + 12, objY - 12);
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(cx - 16, cy); ctx.stroke();
}

function drawChem(canvas, viz) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const props = viz.visualizationProperties || {};
  const atoms = props.atoms || [{ label: 'C', x: w / 2 - 40, y: h / 2 }, { label: 'O', x: w / 2 + 40, y: h / 2 }];
  const bonds = props.bonds || [{ from: 0, to: 1, type: 'single' }];
  ctx.strokeStyle = '#2f3c5a'; ctx.lineWidth = 3;
  bonds.forEach(b => {
    const a = atoms[b.from];
    const bpt = atoms[b.to];
    if (!a || !bpt) return;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bpt.x, bpt.y); ctx.stroke();
    if (b.type === 'double') {
      const dx = bpt.y - a.y;
      const dy = a.x - bpt.x;
      const dist = Math.hypot(dx, dy) || 1;
      const offset = 6;
      ctx.beginPath(); ctx.moveTo(a.x + dx / dist * offset, a.y + dy / dist * offset);
      ctx.lineTo(bpt.x + dx / dist * offset, bpt.y + dy / dist * offset);
      ctx.stroke();
    }
  });
  atoms.forEach(a => {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#202a43'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(a.x, a.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111827'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.label, a.x, a.y);
  });
}

function App() {
  const [input, setInput] = useState(JSON.stringify(sampleViz(), null, 2));
  const [viz, setViz] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState({ ok: false, service: null });
  const canvasRef = useRef();

  useEffect(() => {
    Promise.all([
      fetch('/api/syllabus/subjects').then(res => res.json()),
      fetch('/api/instructions').then(res => res.json()),
      fetch('/health').then(res => res.json())
    ]).then(([subjectsData, instructionsData, healthData]) => {
      if (subjectsData.ok) setSubjects(subjectsData.subjects);
      if (instructionsData.ok) setInstructions(instructionsData.instructions || []);
      setStatus(healthData);
    }).catch(() => {
      setStatus({ ok: false, service: null });
    });
  }, []);

  useEffect(() => {
    if (!viz) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const redraw = () => {
      if (viz.rendererType === 'COORDINATE_GRAPH') drawCoordinateGraph(canvas, viz);
      else if (viz.rendererType === 'GEOMETRY_2D_PROOF') drawGeometry(canvas, viz);
      else if (viz.rendererType === 'PHYSICS_OPTICS_RAY') drawOptics(canvas, viz);
      else if (viz.rendererType === 'CHEM_MOLECULAR_BOND') drawChem(canvas, viz);
    };

    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [viz]);

  async function submit() {
    let body;
    try { body = JSON.parse(input); } catch (e) { alert('Invalid JSON'); return; }
    const res = await fetch('/api/visualize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!j.ok) alert('Server error: ' + (j.error || JSON.stringify(j)));
    else setViz(j.viz);
  }

  async function loadSubject(subjectId) {
    const res = await fetch(`/api/syllabus/subjects/${subjectId}`);
    const j = await res.json();
    if (j.ok) {
      setSubject(j.subject);
      setChapter(null);
      setActiveTab('syllabus');
    }
  }

  async function loadChapter(subjectId, chapterId) {
    const res = await fetch(`/api/syllabus/subjects/${subjectId}/chapters/${chapterId}`);
    const j = await res.json();
    if (j.ok) {
      setChapter(j.chapter);
      setActiveTab('syllabus');
    }
  }

  async function searchSyllabus() {
    const res = await fetch(`/api/syllabus/search?q=${encodeURIComponent(searchQuery)}`);
    const j = await res.json();
    if (j.ok) setSearchResults(j.result);
  }

  async function viewInstruction(name) {
    const res = await fetch(`/api/instructions/${encodeURIComponent(name)}`);
    const j = await res.json();
    if (j.ok) setSelectedInstruction(j.instruction);
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'visualization', label: 'Visualizer' },
    { id: 'instructions', label: 'Instructions' }
  ];

  return (
    React.createElement('div', { className: 'app-shell' },
      React.createElement('header', { className: 'app-header' },
        React.createElement('div', { className: 'brand' },
          React.createElement('div', { className: 'brand-logo' }, 'CX'),
          React.createElement('div', { className: 'brand-copy' },
            React.createElement('h1', null, 'ClassX Companion'),
            React.createElement('p', null, 'Professional UI for NCERT + JEE/NEET curriculum and visualization.')
          )
        ),
        React.createElement('div', { className: 'header-meta' },
          React.createElement('div', { className: status.ok ? 'status-badge success' : 'status-badge danger' }, status.ok ? 'API Online' : 'API Offline'),
          React.createElement('div', { className: 'meta-note' }, 'Enterprise-ready learning dashboard')
        )
      ),

      React.createElement('div', { className: 'layout-grid' },
        React.createElement('nav', { className: 'main-nav' },
          React.createElement('h2', null, 'Workspaces'),
          navItems.map(item => React.createElement('button', {
            type: 'button',
            key: item.id,
            className: item.id === activeTab ? 'nav-item active' : 'nav-item',
            onClick: () => setActiveTab(item.id),
            'aria-current': item.id === activeTab ? 'page' : undefined
          }, item.label)),
          React.createElement('div', { className: 'nav-footer' },
            React.createElement('span', null, `${instructions.length} instruction modules loaded`)
          )
        ),

        React.createElement('main', { className: 'main-panel' },
          activeTab === 'dashboard' && React.createElement('section', { className: 'panel-card' },
            React.createElement('div', { className: 'panel-header' },
              React.createElement('div', null,
                React.createElement('h2', null, 'Dashboard'),
                React.createElement('p', null, 'A clean enterprise workspace for syllabus planning, visualization, and instruction management.')
              ),
              React.createElement('div', { className: 'hero-actions' },
                React.createElement('button', { type: 'button', onClick: () => setActiveTab('syllabus') }, 'Explore Syllabus'),
                React.createElement('button', { type: 'button', onClick: () => setActiveTab('visualization') }, 'Open Visualizer')
              )
            ),
            React.createElement('div', { className: 'dashboard-grid' },
              React.createElement('article', { className: 'metric-card' },
                React.createElement('h3', null, 'Health'),
                React.createElement('p', null, status.ok ? 'Backend is reachable and responsive.' : 'Unable to reach service. Check the API endpoint.'),
                React.createElement('div', { className: 'metric-value' }, status.ok ? 'Online' : 'Offline')
              ),
              React.createElement('article', { className: 'metric-card' },
                React.createElement('h3', null, 'Instruction Library'),
                React.createElement('p', null, 'Loaded Markdown guides for adaptive curriculum rules and response templates.'),
                React.createElement('div', { className: 'metric-value' }, `${instructions.length}`)
              ),
              React.createElement('article', { className: 'metric-card' },
                React.createElement('h3', null, 'Visualization'),
                React.createElement('p', null, 'Author and render rich schema-based educational diagrams.'),
                React.createElement('div', { className: 'metric-value' }, 'Interactive')
              )
            )
          ),

          activeTab === 'syllabus' && React.createElement('section', { className: 'panel-card' },
            React.createElement('div', { className: 'panel-header' },
              React.createElement('div', null,
                React.createElement('h2', null, 'Syllabus Explorer'),
                React.createElement('p', null, 'Browse subjects and chapters aligned to NCERT, R.D. Sharma and R.S. Aggarwal content sets.')
              )
            ),
            React.createElement('div', { className: 'content-split' },
              React.createElement('div', { className: 'panel-column' },
                React.createElement('h3', null, 'Subjects'),
                React.createElement('div', { className: 'list-panel' },
                  subjects.length === 0 ? React.createElement('div', null, 'Loading subjects...') : subjects.map(sub => React.createElement('button', {
                    type: 'button',
                    key: sub.id,
                    className: 'list-button',
                    onClick: () => loadSubject(sub.id),
                    'aria-label': `Open subject ${sub.name}`
                  }, sub.name))
                )
              ),
              React.createElement('div', { className: 'panel-column' },
                subject ? React.createElement(React.Fragment, null,
                  React.createElement('div', { className: 'subject-header' },
                    React.createElement('h3', null, subject.name),
                    React.createElement('p', null, subject.description)
                  ),
                  React.createElement('div', { className: 'topic-pill-group' },
                    subject.chapters.map(ch => React.createElement('button', {
                      type: 'button',
                      key: ch.id,
                      className: 'pill-button',
                      onClick: () => loadChapter(subject.id, ch.id),
                      'aria-label': `Open chapter ${ch.name}`
                    }, ch.name))
                  )
                ) : React.createElement('div', { className: 'empty-state' }, 'Select a subject to explore chapters.')
              )
            ),
            searchResults && React.createElement('div', { className: 'search-results' },
              React.createElement('h4', null, 'Search Results'),
              React.createElement('div', null, `Subjects: ${searchResults.subjects.length}`),
              React.createElement('div', null, `Chapters: ${searchResults.chapters.length}`),
              React.createElement('div', null, `Topics: ${searchResults.topics.length}`),
              React.createElement('div', null, `Exercises: ${searchResults.exercises.length}`)
            ),
            React.createElement('div', { className: 'search-panel' },
              React.createElement('label', { htmlFor: 'search-input', style: { display: 'none' } }, 'Search syllabus'),
              React.createElement('input', {
                id: 'search-input',
                type: 'text',
                className: 'search-input',
                placeholder: 'Search syllabus topics, chapters, exercises...',
                value: searchQuery,
                'aria-label': 'Search syllabus topics, chapters, exercises',
                onChange: e => setSearchQuery(e.target.value)
              }),
              React.createElement('button', { type: 'button', className: 'primary-button', onClick: searchSyllabus }, 'Search')
            ),
            chapter && React.createElement('div', { className: 'chapter-panel' },
              React.createElement('h3', null, chapter.name),
              React.createElement('p', null, chapter.summary),
              React.createElement('div', { className: 'chapter-columns' },
                React.createElement('div', null,
                  React.createElement('h4', null, 'Topics'),
                  React.createElement('ul', null, chapter.topics.map(topic => React.createElement('li', { key: topic }, topic)))
                ),
                React.createElement('div', null,
                  React.createElement('h4', null, 'Exercises'),
                  React.createElement('ul', null, chapter.exercises.map(ex => React.createElement('li', { key: ex.id },
                    React.createElement('strong', null, ex.question),
                    React.createElement('div', { className: 'exercise-solution' }, ex.solution)
                  )))
                )
              )
            )
          ),

          activeTab === 'visualization' && React.createElement('section', { className: 'panel-card' },
            React.createElement('div', { className: 'panel-header' },
              React.createElement('div', null,
                React.createElement('h2', null, 'Visualization Composer'),
                React.createElement('p', null, 'Design structured visualization payloads and preview them in a modern canvas screen.')
              )
            ),
            React.createElement('div', { className: 'content-split' },
              React.createElement('div', { className: 'panel-column' },
                React.createElement('textarea', {
                  className: 'json-editor',
                  value: input,
                  onChange: e => setInput(e.target.value)
                }),
                React.createElement('div', { className: 'action-row' },
                  React.createElement('button', { type: 'button', className: 'primary-button', onClick: submit }, 'Render Visualization'),
                  React.createElement('button', { type: 'button', className: 'secondary-button', onClick: () => setInput(JSON.stringify(sampleViz(), null, 2)) }, 'Load Sample')
                )
              ),
              React.createElement('div', { className: 'panel-column' },
                React.createElement('div', { className: 'canvas-shell' },
                  React.createElement('canvas', { ref: canvasRef, className: 'viz-canvas', role: 'img', 'aria-label': 'Visualization preview canvas' })
                )
              )
            ),
            React.createElement('div', { className: 'data-panel' },
              React.createElement('h3', null, 'Last Rendered Payload'),
              React.createElement('pre', null, viz ? JSON.stringify(viz, null, 2) : 'No visualization loaded yet')
            )
          ),

          activeTab === 'instructions' && React.createElement('section', { className: 'panel-card' },
            React.createElement('div', { className: 'panel-header' },
              React.createElement('div', null,
                React.createElement('h2', null, 'Instruction Library'),
                React.createElement('p', null, 'Review the markdown modules that shape the assistant’s curriculum, response style, and analytic behavior.')
              )
            ),
            React.createElement('div', { className: 'content-split' },
              React.createElement('div', { className: 'panel-column' },
                React.createElement('h3', null, 'Modules'),
                React.createElement('div', { className: 'list-panel' },
                  instructions.map(inst => React.createElement('button', {
                    type: 'button',
                    key: inst.name,
                    className: 'list-button',
                    onClick: () => viewInstruction(inst.name),
                    'aria-label': `Open instruction ${inst.name}`
                  }, inst.name))
                )
              ),
              React.createElement('div', { className: 'panel-column' },
                selectedInstruction ? React.createElement(React.Fragment, null,
                  React.createElement('h3', null, selectedInstruction.name),
                  React.createElement('p', null, selectedInstruction.description),
                  React.createElement('pre', { className: 'instruction-preview' }, selectedInstruction.content)
                ) : React.createElement('div', { className: 'empty-state' }, 'Select an instruction module to preview the content.')
              )
            )
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
