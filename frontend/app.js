/* ───────── helpers ───────── */
const { useState, useEffect, useRef, useCallback } = React;
const h = React.createElement;
const div = (p, ...c) => h('div', p || {}, ...c);
const span = (p, ...c) => h('span', p || {}, ...c);
const btn = (p, ...c) => h('button', { type:'button', ...p }, ...c);
const ul = (p, ...c) => h('ul', p || {}, ...c);
const li = (p, ...c) => h('li', p || {}, ...c);
const h2 = (p, ...c) => h('h2', p || {}, ...c);
const h3 = (p, ...c) => h('h3', p || {}, ...c);
const h4 = (p, ...c) => h('h4', p || {}, ...c);
const h1 = (p, ...c) => h('h1', p || {}, ...c);
const h5 = (p, ...c) => h('h5', p || {}, ...c);
const p = (p, ...c) => h('p', p || {}, ...c);
const pre = (p, ...c) => h('pre', p || {}, ...c);
const strong = (p, ...c) => h('strong', p || {}, ...c);
const img = (p) => h('img', p || {});
const select_ = (p, ...c) => h('select', p || {}, ...c);
const option = (p, ...c) => h('option', p || {}, ...c);
const textarea = (p) => h('textarea', p || {});
const label = (p, ...c) => h('label', p || {}, ...c);

/* ───────── API ───────── */
const api = (path) => fetch(path).then(r => r.json());

/* ───────── THEME COLORS ───────── */
const C = {
  cyan: '#2dd4ff', violet: '#a78bfa', green: '#34d399', amber: '#f59e0b', red: '#f87171'
};

/* ───────── SIDEBAR NAV ───────── */
const NAV_ITEMS = [
  { id:'overview',      icon:'📊', label:'Overview' },
  { id:'concepts',      icon:'📚', label:'Concepts' },
  { id:'theorems',      icon:'📐', label:'Theorems' },
  { id:'examples',      icon:'✏️',  label:'Examples' },
  { id:'exercises',     icon:'📝', label:'Exercises' },
  { id:'rd-sharma',     icon:'📖', label:'RD Sharma' },
  { id:'rs-aggarwal',   icon:'📖', label:'RS Aggarwal' },
  { id:'model-papers',  icon:'📋', label:'Model Papers' },
  { id:'quizzes',       icon:'🧪', label:'Practice Quizzes' },
  { id:'vedic-math',    icon:'⚡', label:'Vedic Math' },
  { id:'mind-maps',     icon:'🧠', label:'Mind Maps' },
  { id:'viz',           icon:'📈', label:'Visualizations' },
];

/* ───────── LOADING ───────── */
const Loading = () => div({className:'loading'}, 'Loading lesson content...');

/* ───────── OVERVIEW ───────── */
function Overview({ lesson, subjects, instructions }) {
  if (!lesson) return null;
  const d = lesson;
  const stats = [
    { value:d.concepts?.length||0, label:'Concepts', color:'cyan' },
    { value:d.theorems?.length||0, label:'Theorems', color:'violet' },
    { value:d.worked_examples?.length||0, label:'Examples', color:'green' },
    { value:Object.keys(d.exercises||{}).length, label:'Exercises', color:'amber' },
    { value:(d.quizzes?.simple?.length||0)+(d.quizzes?.medium?.length||0)+(d.quizzes?.complex?.length||0), label:'Quiz Questions', color:'cyan' },
    { value:d.vedic_math_shortcuts?.length||0, label:'Vedic Shortcuts', color:'violet' },
    { value:d.flowcharts?.length||0, label:'Flowcharts', color:'green' },
    { value:d.common_misconceptions?.length||0, label:'Misconceptions', color:'amber' },
  ];
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, d.chapter || 'Real Numbers'),
      p(null, d.title),
    ),
    div({className:'stats-grid'},
      stats.map(s => div({key:s.label, className:'stat-card '+s.color},
        div({className:'stat-value'}, String(s.value)),
        div({className:'stat-label'}, s.label)
      ))
    ),
    div({className:'outcomes'},
      h3(null, '🎯 Learning Outcomes'),
      ul(null, (d.outcomes||[]).map((o,i) => li({key:i}, o)))
    ),
    d.common_misconceptions?.length ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.amber,marginBottom:8}}, '⚠️ Common Misconceptions'),
      d.common_misconceptions.map((m,i) => div({key:i,className:'misconception-card',dangerouslySetInnerHTML:{__html:m.replace(/^(.*?)(—|–)(.*)$/,'<strong>$1</strong>$2$3')}}))
    ) : null,
  );
}

/* ───────── CONCEPTS ───────── */
function Concepts({ lesson }) {
  if (!lesson?.concepts) return null;
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📚 Concepts — Real Life Applications'),
      p(null, 'Every concept connected to Indian diaspora context and day-to-day usage'),
    ),
    lesson.concepts.map((c, i) => div({key:i, className:'concept-card'},
      h3(null, (i+1)+'. '+c.name),
      c.real_life_application ? div({className:'concept-section'},
        h4(null, '🏠 Real-Life Application'),
        p(null, c.real_life_application)
      ) : null,
      c.purpose ? div({className:'concept-section'},
        h4(null, '🎯 Purpose'),
        p(null, c.purpose)
      ) : null,
      c.day_to_day_usage?.length ? div({className:'concept-section'},
        h4(null, '📌 Day-to-Day Usage'),
        ul(null, c.day_to_day_usage.map((u,j) => li({key:j}, u)))
      ) : null,
    ))
  );
}

/* ───────── THEOREMS ───────── */
function Theorems({ lesson }) {
  if (!lesson?.theorems) return null;
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📐 Theorems — History, Proof & Real-World Utility'),
      p(null, 'Who proposed it, why, and how it applies to your life'),
    ),
    lesson.theorems.map((t, i) => div({key:i, className:'theorem-card'},
      h3(null, t.name),
      t.statement ? div({className:'theorem-statement'}, t.statement) : null,
      t.proposed_by ? div({className:'theorem-meta'},
        span(null, '👤 '+(t.proposed_by.name||'')+(t.proposed_by.era ? ', '+t.proposed_by.era : '')),
        span(null, '📖 '+(t.proposed_by.book||'')),
        span(null, '📍 '+(t.proposed_by.location||'')),
      ) : null,
      t.historical_context ? div({className:'concept-section'},
        h4(null, '📜 Historical Context'),
        p(null, t.historical_context)
      ) : null,
      t.real_world_utility ? div({className:'concept-section'},
        h4(null, '🌍 Real-World Utility'),
        p(null, t.real_world_utility)
      ) : null,
      t.why_students_learn ? div({className:'concept-section'},
        h4(null, '🎓 Why Students Learn This'),
        p(null, t.why_students_learn)
      ) : null,
      t.examples?.length ? div({className:'concept-section'},
        h4(null, '💡 Worked Examples'),
        t.examples.map((ex, j) => div({key:j, className:'theorem-example'},
          h5(null, 'Example '+(j+1)+': '+(ex.problem||'')),
          ex.indiandiaspora_context ? p({style:{fontSize:12,color:C.amber,fontStyle:'italic',marginBottom:6}}, ex.indiandiaspora_context) : null,
          ex.solution_step_by_step ? ul({className:'step-list'}, ex.solution_step_by_step.map((s,k) => li({key:k}, s))) : null,
          ex.final_answer ? p({style:{fontSize:13,fontWeight:600,color:C.green,marginTop:6}}, 'Answer: '+ex.final_answer) : null,
        ))
      ) : null,
    ))
  );
}

/* ───────── WORKED EXAMPLES ───────── */
function Examples({ lesson }) {
  if (!lesson?.worked_examples) return null;
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '✏️ Worked Examples — Step by Step'),
      p(null, 'Board exam style + competitive speed mode + JEE shortcuts'),
    ),
    lesson.worked_examples.map((ex, i) => div({key:i, className:'example-card'},
      h3(null, (i+1)+'. '+ex.topic),
      div({className:'example-problem'}, ex.problem),
      ex.board_mode ? div({className:'example-mode board'},
        h5(null, '📋 Board Exam Mode (Step-by-Step)'),
        pre(null, ex.board_mode.join('\n'))
      ) : null,
      ex.speed_mode ? div({className:'example-mode speed'},
        h5(null, '⚡ Speed Mode — Golden Step'),
        pre(null, ex.speed_mode)
      ) : null,
      ex.competitive_shortcut ? div({className:'example-mode speed'},
        h5(null, '🏆 Competitive Exam Shortcut'),
        pre(null, ex.competitive_shortcut)
      ) : null,
    ))
  );
}

/* ───────── EXERCISES ───────── */
function Exercises({ lesson }) {
  const [active, setActive] = useState(0);
  if (!lesson?.exercises) return null;
  const keys = Object.keys(lesson.exercises);
  const current = lesson.exercises[keys[active]];
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📝 NCERT Exercises — Every Problem Solved'),
      p(null, (current?.title||'')+'. '+(current?.objective||'')),
    ),
    div({className:'exercise-tabs'},
      keys.map((k, i) => btn({
        key:k, className:'exercise-tab'+(i===active?' active':''),
        onClick:()=>setActive(i)
      }, k.replace('_',' ').toUpperCase()))
    ),
    current?.problems?.length ? current.problems.map(pr => div({key:pr.id, className:'exercise-problem'},
      h4(null, pr.id+'. '+pr.question),
      pr.solution?.length ? div({className:'exercise-solution'}, pr.solution.join('\n')) : null,
      pr.final_answer ? div({className:'exercise-answer'}, '✅ '+pr.final_answer) : null,
      pr.concept_insight ? div({className:'exercise-insight'}, '💡 '+pr.concept_insight) : null,
    )) : div({style:{color:'var(--textMuted)'}}, 'No problems in this exercise.')
  );
}

/* ───────── EXTENSIONS ───────── */
function ExtensionView({ title, data }) {
  if (!data?.topics) return null;
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, title),
      p(null, 'For IIT-JEE / NEET competitive exam preparation'),
    ),
    data.topics.map((t, i) => div({key:i, className:'ext-section'},
      h3(null, t.name),
      t.concept ? p(null, t.concept) : null,
      t.formula ? div({style:{padding:'8px 12px',background:'var(--neonCyanDim)',borderRadius:8,marginBottom:10,fontSize:13,color:C.cyan}}, t.formula) : null,
      t.method ? p(null, t.method) : null,
      t.examples?.length ? t.examples.map((ex, j) => div({key:j, className:'ext-example'},
        h5(null, 'Example: '+(ex.problem||'')),
        ex.solution?.length ? ul({className:'step-list'}, ex.solution.map((s,k) => li({key:k}, s))) : null,
        ex.final_answer ? p({style:{fontSize:13,fontWeight:600,color:C.green,marginTop:6}}, 'Answer: '+ex.final_answer) : null,
      )) : null,
      t.competitive_note ? div({style:{padding:'8px 12px',background:'var(--neonAmberDim)',borderRadius:8,marginTop:8,fontSize:12,color:C.amber}}, '🏆 '+t.competitive_note) : null,
    ))
  );
}

/* ───────── MODEL PAPERS ───────── */
function ModelPapers({ lesson }) {
  const mp = lesson?.model_papers;
  if (!mp) return null;
  const tiers = [
    { id:'simple', label:'Simple', color:'green' },
    { id:'medium', label:'Medium', color:'amber' },
    { id:'complex', label:'Complex', color:'red' },
  ];
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📋 Model Papers — 3-Tier Practice'),
      p(null, 'Original problems with step-by-step solutions for board & competitive exam prep'),
    ),
    tiers.map(tier => {
      const items = mp[tier.id] || [];
      if (!items.length) return null;
      return div({key:tier.id, className:'paper-section'},
        h3({style:{color:'var(--neon'+tier.color.charAt(0).toUpperCase()+tier.color.slice(1)+')'}},
          '▸ '+tier.label+' ('+items.length+' problems)'
        ),
        items.map((item, i) => div({key:i, style:{padding:'10px 14px',marginBottom:8,background:'var(--bg2)',borderRadius:8}},
          div({style:{fontWeight:600,fontSize:13,marginBottom:4}}, (i+1)+'. '+item.question),
          item.steps?.length ? div({style:{fontSize:12,color:'var(--textDim)',marginBottom:4}},
            item.steps.map((s, j) => div({key:j}, '→ '+s))
          ) : null,
          item.answer ? div({style:{fontSize:12,color:'var(--neonGreen)',fontWeight:600}}, '✅ '+item.answer) : null,
          item.hints?.length ? div({style:{fontSize:11,color:'var(--neonCyan)',marginTop:4,fontStyle:'italic'}},
            '💡 '+item.hints.join(' | ')
          ) : null,
        ))
      );
    })
  );
}

/* ───────── QUIZZES ───────── */
function Quizzes({ lesson }) {
  const [difficulty, setDifficulty] = useState('simple');
  const [answers, setAnswers] = useState({});
  const difficulties = [
    { id:'simple', label:'Simple', color:C.green },
    { id:'medium', label:'Medium', color:C.amber },
    { id:'complex', label:'Complex', color:C.red },
  ];
  const questions = lesson?.quizzes?.[difficulty] || [];
  const select = (qIdx, optIdx) => {
    setAnswers(prev => ({...prev, [difficulty+'-'+qIdx]: optIdx }));
  };
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '🧪 Practice Quizzes'),
      p(null, 'Test your knowledge with detailed explanations for every answer'),
    ),
    div({className:'quiz-tabs'},
      difficulties.map(d => btn({
        key:d.id, className:'quiz-tab'+(d.id===difficulty?' active':''),
        onClick:()=>{setDifficulty(d.id);setAnswers({});}
      }, d.label+' ('+(lesson?.quizzes?.[d.id]?.length||0)+')'))
    ),
    questions.length ? questions.map((q, i) => {
      const sel = answers[difficulty+'-'+i];
      const correctIdx = q.correct;
      return div({key:i, className:'quiz-card'},
        div({className:'quiz-question'}, (i+1)+'. '+q.question),
        div({className:'quiz-options'},
          q.options.map((opt, j) => {
            let cls = 'quiz-option';
            if (sel !== undefined) {
              cls += ' disabled';
              if (j === correctIdx) cls += ' reveal-correct';
              if (j === sel && j !== correctIdx) cls += ' wrong';
              if (j === sel && j === correctIdx) cls += ' correct';
            }
            return btn({
              key:j, className:cls,
              onClick:() => select(i, j),
              disabled:sel !== undefined
            }, opt);
          })
        ),
        sel !== undefined && q.explanation ? div({className:'quiz-explanation'},
          sel === correctIdx
            ? div(null, strong(null, '✅ Correct! '), q.explanation.correct || '')
            : div(null,
                strong({style:{color:C.red}}, '❌ Incorrect. '),
                q.explanation.wrong_options?.[sel] || q.explanation.correct || '',
                q.explanation.wrong_options ? Object.entries(q.explanation.wrong_options)
                  .filter(([k]) => k !== String(sel) && k !== String(correctIdx))
                  .map(([k,v]) => div({key:k,style:{marginTop:4,color:'var(--textMuted)'}}, '💡 '+v)) : null
              )
        ) : null,
      );
    }) : div({style:{color:'var(--textMuted)',textAlign:'center',padding:40}}, 'No questions available for this difficulty.')
  );
}

/* ───────── VEDIC MATH ───────── */
function VedicMath({ lesson }) {
  if (!lesson?.vedic_math_shortcuts) return null;
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '⚡ Vedic Mathematics Shortcuts'),
      p(null, 'Ancient Indian techniques for lightning-fast calculations'),
    ),
    lesson.vedic_math_shortcuts.map((v, i) => div({key:i, className:'vedic-card'},
      h3(null, v.title),
      v.sanskrit ? div({className:'vedic-sanskrit'}, v.sanskrit) : null,
      v.concept ? p({style:{fontSize:13,color:'var(--textDim)',marginBottom:8}}, v.concept) : null,
      v.real_numbers_application ? p({style:{fontSize:12,color:'var(--neonCyan)',marginBottom:8}}, '📌 '+v.real_numbers_application) : null,
      v.examples?.length ? v.examples.map((ex, j) => div({key:j, style:{marginTop:10,padding:'10px 14px',background:'rgba(0,0,0,0.2)',borderRadius:8}},
        p({style:{fontWeight:600,fontSize:13,marginBottom:4}}, 'Example: '+ex.problem),
        ex.explanation ? p({style:{fontSize:12,color:'var(--textDim)',fontStyle:'italic',marginBottom:4}}, ex.explanation) : null,
        ex.steps ? ul({className:'vedic-steps'}, ex.steps.map((s,k) => li({key:k}, s))) : null,
        ex.regular_method ? p({style:{fontSize:12,color:'var(--textMuted)',marginTop:4}}, 'Regular method: '+ex.regular_method) : null,
      )) : null,
    ))
  );
}

/* ───────── MIND MAPS ───────── */
function MindMaps({ lesson }) {
  const mm = lesson?.mind_maps;
  if (!mm) return div({className:'card'}, div({className:'card-header'}, h2(null,'🧠 Mind Maps'), p(null,'No mind map available for this chapter.')));
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '🧠 '+mm.title),
      p(null, 'Visual hierarchy for better understanding and memory retention'),
    ),
    div({className:'mindmap-container'},
      div({className:'mindmap-root'}, mm.root),
      div({className:'mindmap-branches'},
        mm.branches?.map((b, i) => div({key:i, className:'mindmap-branch'},
          h4(null, b.concept),
          b.sub_nodes?.length ? ul(null, b.sub_nodes.map((s,j) => li({key:j}, s))) : null,
        ))
      ),
      mm.branches?.some(b => b.connections) ? div({className:'mindmap-connections'},
        mm.branches.filter(b => b.connections).map(b => b.connections).join(' • ')
      ) : null,
    ),
    lesson?.concept_maps ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.violet,marginBottom:10}}, '🔗 Concept Map — How Things Connect'),
      div({style:{background:'var(--bg2)',borderRadius:10,padding:16,display:'flex',flexWrap:'wrap',gap:8}},
        (lesson.concept_maps.nodes||[]).map(n => span({key:n.id, className:'tag '+(n.group==='foundation'?'cyan':n.group==='application'?'green':'violet')}, n.label))
      ),
      div({style:{marginTop:8,display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center'}},
        (lesson.concept_maps.edges||[]).map((e,i) => span({key:i,style:{fontSize:11,color:'var(--textMuted)',padding:'2px 6px'}},
          (lesson.concept_maps.nodes||[]).find(n=>n.id===e[0])?.label+' → '+(lesson.concept_maps.nodes||[]).find(n=>n.id===e[1])?.label
        ))
      )
    ) : null,
    lesson?.flowcharts?.length ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.amber,marginBottom:10}}, '📋 Flowcharts — Decision Guides'),
      lesson.flowcharts.map((fc, i) => div({key:i, className:'flowchart-container'},
        h3(null, fc.title),
        fc.steps.map((st, j) => div({key:j, className:'flowchart-step'},
          div({className:'flowchart-num'+(st.next==='END'?' end':'')}, st.order),
          div({className:'flowchart-content'},
            st.action,
            st.decision ? span({style:{color:C.cyan,fontSize:11,display:'block',marginTop:2}}, '→ If yes: Step '+st.if_yes+' | If no: Step '+st.if_no) : null,
          )
        ))
      ))
    ) : null,
  );
}

/* ───────── VIZ (existing ported) ───────── */
function normalizeFunctionString(fn) {
  let expr = fn.replace(/\^/g, '**');
  expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  expr = expr.replace(/([a-zA-Z])(\d)/g, '$1*$2');
  expr = expr.replace(/([a-zA-Z])\(/g, '$1*(');
  expr = expr.replace(/(\d)\(/g, '$1*(');
  expr = expr.replace(/\)([a-zA-Z0-9])/g, ')*$1');
  return expr;
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
  ctx.strokeStyle = 'rgba(45,212,255,0.08)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const gx = range.xMin + (range.xMax - range.xMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(mapX(gx), 0); ctx.lineTo(mapX(gx), h); ctx.stroke();
    const gy = range.yMin + (range.yMax - range.yMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(0, mapY(gy)); ctx.lineTo(w, mapY(gy)); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(45,212,255,0.3)'; ctx.lineWidth = 1.5;
  if (range.yMin <= 0 && range.yMax >= 0) { ctx.beginPath(); ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0)); ctx.stroke(); }
  if (range.xMin <= 0 && range.xMax >= 0) { ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h); ctx.stroke(); }
  if (props.functionString) {
    const expression = normalizeFunctionString(props.functionString);
    let f;
    try { f = new Function('x', `return ${expression}`); } catch (e) { return; }
    ctx.strokeStyle = props.curveColor || C.cyan; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 320; i++) {
      const x = range.xMin + (range.xMax - range.xMin) * i / 320;
      let y;
      try { y = f(x); } catch (e) { y = NaN; }
      const px = mapX(x), py = mapY(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Number line markers
  if (props.markers) {
    props.markers.forEach(m => {
      const px = mapX(m.position);
      ctx.fillStyle = m.color || C.cyan;
      ctx.beginPath(); ctx.arc(px, mapY(0), 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(m.label, px, mapY(0) + 18);
    });
  }
}

/* ───────── VIZ COMPONENT ───────── */
function Viz({ lesson }) {
  const [input, setInput] = useState(JSON.stringify({
    rendererType:'COORDINATE_GRAPH', syllabusSource:'NCERT_2026_27',
    visualizationProperties:{functionString:'2*x^2 - 5*x + 3',curveColor:C.cyan,gridRange:{xMin:-3,xMax:5,yMin:-4,yMax:8}}
  }, null, 2));
  const [viz, setViz] = useState(null);
  const canvasRef = useRef();
  useEffect(() => {
    if (!viz) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => {
      if (viz.rendererType === 'COORDINATE_GRAPH') drawCoordinateGraph(canvas, viz);
    };
    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [viz]);
  const submit = async () => {
    let body;
    try { body = JSON.parse(input); } catch (e) { alert('Invalid JSON'); return; }
    const res = await fetch('/api/visualize', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const j = await res.json();
    if (!j.ok) alert('Error: '+(j.error||JSON.stringify(j)));
    else setViz(j.viz);
  };
  const loadNumberLine = () => {
    setInput(JSON.stringify({
      rendererType:'COORDINATE_GRAPH', syllabusSource:'NCERT_2026_27',
      visualizationProperties:{
        title:'Real Numbers — Number Line',
        type:'number_line',
        functionString:'',
        gridRange:{xMin:-10,xMax:10,yMin:-2,yMax:2},
        markers:[
          {position:-8,label:'-8 (Integer)',color:C.violet},
          {position:-3.5,label:'-3.5 (Rational)',color:C.green},
          {position:0,label:'0 (Whole)',color:C.cyan},
          {position:1.414,label:'√2 (Irrational)',color:C.red},
          {position:3,label:'3 (Natural)',color:C.cyan},
          {position:3.141,label:'π (Irrational)',color:C.red},
          {position:5,label:'5 (Natural)',color:C.cyan},
          {position:9.5,label:'9.5 (Rational)',color:C.green},
        ]
      }
    }, null, 2));
  };
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📈 Visualizations'),
      p(null, 'Interactive number line and graph renderer for mathematical concepts'),
    ),
    div({className:'viz-split'},
      div(null,
        textarea({className:'viz-editor',value:input,onChange:e=>setInput(e.target.value)}),
        div({className:'viz-actions'},
          btn({className:'btn btn-primary',onClick:submit}, '▶ Render'),
          btn({className:'btn btn-secondary',onClick:()=>loadNumberLine()}, '📊 Number Line'),
        )
      ),
      div({className:'viz-canvas-shell'},
        h('canvas',{ref:canvasRef,className:'viz-canvas',role:'img','aria-label':'Visualization'})
      )
    ),
    viz ? div({style:{marginTop:12}},
      h4({style:{fontSize:12,color:'var(--textMuted)',marginBottom:4}}, 'Last Rendered Payload'),
      pre({style:{fontSize:11}}, JSON.stringify(viz,null,2))
    ) : null,
  );
}

/* ───────── MAIN APP ───────── */
function App() {
  const [lesson, setLesson] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [status, setStatus] = useState('offline');
  const [allLessons, setAllLessons] = useState([]);

  const filteredLessons = allLessons.filter(l =>
    !selectedSubject || l.subject === selectedSubject
  );

  useEffect(() => {
    Promise.all([
      api('/api/syllabus/subjects'),
      api('/api/instructions'),
      api('/health'),
      api('/api/content/lessons'),
    ]).then(([s, i, h, cl]) => {
      if (s.ok) setSubjects(s.subjects);
      if (i.ok) setInstructions(i.instructions || []);
      if (cl.ok) {
        setAllLessons(cl.lessons || []);
        if (cl.lessons.length) {
          const first = cl.lessons[0];
          setSelectedSubject(first.subject);
          setSelectedChapter(first.lessonId);
          loadLesson(first.lessonId);
        }
      }
      setStatus(h.ok ? 'online' : 'offline');
    }).catch(() => setStatus('offline'));
  }, []);

  const loadLesson = useCallback(async (lessonId) => {
    setLesson(null);
    setActiveNav('overview');
    const res = await api('/api/content/lessons/'+lessonId);
    if (res.ok) {
      setLesson(res.lesson);
      setSelectedChapter(lessonId);
    }
  }, []);

  const handleSubjectChange = useCallback((subjectId) => {
    setSelectedSubject(subjectId);
    const lessonsInSubject = allLessons.filter(l => l.subject === subjectId);
    if (lessonsInSubject.length) {
      loadLesson(lessonsInSubject[0].lessonId);
    }
  }, [allLessons, loadLesson]);

  const view = (() => {
    if (!lesson) return h(Loading);
    switch (activeNav) {
      case 'overview':    return h(Overview, {lesson,subjects,instructions});
      case 'concepts':    return h(Concepts, {lesson});
      case 'theorems':    return h(Theorems, {lesson});
      case 'examples':    return h(Examples, {lesson});
      case 'exercises':   return h(Exercises, {lesson});
      case 'rd-sharma':   return h(ExtensionView, {title:'📖 RD Sharma Extensions', data:lesson.rd_sharma_extensions});
      case 'rs-aggarwal': return h(ExtensionView, {title:'📖 RS Aggarwal Extensions', data:lesson.rs_aggarwal_extensions});
      case 'model-papers': return h(ModelPapers, {lesson});
      case 'quizzes':     return h(Quizzes, {lesson});
      case 'vedic-math':  return h(VedicMath, {lesson});
      case 'mind-maps':   return h(MindMaps, {lesson});
      case 'viz':         return h(Viz, {lesson});
      default:            return h(Overview, {lesson,subjects,instructions});
    }
  })();

  return div(null,
    /* ── HEADER ── */
    div({className:'header'},
      div({className:'header-brand'},
        div({className:'header-logo'}, 'CX'),
        div({className:'header-title'},
          h1(null, 'ClassX Companion'),
          p(null, 'Learn Maths with Fun — Real-Life Applications & Indian Pedagogy')
        )
      ),
      div({className:'header-chapter'},
        label({style:{fontSize:12,color:'var(--textMuted)',marginRight:4}}, 'Subject:'),
        select_({
          className:'chapter-select',
          value:selectedSubject,
          onChange:e => handleSubjectChange(e.target.value)
        },
          subjects.map(s => option({key:s.id,value:s.id},
            s.name
          ))
        ),
        label({style:{fontSize:12,color:'var(--textMuted)',margin:'0 4px 0 12px'}}, 'Chapter:'),
        select_({
          className:'chapter-select',
          value:selectedChapter,
          onChange:e => loadLesson(e.target.value)
        },
          filteredLessons.map(l => option({key:l.lessonId,value:l.lessonId},
            l.title || l.lessonId
          ))
        ),
        div({className:'header-status '+status},
          div({className:'status-dot'}),
          status==='online'?'API Online':'API Offline'
        )
      )
    ),

    /* ── LAYOUT ── */
    div({className:'layout'},
      /* Sidebar */
      div({className:'sidebar'},
        div({className:'sidebar-label'}, '📚 Learn'),
        NAV_ITEMS.slice(0,6).map(item => btn({
          key:item.id, className:'nav-btn'+(activeNav===item.id?' active':''),
          onClick:()=>setActiveNav(item.id)
        }, span({className:'nav-icon'}, item.icon), item.label)),
        div({className:'sidebar-label',style:{marginTop:8}}, '🎯 Practice'),
        NAV_ITEMS.slice(6).map(item => btn({
          key:item.id, className:'nav-btn'+(activeNav===item.id?' active':''),
          onClick:()=>setActiveNav(item.id)
        }, span({className:'nav-icon'}, item.icon), item.label)),
        lesson ? div({style:{marginTop:'auto',paddingTop:12,borderTop:'1px solid var(--panelBorder)'}},
          div({style:{fontSize:11,color:'var(--textMuted)',textAlign:'center'}},
            (lesson.concepts?.length||0)+' concepts • '+
            (lesson.theorems?.length||0)+' theorems • '+
            (Object.keys(lesson.exercises||{}).length)+' exercises'
          )
        ) : null
      ),

      /* Main */
      div({className:'main'}, view)
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(App));
