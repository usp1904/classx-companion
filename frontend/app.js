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

/* ───────── KaTeX rendering ───────── */
function renderFormula(latex) {
  if (!window.katex || !latex) return latex || '';
  try {
    return window.katex.renderToString(latex, { throwOnError: false, displayMode: false });
  } catch (e) {
    return latex;
  }
}
function renderFormulaDisplay(latex) {
  if (!window.katex || !latex) return latex || '';
  try {
    return window.katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch (e) {
    return latex;
  }
}
function InlineFormula({ latex }) {
  if (!latex) return null;
  return h('span', { className:'formula-inline', dangerouslySetInnerHTML:{ __html: renderFormula(latex) } });
}
function FormulaBox({ latex }) {
  if (!latex) return null;
  return div({ className:'formula-box', dangerouslySetInnerHTML:{ __html: renderFormulaDisplay(latex) } });
}

/* ───────── API ───────── */
const api = (path) => fetch(path).then(r => r.json());

/* ───────── THEME COLORS ───────── */
const C = {
  cyan: '#2563eb', violet: '#2563eb', green: '#14b8a6', amber: '#f59e0b', red: '#f43f5e'
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
  { id:'interactive',  icon:'🎮', label:'Interactive' },
  { id:'media',           icon:'🎥', label:'Media Overview' },
  { id:'rag-search',    icon:'🔍', label:'RAG Hybrid Search' },
  { id:'ai-tutor',      icon:'🤖', label:'AI Tutor' },
  { id:'account',       icon:'👤', label:'My Account' },
  { id:'leaderboard',   icon:'🏆', label:'Leaderboard' },
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
  const totalProblems = Object.values(d.exercises||{}).reduce((sum, ex) => sum + (ex.problems?.length||0), 0);
  const totalRdProblems = (d.rd_sharma_extensions?.topics||[]).reduce((s, t) => s + (t.examples?.length||0), 0);
  const totalRsProblems = (d.rs_aggarwal_extensions?.topics||[]).reduce((s, t) => s + (t.examples?.length||0), 0);
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
    totalProblems > 0 ? div({style:{marginBottom:16,fontSize:13,color:'var(--textDim)'}},
      `📊 Total NCERT Problems: ${totalProblems}  |  RD Sharma: ${totalRdProblems}  |  RS Aggarwal: ${totalRsProblems}`
    ) : null,
    div({className:'outcomes'},
      h3(null, '🎯 Learning Outcomes'),
      ul(null, (d.outcomes||[]).map((o,i) => li({key:i}, o)))
    ),
    d.common_misconceptions?.length ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.amber,marginBottom:8}}, '⚠️ Common Misconceptions'),
      d.common_misconceptions.map((m,i) => div({key:i,className:'misconception-card',dangerouslySetInnerHTML:{__html:m.replace(/^(.*?)(—|–)(.*)$/,'<strong>$1</strong>$2$3')}}))
    ) : null,
    instructions && instructions.length ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.violet,marginBottom:8}}, '🔧 Active System Modules'),
      div({style:{display:'flex',flexDirection:'column',gap:8}},
        instructions.map((im,i) => div({key:im.name||i,className:'concept-card',style:{padding:14,marginBottom:0}},
          div({style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}},
            h4({style:{fontSize:13,color:C.violet,fontWeight:600}}, im.name),
        span({className:'tag cyan'}, (im.triggers||[]).length+' triggers')
          ),
          im.description ? p({style:{fontSize:12,color:'var(--textDim)',marginTop:6,lineHeight:1.6}}, im.description) : null,
          (im.triggers||[]).length ? div({style:{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}},
            im.triggers.map((t,j) => span({key:j,className:'tag green',style:{fontSize:10}}, t))
          ) : null
        ))
      )
    ) : null,
  );
}

/* ───────── CONCEPTS ───────── */
function Concepts({ lesson }) {
  const [carouselMode, setCarouselMode] = useState(false);
  if (!lesson?.concepts) return null;
  return div(null,
    div({style:{display:'flex',justifyContent:'flex-end',marginBottom:8,gap:8}},
      btn({
        className:'btn '+(carouselMode?'btn-primary':'btn-secondary'),
        onClick:()=>setCarouselMode(c=>!c)
      }, carouselMode?'📋 List View':'🔄 Slideshow')
    ),
    carouselMode
      ? h(ConceptCarousel, {concepts:lesson.concepts})
      : div({className:'card'},
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
            c.industry_relevance ? div({className:'concept-section concept-industry'},
              h4(null, '🏭 Where This Is Used — Industry & Engineering'),
              p(null, c.industry_relevance)
            ) : null,
            (c.engineering_domains || c.future_careers) ? div({className:'concept-section'},
              c.engineering_domains ? div(null,
                h4(null, '🔧 Engineering Domains'),
                p(null, c.engineering_domains)
              ) : null,
              c.future_careers ? div(null,
                h4(null, '🚀 Your Future Career Paths'),
                p(null, c.future_careers)
              ) : null
            ) : null,
            c.day_to_day_usage?.length ? div({className:'concept-section'},
              h4(null, '📌 Day-to-Day Usage'),
              ul(null, c.day_to_day_usage.map((u,j) => li({key:j}, u)))
            ) : null,
            c.video_embed ? div({className:'concept-section video-section', style:{marginTop:16}},
              h4(null, '🎬 Concept Visualization Reel'),
              div({style:{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:10,border:'1px solid var(--panelBorder)'}},
                h('iframe', {
                  src: c.video_embed,
                  title: c.name,
                  style: {position:'absolute',top:0,left:0,width:'100%',height:'100%',border:0},
                  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                  allowFullScreen: true
                })
              )
            ) : null
          ))
        )
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
      t.statement ? div({className:'theorem-statement',dangerouslySetInnerHTML:{__html:renderFormulaDisplay(t.statement)}}) : null,
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
  const [solverIdx, setSolverIdx] = useState(-1);
  if (!lesson?.worked_examples) return null;
  return div(null,
    solverIdx >= 0 ? div({className:'card'},
      div({style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
        h3({style:{fontSize:15,fontWeight:600}}, '▶ Animated: '+(lesson.worked_examples[solverIdx]?.topic||'')),
        btn({className:'btn btn-secondary',onClick:()=>setSolverIdx(-1)}, '✕ Close')
      ),
      h(AnimatedStepSolver, {key: solverIdx, steps: lesson.worked_examples[solverIdx].board_mode||[
        lesson.worked_examples[solverIdx].problem,
        lesson.worked_examples[solverIdx].speed_mode||''
      ]})
    ) : null,
    div({className:'card'},
      div({className:'card-header'},
        h2(null, '✏️ Worked Examples — Step by Step'),
        p(null, 'Board exam style + competitive speed mode + JEE shortcuts'),
      ),
      lesson.worked_examples.map((ex, i) => div({key:i, className:'example-card'},
        h3(null, (i+1)+'. '+ex.topic),
        div({className:'example-problem',dangerouslySetInnerHTML:{__html:renderFormulaDisplay(ex.problem)}}),
        div({style:{marginBottom:8}},
          btn({className:'btn btn-primary',onClick:()=>setSolverIdx(i)}, '▶ Animated Walkthrough')
        ),
        ex.board_mode ? div({className:'example-mode board'},
          h5(null, '📋 Board Exam Mode (Step-by-Step)'),
          pre({dangerouslySetInnerHTML:{__html:ex.board_mode.map(l => renderFormula(l)).join('\n')}})
        ) : null,
        ex.speed_mode ? div({className:'example-mode speed'},
          h5(null, '⚡ Speed Mode — Golden Step'),
          pre({dangerouslySetInnerHTML:{__html:renderFormula(ex.speed_mode)}})
        ) : null,
        ex.competitive_shortcut ? div({className:'example-mode speed'},
          h5(null, '🏆 Competitive Exam Shortcut'),
          pre({dangerouslySetInnerHTML:{__html:renderFormula(ex.competitive_shortcut)}})
        ) : null,
      ))
    )
  );
}

/* ───────── EXERCISES ───────── */
function Exercises({ lesson }) {
  const [activeEx, setActiveEx] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(0);
  if (!lesson?.exercises) return null;
  const keys = Object.keys(lesson.exercises);
  const current = lesson.exercises[keys[activeEx]];
  const problems = current?.problems || [];
  const pr = problems[currentProblem];

  const totalProblems = Object.values(lesson.exercises).reduce((sum, ex) => sum + (ex.problems?.length||0), 0);

  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '📝 NCERT Exercises — Every Problem Solved'),
      p(null, (current?.title||'')+'. '+(current?.objective||'')),
    ),
    div({className:'exercise-tabs'},
      keys.map((k, i) => btn({
        key:k, className:'exercise-tab'+(i===activeEx?' active':''),
        onClick:()=>{setActiveEx(i);setCurrentProblem(0);}
      }, k.replace(/_/g,' ').toUpperCase(),
        span({className:'exercise-tab-count'}, (lesson.exercises[k].problems?.length||0)+' problems')
      ))
    ),
    problems.length > 0 ? div({className:'problem-nav'},
      btn({
        className:'problem-nav-btn',
        onClick:()=>setCurrentProblem(p => Math.max(0, p-1)),
        disabled:currentProblem===0
      }, '‹ Prev'),
      span({className:'problem-counter'}, `Problem ${currentProblem+1} of ${problems.length} in ${keys[activeEx].replace(/_/g,' ').toUpperCase()}`),
      span({className:'problem-counter',style:{color:'var(--textMuted)',fontSize:11}}, `(${totalProblems} total in chapter)`),
      btn({
        className:'problem-nav-btn',
        onClick:()=>setCurrentProblem(p => Math.min(problems.length-1, p+1)),
        disabled:currentProblem===problems.length-1
      }, 'Next ›'),
    ) : null,
    pr ? div({key:pr.id+'-'+currentProblem, className:'exercise-problem'},
      div({className:'exercise-problem-header'},
        h4(null, pr.id+'. '+pr.question),
        pr.formulae_used?.length ? span({className:'formula-used',title:'Formulae leveraged'},
          pr.formulae_used.length+' formulas'
        ) : null,
      ),
      pr.solution?.length ? div({className:'exercise-solution'},
        pr.solution.map((s, i) => div({key:i, style:{marginBottom:i<pr.solution.length-1?6:0},
          dangerouslySetInnerHTML:{__html:renderFormula(s)}
        }))
      ) : null,
      pr.final_answer ? div({className:'exercise-answer'},
        '✅ ', h(InlineFormula, {latex: pr.final_answer})
      ) : null,
      pr.concept_insight ? div({className:'exercise-insight'}, '💡 '+pr.concept_insight) : null,
      pr.formulae_used?.length ? div({style:{marginTop:8,padding:'8px 10px',background:'var(--accentLight)',borderRadius:6,fontSize:12}},
        span({style:{fontWeight:600,color:C.cyan}}, '📐 Formulae leveraged: '),
        pr.formulae_used.map((f, fi) => span({key:fi,style:{margin:'0 3px',padding:'1px 5px',background:'var(--accentDim)',borderRadius:3,color:C.cyan}},
          f
        ))
      ) : null,
    ) : div({style:{color:'var(--textMuted)',padding:20,textAlign:'center'}}, 'No problems in this exercise.'),
    problems.length > 1 ? div({style:{display:'flex',gap:4,flexWrap:'wrap',marginTop:12,justifyContent:'center'}},
      problems.map((_, pi) => btn({
        key:pi,
        style:{
          width:24,height:24,borderRadius:'50%',fontSize:10,fontWeight:600,
          background: pi===currentProblem ? 'var(--accent)' : 'var(--bg1)',
          color: pi===currentProblem ? '#fff' : 'var(--textDim)',
          border: '1px solid var(--panelBorder)',
        },
        onClick:()=>setCurrentProblem(pi)
      }, String(pi+1)))
    ) : null,
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
      t.formula ? FormulaBox({latex: t.formula}) : null,
      t.method ? p(null, t.method) : null,
      t.examples?.length ? t.examples.map((ex, j) => div({key:j, className:'ext-example'},
        h5(null, 'Example: '+(ex.problem||'')),
        ex.solution?.length ? ul({className:'step-list'}, ex.solution.map((s,k) => li({key:k, dangerouslySetInnerHTML:{__html:renderFormula(s)}}))) : null,
        ex.final_answer ? p({style:{fontSize:13,fontWeight:600,color:C.green,marginTop:6}}, h(InlineFormula, {latex: ex.final_answer})) : null,
      )) : null,
      t.competitive_note ? div({style:{padding:'8px 12px',background:'var(--amberDim)',borderRadius:8,marginTop:8,fontSize:12,color:C.amber}}, '🏆 '+t.competitive_note) : null,
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
        h3({style:{color:C[tier.color]}}, '▸ '+tier.label+' ('+items.length+' problems)'),
        items.map((item, i) => div({key:i, style:{padding:'10px 14px',marginBottom:8,background:'var(--bg2)',borderRadius:8}},
          div({style:{fontWeight:600,fontSize:13,marginBottom:4}}, (i+1)+'. '+item.question),
          item.steps?.length ? div({style:{fontSize:12,color:'var(--textDim)',marginBottom:4}},
            item.steps.map((s, j) => div({key:j}, '→ '+s))
          ) : null,
          item.answer ? div({style:{fontSize:12,color:C.green,fontWeight:600}}, '✅ '+item.answer) : null,
          item.hints?.length ? div({style:{fontSize:11,color:C.cyan,marginTop:4,fontStyle:'italic'}},
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
        div({className:'quiz-question',
          dangerouslySetInnerHTML:{__html:renderFormula(q.question)}
        }),
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
              disabled:sel !== undefined,
              dangerouslySetInnerHTML:{__html:renderFormula(opt)}
            });
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
      v.real_numbers_application ? p({style:{fontSize:12,color:C.cyan,marginBottom:8}}, '📌 '+v.real_numbers_application) : null,
      v.examples?.length ? v.examples.map((ex, j) => div({key:j, style:{marginTop:10,padding:'10px 14px',background:'rgba(0,0,0,0.02)',borderRadius:8}},
        p({style:{fontWeight:600,fontSize:13,marginBottom:4}}, 'Example: '+ex.problem),
        ex.explanation ? p({style:{fontSize:12,color:'var(--textDim)',fontStyle:'italic',marginBottom:4}}, ex.explanation) : null,
        ex.steps ? ul({className:'vedic-steps'}, ex.steps.map((s,k) => li({key:k, dangerouslySetInnerHTML:{__html:renderFormula(s)}}))) : null,
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

/* ───────── CONCEPT CAROUSEL ───────── */
function ConceptCarousel({ concepts }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef(null);
  useEffect(() => {
    if (playing) { timerRef.current = setTimeout(() => setIdx(i => (i+1)%concepts.length), 5000); }
    return () => clearTimeout(timerRef.current);
  }, [playing, idx, concepts.length]);
  if (!concepts?.length) return null;
  const c = concepts[idx];
  return div({className:'concept-carousel'},
    div({className:'cc-header'},
      h3(null, '🔄 Concept Slideshow'),
      div({className:'cc-controls'},
        btn({onClick:()=>setPlaying(p=>!p)}, playing?'⏸ Pause':'▶ Play'),
        span({style:{fontSize:11,color:'var(--textMuted)'}}, `${idx+1}/${concepts.length}`)
      )
    ),
    div({key:idx, className:'cc-slide'},
      h4({className:'cc-title'}, c.name),
      c.real_life_application ? div({className:'cc-section cc-life'},
        h5(null, '🏠 Real Life'), p(null, c.real_life_application)
      ) : null,
      c.purpose ? div({className:'cc-section cc-purpose'},
        h5(null, '🎯 Purpose'), p(null, c.purpose)
      ) : null,
      c.industry_relevance ? div({className:'cc-section cc-industry'},
        h5(null, '🏭 Industry & Engineering'), p(null, c.industry_relevance)
      ) : null,
      (c.engineering_domains || c.future_careers) ? div({className:'cc-section'},
        c.engineering_domains ? div(null,
          h5(null, '🔧 Engineering Domains'), p(null, c.engineering_domains)
        ) : null,
        c.future_careers ? div(null,
          h5(null, '🚀 Future Career Paths'), p(null, c.future_careers)
        ) : null
      ) : null,
      c.day_to_day_usage?.length ? div({className:'cc-section'},
        h5(null, '📌 Examples'),
        ul(null, c.day_to_day_usage.map((u,j) => li({key:j}, u)))
      ) : null,
      c.video_embed ? div({className:'cc-section', style:{marginTop:16}},
        h5(null, '🎬 Visualization Reel'),
        div({style:{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:10,border:'1px solid var(--panelBorder)'}},
          h('iframe', {
            src: c.video_embed,
            title: c.name,
            style: {position:'absolute',top:0,left:0,width:'100%',height:'100%',border:0},
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowFullScreen: true
          })
        )
      ) : null
    ),
    div({className:'cc-dots'},
      concepts.map((_, i) => div({
        key:i, className:'cc-dot'+(i===idx?' active':''),
        onClick:()=>{setIdx(i);setPlaying(false);}
      }))
    )
  );
}

/* ───────── ANIMATED STEP SOLVER ───────── */
function AnimatedStepSolver({ steps }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    if (playing && step < steps.length-1) {
      timerRef.current = setTimeout(() => setStep(s => Math.min(s+1, steps.length-1)), 2000);
    } else if (playing && step >= steps.length-1) { setPlaying(false); }
    return () => clearTimeout(timerRef.current);
  }, [playing, step, steps.length]);
  const done = steps.length;
  return div({className:'step-solver'},
    div({className:'ss-progress'},
      div({className:'ss-track',
        style:{width:(step+1)/done*100+'%'}}
      )
    ),
    steps.map((s, i) => div({
      key:i,
      className:'ss-step'+(i<step?' done':'')+(i===step?' active':'')+(i>step?' future':'')
    },
      div({className:'ss-step-num'}, i+1),
      div({className:'ss-step-text',dangerouslySetInnerHTML:{__html:renderFormula(s)}}
      )
    )),
    div({className:'ss-controls'},
      btn({disabled:step===0,onClick:()=>{setPlaying(false);setStep(s=>s-1);}},'◀ Prev'),
      btn({onClick:()=>{if(step>=done-1){setStep(0);setPlaying(false);}else setPlaying(p=>!p);}}, playing?'⏸ Pause':(step<done-1?'▶ Auto-Play':'🔄 Reset')),
      btn({disabled:step>=done-1,onClick:()=>{setPlaying(false);setStep(s=>s+1);}},'Next ▶'),
    )
  );
}

/* ───────── INTERACTIVE UNIT CIRCLE ───────── */
function drawUnitCircle(ctx, w, h, angleDeg, opts) {
  const cx = w*0.35, cy = h*0.5, r = Math.min(w*0.3, h*0.4);
  const rad = angleDeg*Math.PI/180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const px = cx+r*cos, py = cy-r*sin;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='rgba(37,99,235,0.15)'; ctx.lineWidth=1;
  for (let a=0;a<360;a+=30) {
    const ar=a*Math.PI/180;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+r*Math.cos(ar),cy-r*Math.sin(ar)); ctx.stroke();
  }
  ctx.strokeStyle='rgba(37,99,235,0.3)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='rgba(37,99,235,0.2)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx-r-10,cy); ctx.lineTo(cx+r+10,cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx,cy-r-10); ctx.lineTo(cx,cy+r+10); ctx.stroke();
  ctx.fillStyle='#2563eb'; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,cy); ctx.lineTo(px,py); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#f43f5e'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(cx,cy,r*0.06,0,-rad,true); ctx.stroke();
  ctx.fillStyle='#f43f5e'; ctx.font='bold 11px Inter,sans-serif';
  ctx.fillText('θ='+angleDeg+'°',cx+r*0.65*Math.cos(rad/2),cy-r*0.65*Math.sin(rad/2)-6);
  ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
  ctx.fillStyle='#1e293b';
  ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
  ctx.font='12px Inter,sans-serif'; ctx.textAlign='center';
  ctx.fillStyle='#14b8a6';
  ctx.fillText('sin = '+sin.toFixed(4), cx+r+60, cy-20);
  ctx.fillStyle='#2563eb';
  ctx.fillText('cos = '+cos.toFixed(4), cx+r+60, cy);
  ctx.fillStyle='#f59e0b';
  ctx.fillText('tan = '+(angleDeg%90===0?'∞':(sin/cos).toFixed(4)), cx+r+60, cy+20);
  ctx.fillStyle='#94a3b8'; ctx.font='10px Inter,sans-serif';
  ctx.fillText('(1,0)', cx+r+12, cy+14);
  ctx.fillText('(0,1)', cx-10, cy-r-6);
}

function UnitCircle({ lesson }) {
  const [angle, setAngle] = useState(45);
  const [autoRotate, setAutoRotate] = useState(false);
  const canvasRef = useRef();
  const timerRef = useRef(null);
  const draw = useCallback(() => {
    const ca = canvasRef.current;
    if (!ca) return;
    ca.width = ca.clientWidth; ca.height = ca.clientHeight;
    drawUnitCircle(ca.getContext('2d'), ca.width, ca.height, angle, {});
  }, [angle]);
  useEffect(() => { draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw); }, [draw]);
  useEffect(() => {
    if (autoRotate) { timerRef.current = setTimeout(() => setAngle(a => (a+1)%360), 50); }
    return () => clearTimeout(timerRef.current);
  }, [autoRotate, angle]);
  return div({className:'interactive-card'},
    h3({style:{marginBottom:8}}, '📐 Unit Circle Explorer'),
    p({style:{fontSize:12,color:'var(--textDim)',marginBottom:12}}, 'Drag or auto-rotate to see sin, cos, tan change in real time'),
    div({className:'viz-canvas-shell', style:{minHeight:300}},
      h('canvas',{ref:canvasRef,className:'viz-canvas',style:{height:300}})
    ),
    div({style:{display:'flex',gap:12,alignItems:'center',marginTop:12,flexWrap:'wrap'}},
      label({style:{fontSize:12,fontWeight:600}}, `Angle: ${angle}°`),
      h('input',{type:'range',min:0,max:360,value:angle,style:{flex:1,maxWidth:300},
        onChange:e=>{setAutoRotate(false);setAngle(+e.target.value);}
      }),
      btn({onClick:()=>setAutoRotate(a=>!a), className:'btn '+(autoRotate?'btn-primary':'btn-secondary')},
        autoRotate?'⏹ Stop':'▶ Auto-Rotate'
      ),
      btn({onClick:()=>{setAutoRotate(false);setAngle(45);}, className:'btn btn-secondary'},'Reset 45°')
    )
  );
}

/* ───────── INTERACTIVE RIGHT TRIANGLE ───────── */
function drawRightTriangle(canvas, a, b) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  const pad = 60, scale = Math.min((w-pad*2)/Math.max(a,b), (h-pad*2)/Math.max(a,b), 80);
  const sx = pad, sy = h-pad;
  const ax = sx + b*scale, ay = sy;
  const bx = sx, by = sy - a*scale;
  const c = Math.sqrt(a*a+b*b);
  ctx.strokeStyle='#2563eb'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ax,ay); ctx.lineTo(bx,by); ctx.closePath(); ctx.stroke();
  ctx.fillStyle='rgba(37,99,235,0.06)';
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ax,ay); ctx.lineTo(bx,by); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#14b8a6'; ctx.font='bold 14px Inter,sans-serif'; ctx.textAlign='center';
  const mx = (sx+ax)/2, my = (sy+ay)/2;
  ctx.fillText('b = '+b, mx, my+18);
  ctx.fillStyle='#2563eb';
  const nx = (sx+bx)/2-4, ny = (sy+by)/2;
  ctx.fillText('a = '+a, nx-20, ny);
  ctx.fillStyle='#f59e0b';
  const hx = (ax+bx)/2+8, hy = (ay+by)/2;
  ctx.fillText('c = '+c.toFixed(2), hx+12, hy);
  const angleA = Math.atan2(a,b)*180/Math.PI;
  ctx.fillStyle='#f43f5e'; ctx.font='12px Inter,sans-serif';
  ctx.beginPath(); ctx.arc(sx,sy,20,0,-angleA*Math.PI/180,true); ctx.stroke();
  ctx.fillText('θ='+angleA.toFixed(1)+'°', sx+30, sy-8);
  ctx.fillStyle='#2563eb'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center';
  ctx.fillText('sin θ = '+(a/c).toFixed(4)+'  cos θ = '+(b/c).toFixed(4)+'  tan θ = '+(a/b).toFixed(4),
    w/2, h-8);
  ctx.fillStyle='#94a3b8'; ctx.textAlign='left'; ctx.font='11px Inter,sans-serif';
  ctx.fillText('(0,0)', sx-6, sy+16);
  ctx.fillText('('+b+',0)', ax-10, sy+16);
  ctx.fillText('(0,'+a+')', bx-32, by+4);
}

function RightTriangle() {
  const [a, setA] = useState(4);
  const [b, setB] = useState(3);
  const canvasRef = useRef();
  const draw = useCallback(() => {
    const ca = canvasRef.current;
    if (!ca) return;
    drawRightTriangle(ca, a, b);
  }, [a,b]);
  useEffect(() => { draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw); }, [draw]);
  return div({className:'interactive-card'},
    h3({style:{marginBottom:8}}, '🔺 Right Triangle Explorer'),
    p({style:{fontSize:12,color:'var(--textDim)',marginBottom:12}}, 'Adjust sides to see trigonometry in action'),
    div({className:'viz-canvas-shell', style:{minHeight:260}},
      h('canvas',{ref:canvasRef,className:'viz-canvas',style:{height:260}})
    ),
    div({style:{display:'flex',gap:16,marginTop:12,flexWrap:'wrap',alignItems:'center'}},
      div(null, label({style:{fontSize:11}},`Opposite (a): ${a}`),
        h('input',{type:'range',min:1,max:10,step:0.5,value:a,style:{width:140,display:'block'},
          onChange:e=>setA(+e.target.value)})
      ),
      div(null, label({style:{fontSize:11}},`Adjacent (b): ${b}`),
        h('input',{type:'range',min:1,max:10,step:0.5,value:b,style:{width:140,display:'block'},
          onChange:e=>setB(+e.target.value)})
      ),
      btn({onClick:()=>{setA(4);setB(3);}, className:'btn btn-secondary'},'↺ Reset 3-4-5')
    )
  );
}

/* ───────── INTERACTIVE WRAPPER ───────── */
function Interactive({ lesson }) {
  return div(null,
    h(UnitCircle, {lesson}),
    div({style:{marginTop:16}}, h(RightTriangle))
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
  ctx.strokeStyle = 'rgba(37,99,235,0.08)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const gx = range.xMin + (range.xMax - range.xMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(mapX(gx), 0); ctx.lineTo(mapX(gx), h); ctx.stroke();
    const gy = range.yMin + (range.yMax - range.yMin) * i / 10;
    ctx.beginPath(); ctx.moveTo(0, mapY(gy)); ctx.lineTo(w, mapY(gy)); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(37,99,235,0.25)'; ctx.lineWidth = 1.5;
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
    visualizationProperties:{functionString:'2*x^2 - 5*x + 3',curveColor:'#2563eb',gridRange:{xMin:-3,xMax:5,yMin:-4,yMax:8}}
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



function RagSearch() {
  const [query, setQuery] = useState('Linear');
  const [results, setResults] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    setSelectedProblem(null);
    setSelectedConcept(null);
    try {
      const res = await fetch(`/api/db/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok) {
        setResults(data.results);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    search();
  }, []);

  const loadProblem = async (id) => {
    try {
      const res = await fetch(`/api/db/problems/${id}`);
      const data = await res.json();
      if (data.ok) {
        setSelectedProblem(data.details);
        setSelectedConcept(null);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const loadConcept = async (id) => {
    try {
      const res = await fetch(`/api/db/concepts/${id}`);
      const data = await res.json();
      if (data.ok) {
        setSelectedConcept(data.graph);
        setSelectedProblem(null);
      }
    } catch(e) {
      console.error(e);
    }
  };

  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '🔍 Hybrid Search (Vector & Graph RAG)'),
      p(null, 'Query the indexed Class X Mathematics syllabus, textbook problems, and knowledge graph relationships.'),
    ),
    div({style:{display:'flex',gap:12,marginBottom:20}},
      h('input', {
        className: 'tutor-input',
        style: {fontSize: 14, padding: '10px 14px', flex: 1},
        type: 'text',
        placeholder: 'Search topics, problems, formulas...',
        value: query,
        onChange: e => setQuery(e.target.value),
        onKeyDown: e => e.key === 'Enter' && search()
      }),
      btn({className:'btn btn-primary', onClick:search, disabled:loading}, loading ? 'Searching...' : 'Search')
    ),
    
    selectedProblem ? div({className:'concept-card', style:{borderLeft:'4px solid var(--accent)'}},
      btn({className:'btn btn-secondary', style:{float:'right', padding:'4px 8px'}, onClick:()=>setSelectedProblem(null)}, '✕ Close Details'),
      h3(null, `${selectedProblem.problem.book_source} - ${selectedProblem.problem.exercise_label}`),
      div({className:'exercise-problem', style:{fontSize:15, margin:'10px 0', background:'var(--bg0)'}, dangerouslySetInnerHTML:{__html:renderFormulaDisplay(selectedProblem.problem.question_text)}}),
      
      h4({style:{fontSize:13, color:'var(--accent)', margin:'12px 0 6px'}}, 'Step-by-Step Solution:'),
      div({style:{display:'flex', flexDirection:'column', gap:10}},
        selectedProblem.steps.map(s => div({key:s.id, style:{background:'var(--bg2)', padding:12, borderRadius:8, border:'1px solid var(--panelBorder)'}},
          strong(null, `Step ${s.step_number}: `),
          span(null, s.step_explanation),
          s.step_latex ? div({style:{marginTop:6}, dangerouslySetInnerHTML:{__html:renderFormulaDisplay(s.step_latex)}}) : null,
          s.vedic_shortcut_applied && s.vedic_shortcut_applied !== 'None' ? div({style:{marginTop:6, color:C.amber, fontSize:12}},
            `⚡ Vedic Shortcut: ${s.vedic_shortcut_applied}`
          ) : null
        ))
      )
    ) : null,

    selectedConcept ? div({className:'concept-card', style:{borderLeft:'4px solid var(--sage)'}},
      btn({className:'btn btn-secondary', style:{float:'right', padding:'4px 8px'}, onClick:()=>setSelectedConcept(null)}, '✕ Close Graph'),
      h3(null, `Concept Node: ${selectedConcept.concept.name}`),
      p({style:{margin:'10px 0'}, dangerouslySetInnerHTML:{__html:renderFormula(selectedConcept.concept.description)}}),
      
      h4({style:{fontSize:13, color:'var(--sage)', margin:'12px 0 6px'}}, 'Knowledge Graph Connections:'),
      div({style:{display:'flex', gap:8, flexWrap:'wrap'}},
        selectedConcept.edges.map(e => span({key:e.id, className:'tag violet'},
          `${e.source_name} ➔ ${e.target_name} (${e.relation_type})`
        ))
      )
    ) : null,

    !selectedProblem && !selectedConcept && results ? div({className:'viz-split'},
      div(null,
        h3({style:{fontSize:14, color:C.cyan, marginBottom:10}}, '📝 Matching Textbook Problems'),
        results.problems.length > 0 ? results.problems.map(p => btn({
          key:p.id,
          className:'nav-btn',
          style:{marginBottom:6, padding:'10px', background:'var(--bg1)', border:'1px solid var(--panelBorder)'},
          onClick:()=>loadProblem(p.id)
        }, span({style:{fontWeight:600, color:C.cyan, marginRight:8}}, `[${p.book_source}]`), p.question_text.slice(0, 80) + '...'))
        : p({style:{color:'var(--textMuted)', fontSize:13}}, 'No matching problems found.')
      ),
      div(null,
        h3({style:{fontSize:14, color:C.green, marginBottom:10}}, '📚 Syllabus Topics & Concepts'),
        results.concepts.length > 0 ? results.concepts.map(c => btn({
          key:c.id,
          className:'nav-btn',
          style:{marginBottom:6, padding:'10px', background:'var(--bg1)', border:'1px solid var(--panelBorder)'},
          onClick:()=>loadConcept(c.id)
        }, span({style:{fontWeight:600, color:C.green, marginRight:8}}, `[Concept]`), c.name))
        : p({style:{color:'var(--textMuted)', fontSize:13}}, 'No matching concepts found.')
      )
    ) : null
  );
}

/* ───────── DASHBOARD WIDGETS ───────── */
const ROLES_META = {
  student: 'Learn → Practice → Quizzes → AI Tutor → Leaderboard',
  teacher: 'Concepts → Exercises → Model Papers → Analytics → RAG Search (content QA)',
  parent: 'Overview → Progress → Leaderboard → Model Papers preview'
};
const ROLES_GROUPS = {
  student: [
    { label:'📚 Learn', items:['overview','concepts','theorems','examples','exercises'] },
    { label:'🎯 Practice', items:['model-papers','quizzes','vedic-math','mind-maps'] },
    { label:'🔬 Explore', items:['interactive','media'] },
    { label:'📖 Reference', items:['rd-sharma','rs-aggarwal'] },
    { label:'🔍 Tools', items:['rag-search','ai-tutor'] },
    { label:'👤 Account', items:['account','leaderboard'] }
  ],
  teacher: [
    { label:'📚 Teach', items:['overview','concepts','theorems','examples','exercises','model-papers'] },
    { label:'👥 Class', items:['leaderboard','account'] },
    { label:'🎯 Practice', items:['quizzes','vedic-math','mind-maps'] },
    { label:'🔬 Explore', items:['interactive','media','rag-search'] },
    { label:'📖 Reference', items:['rd-sharma','rs-aggarwal'] },
    { label:'⚙️ Tools', items:['ai-tutor'] }
  ],
  parent: [
    { label:'📊 Progress', items:['account','leaderboard','overview'] },
    { label:'🎯 Practice', items:['quizzes','model-papers','exercises'] },
    { label:'📚 Learn', items:['concepts','theorems','examples'] },
    { label:'🔬 Explore', items:['interactive','media'] },
    { label:'⚙️ Tools', items:['ai-tutor','rag-search'] },
    { label:'📖 Reference', items:['rd-sharma','rs-aggarwal'] },
    { label:'🧠 Extras', items:['vedic-math','mind-maps'] }
  ]
};

const SUBJECT_ICONS = {
  mathematics:'📐', physics:'⚛️', chemistry:'🧪', biology:'🧬',
  history:'🏛️', geography:'🌍', civics:'⚖️', economics:'💹'
};
const barStyle = (pct, color) => ({ width: Math.max(0, Math.min(100, pct)) + '%', height: '100%', background: color, borderRadius: 6, transition: 'width .5s ease' });

function DailyGoalRing({ goal }) {
  if (!goal) return null;
  const pct = goal.progressPct || 0;
  const r = 26, c = 2 * Math.PI * r;
  return div({ className:'dash-ring' },
    h('svg', { viewBox:'0 0 64 64', width:64, height:64 },
      h('circle', { cx:32, cy:32, r, fill:'none', stroke:'var(--panelBorder)', strokeWidth:7 }),
      h('circle', { cx:32, cy:32, r, fill:'none', stroke: goal.done ? 'var(--emerald)' : 'var(--marigold)', strokeWidth:7,
        strokeLinecap:'round', strokeDasharray:c, strokeDashoffset:c - (c * pct / 100),
        transform:'rotate(-90 32 32)', style:{ transition:'stroke-dashoffset .6s ease' } })
    ),
    div({ className:'dash-ring-center' }, String(pct) + '%'),
    div({ className:'dash-ring-label' }, goal.done ? 'Goal Met 🎉' : (goal.remaining + ' left today'))
  );
}

function WeeklyCalendar({ events }) {
  const [sel, setSel] = useState(null);
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const byDate = {};
  (events||[]).forEach(e => { const d = (e.createdAt||'').slice(0,10); if (d) (byDate[d]=byDate[d]||[]).push(e); });
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0,10);
    const list = byDate[key] || [];
    const anyCorrect = list.some(e => e.correct);
    const anyAttempt = list.length > 0;
    days.push({ key, label: dayLabels[dt.getDay()], num: dt.getDate(), list, anyCorrect, anyAttempt, isToday: i === 0 });
  }
  return div({ className:'dash-card' },
    div({ className:'dash-card-head' }, h3(null, '📅 This Week'), span({ className:'tag green' }, 'Tap a day')),
    div({ className:'cal-row' },
      days.map(d => div({ key:d.key,
        className:'cal-day'+(d.anyCorrect?' done':'')+(d.anyAttempt?' partial':'')+(d.isToday?' today':''),
        onClick:()=>setSel(sel===d.key?null:d.key)
      },
        span({ className:'cal-day-label' }, d.label),
        span({ className:'cal-day-num' }, d.num)
      ))
    ),
    sel ? (() => {
      const d = days.find(x => x.key === sel);
      const items = d ? d.list : [];
      return div({ className:'cal-detail' },
        div({ className:'cal-detail-head' }, span(null, d.key), btn({ className:'btn btn-secondary', style:{padding:'2px 8px',fontSize:11}, onClick:()=>setSel(null) }, '✕')),
        items.length ? items.slice(0,6).map((e,i) =>
          div({ className:'cal-item'+(e.correct?' ok':' miss') },
            span(null, e.difficulty),
            span(null, e.correct ? '✔ Correct  +'+e.xpAwarded+' XP' : 'Missed'),
            e.correct && e.xpAwarded ? span({ className:'tag green' }, '+' + e.xpAwarded + ' XP') : null
          )) : p({ style:{ fontSize:12, color:'var(--textMuted)' } }, 'No activity recorded this day.')
      );
    })() : null
  );
}

function ProfileSidebar({ profile, goal }) {
  if (!profile) return div({ className:'dash-card dash-profile' }, 'Loading profile…');
  const u = profile.user || {};
  const p = profile.progress || {};
  return div({ className:'dash-card dash-profile' },
    div({ className:'prof-top' },
      div({ className:'prof-avatar' }, (u.name||'L').charAt(0).toUpperCase()),
      div(null,
        h3(null, u.name || 'Learner'),
        p({ style:{ fontSize:12, color:'var(--textMuted)' } }, (profile.rank||'') + (profile.rankPosition ? ` • #${profile.rankPosition}` : ''))
      )
    ),
    div({ className:'prof-stats' },
      div({ className:'prof-stat' }, span({ className:'prof-stat-v accent' }, p.totalXp ?? 0), span({ className:'prof-stat-l' }, 'XP')),
      div({ className:'prof-stat' }, span({ className:'prof-stat-v marigold' }, p.currentStreak ?? 0), span({ className:'prof-stat-l' }, 'Streak')),
      div({ className:'prof-stat' }, span({ className:'prof-stat-v emerald' }, p.solvedCount ?? 0), span({ className:'prof-stat-l' }, 'Solved'))
    ),
    (profile.badges||[]).length ? div({ className:'badge-row' },
      profile.badges.slice(0,5).map((b,i) => span({ key:i, className:'tag amber' }, '🏅 '+b))
    ) : null,
    h(DailyGoalRing, { goal })
  );
}

function ProgressTrackers({ analytics, goal }) {
  const totalXp = analytics ? analytics.totalXp || 0 : 0;
  const level = Math.floor(totalXp / 100) + 1;
  const intoLevel = totalXp % 100;
  const acc = analytics ? (analytics.accuracy || 0) : 0;
  return div({ className:'dash-card' },
    div({ className:'dash-card-head' }, h3(null, '🚀 Progress Trackers')),
    div({ className:'trk' },
      span({ className:'trk-label' }, 'Level ' + level),
      div({ className:'trk-bar' }, div({ style: barStyle(intoLevel, 'var(--royal)') })),
      span({ className:'trk-meta' }, intoLevel + ' / 100 XP to level ' + (level+1))
    ),
    div({ className:'trk' },
      span({ className:'trk-label' }, 'Accuracy'),
      div({ className:'trk-bar' }, div({ style: barStyle(acc, 'var(--emerald)') })),
      span({ className:'trk-meta' }, acc + '% correct across ' + (analytics ? analytics.attempts : 0) + ' attempts')
    ),
    div({ className:'trk' },
      span({ className:'trk-label' }, 'Accuracy by streak: ' + (analytics ? analytics.currentStreak : 0) + ' days 🔥'),
      div({ className:'trk-value-row' },
        span({ className:'tag cyan' }, (analytics ? analytics.currentStreak : 0) + '-day streak'),
        span({ className:'tag violet' }, (analytics ? analytics.longestStreak : 0) + ' best')
      )
    )
  );
}

function SubjectCards({ subjects, onPick }) {
  return div({ className:'dash-card' },
    div({ className:'dash-card-head' }, h3(null, '📚 Your Subjects'), span({ className:'tag blue' }, subjects.length + ' subjects')),
    div({ className:'subject-grid' },
      subjects.map(s => btn({ key:s.id, className:'subject-card', onClick:()=>onPick(s), role:'button' },
        div({ className:'subject-icon' }, SUBJECT_ICONS[s.id] || '📘'),
        div({ className:'subject-body' },
          h4(null, s.name),
          p(null, s.description || '')
        ),
        span({ className:'subject-cta' }, 'Open →')
      ))
    )
  );
}

function Dashboard({ subjects, analytics, profile, goal, onPickSubject }) {
  return div({ className:'dash-grid' },
    div({ className:'dash-col dash-col-left' },
      h(ProfileSidebar, { profile, goal })
    ),
    div({ className:'dash-col dash-col-main' },
      h(ProgressTrackers, { analytics, goal }),
      h(WeeklyCalendar, { events: analytics ? analytics.recent : [] })
    ),
    div({ className:'dash-col dash-col-right' },
      h(SubjectCards, { subjects, onPick: onPickSubject })
    )
  );
}

/* ───────── MAIN APP ───────── */

function App() {
  const [selectedBoard, setSelectedBoard] = useState('CBSE_NCERT');
  const [lesson, setLesson] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [status, setStatus] = useState('offline');
  const [allLessons, setAllLessons] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('student');
  const [dashProfile, setDashProfile] = useState(null);
  const [dashAnalytics, setDashAnalytics] = useState(null);
  const [dashGoal, setDashGoal] = useState(null);

  const filteredLessons = allLessons.filter(l =>
    (!selectedSubject || l.subject === selectedSubject) &&
    (!selectedBoard || l.board === selectedBoard)
  );

  const loadLesson = useCallback(async (lessonId, boardId = selectedBoard) => {
    setLesson(null);
    setActiveNav('overview');
    setSidebarOpen(false);
    
    // 1. Try static
    try {
      const res = await api('/api/content/lessons/'+lessonId);
      if (res.ok) {
        setLesson(res.lesson);
        setSelectedChapter(lessonId);
        return;
      }
    } catch(e) {}

    // 2. Database Fallback
    try {
      const dbs = await api('/api/db/syllabus?board=' + boardId);
      if (dbs.ok && dbs.syllabus) {
        const dbCh = dbs.syllabus.find(c => c.id === lessonId);
        if (dbCh) {
            const mockLesson = {
                lessonId: dbCh.id,
                subject: dbCh.subject_id,
                chapter: dbCh.name,
                title: dbCh.name,
                outcomes: [
                    `Understand the core concepts of ${dbCh.name}`,
                    "Apply standard mathematical formulas to solve problems step-by-step",
                    "Practice selected textbook problems from NCERT, RD Sharma, and RS Aggarwal"
                ],
                concepts: dbCh.topics.map(t => ({
                    name: t.name,
                    real_life_application: t.description || `Everyday application of ${t.name} in daily routine.`,
                    purpose: "Understand the purpose and application of this mathematical concept.",
                    industry_relevance: `This concept powers engineering, medicine, AI and industry. Learn it to unlock career paths in science and technology.`,
                    engineering_domains: 'AI & Data Science, Finance & Quant Trading, Civil & Structural Engineering, Space Navigation & Cryptography',
                    future_careers: 'AI/ML Engineer, Actuary & Quantitative Analyst, Data Scientist, Aerospace Mathematician'
                })),
                theorems: [],
                exercises: {},
                rd_sharma_extensions: {
                    book: `RD Sharma Class 10, Chapter — ${dbCh.name}`,
                    topics: dbCh.topics.filter(t => t.name.toLowerCase().includes('rd sharma') || t.id.includes('-rd-')).map(t => ({
                        name: t.name.replace('RD Sharma: ', ''),
                        concept: t.description || 'Advanced concept and applications.',
                        formula: 'Refer to formulas in RAG Search.',
                        examples: t.problems ? t.problems.map(p => ({
                            problem: p.question_text,
                            solution: ["Step 1: Check step details in RAG Search"],
                            final_answer: p.question_latex || ''
                        })) : []
                    }))
                },
                rs_aggarwal_extensions: {
                    book: `RS Aggarwal Class 10, Chapter — ${dbCh.name}`,
                    topics: dbCh.topics.filter(t => t.name.toLowerCase().includes('rs aggarwal') || t.id.includes('-rs-')).map(t => ({
                        name: t.name.replace('RS Aggarwal: ', ''),
                        concept: t.description || 'Advanced concept and applications.',
                        formula: 'Refer to formulas in RAG Search.',
                        examples: t.problems ? t.problems.map(p => ({
                            problem: p.question_text,
                            solution: ["Step 1: Check step details in RAG Search"],
                            final_answer: p.question_latex || ''
                        })) : []
                    }))
                }
            };

          if (mockLesson.rd_sharma_extensions.topics.length === 0) {
            mockLesson.rd_sharma_extensions.topics = dbCh.topics.slice(0, 2).map(t => ({
              name: t.name,
              concept: t.description,
              formula: 'Refer to textbook formula sheet.',
              examples: []
            }));
          }
          if (mockLesson.rs_aggarwal_extensions.topics.length === 0) {
            mockLesson.rs_aggarwal_extensions.topics = dbCh.topics.slice(2, 4).map(t => ({
              name: t.name,
              concept: t.description,
              formula: 'Refer to textbook formula sheet.',
              examples: []
            }));
          }

          setLesson(mockLesson);
          setSelectedChapter(lessonId);
        }
      }
    } catch(err) {
      console.error("Database fallback failed", err);
    }
  }, [selectedBoard]);

  useEffect(() => {
    Promise.all([
      api('/api/syllabus/subjects'),
      api('/api/instructions'),
      api('/health'),
      api('/api/content/lessons'),
      api('/api/db/syllabus'), // Get all chapters across all boards to avoid empty states
    ]).then(([s, i, h, cl, dbs]) => {
      if (s.ok) setSubjects(s.subjects);
      if (i.ok) setInstructions(i.instructions || []);
      
      let mergedLessons = [];
      if (dbs.ok && dbs.syllabus) {
        dbs.syllabus.forEach(dbCh => {
          mergedLessons.push({
            lessonId: dbCh.id,
            title: dbCh.name,
            subject: dbCh.subject_id,
            board: dbCh.board_source
          });
        });
      }
      if (cl.ok) {
        cl.lessons.forEach(statCh => {
          if (!mergedLessons.some(l => l.lessonId === statCh.lessonId)) {
            mergedLessons.push({
              ...statCh,
              board: statCh.board || 'CBSE_NCERT'
            });
          }
        });
      }
      setAllLessons(mergedLessons);
      
      // Default to first CBSE_NCERT lesson to ensure content is loaded instantly
      const initial = mergedLessons.find(l => l.board === 'CBSE_NCERT') || mergedLessons[0];
      if (initial) {
        setSelectedBoard(initial.board);
        setSelectedSubject(initial.subject);
        setSelectedChapter(initial.lessonId);
        loadLesson(initial.lessonId, initial.board);
      }
      setStatus(h.ok ? 'online' : 'offline');
    }).catch(() => setStatus('offline'));
  }, []);

  // ── Dashboard data (profile / analytics / daily goal) ──
  const dashboardUserId = (() => {
    try { const t = localStorageGet('cx_token'); if (t) { const u = JSON.parse(atob(t.split('.')[0])); if (u && u.userId) return u.userId; } } catch(e) {}
    return 'student01';
  })();
  const refreshDashboard = useCallback((userId) => {
    Promise.all([
      fetch('/api/profile/'+userId).then(r => r.json()).catch(() => null),
      fetch('/api/analytics/'+userId).then(r => r.json()).catch(() => null),
      fetch('/api/gamify/'+userId+'/goal?target=5').then(r => r.json()).catch(() => null)
    ]).then(([prof, ana, goal]) => {
      if (prof && prof.ok) setDashProfile(prof.data);
      if (ana && ana.ok) setDashAnalytics(ana.data);
      if (goal && goal.ok) setDashGoal(goal.data);
    });
  }, []);
  useEffect(() => {
    refreshDashboard(dashboardUserId);
    window.addEventListener('cx-auth', () => refreshDashboard(dashboardUserId));
    return () => window.removeEventListener('cx-auth', () => refreshDashboard(dashboardUserId));
  }, [dashboardUserId, refreshDashboard]);

  const handleBoardChange = useCallback((boardId) => {
    setSelectedBoard(boardId);
    const lessonsInBoard = allLessons.filter(l => l.board === boardId);
    if (lessonsInBoard.length) {
      const first = lessonsInBoard[0];
      setSelectedChapter(first.lessonId);
      loadLesson(first.lessonId, boardId);
    }
  }, [allLessons, loadLesson]);

  const handleSubjectChange = useCallback((subjectId) => {
    setSelectedSubject(subjectId);
    const lessonsInSubject = allLessons.filter(l => l.subject === subjectId && l.board === selectedBoard);
    if (lessonsInSubject.length) {
      const first = lessonsInSubject[0];
      setSelectedChapter(first.lessonId);
      loadLesson(first.lessonId, selectedBoard);
    }
  }, [allLessons, selectedBoard, loadLesson]);

  const handleSubjectPick = useCallback((subject) => {
    if (!subject) return;
    setSelectedSubject(subject.id);
    const lessonsInSubject = allLessons.filter(l => l.subject === subject.id && l.board === selectedBoard);
    const first = lessonsInSubject[0] || allLessons[0];
    setActiveNav('overview');
    if (first) {
      setSelectedChapter(first.lessonId);
      loadLesson(first.lessonId, first.board || selectedBoard);
    }
  }, [allLessons, selectedBoard, loadLesson]);

  const view = (() => {
    switch (activeNav) {
      case 'dashboard':   return h(Dashboard, { subjects, analytics:dashAnalytics, profile:dashProfile, goal:dashGoal, onPickSubject:handleSubjectPick });
      case 'overview':    return lesson ? h(Overview, {lesson,subjects,instructions}) : h(Loading);
      case 'concepts':    return lesson ? h(Concepts, {lesson}) : h(Loading);
      case 'theorems':    return lesson ? h(Theorems, {lesson}) : h(Loading);
      case 'examples':    return lesson ? h(Examples, {lesson}) : h(Loading);
      case 'exercises':   return lesson ? h(Exercises, {lesson}) : h(Loading);
      case 'rag-search':  return h(RagSearch);
      case 'rd-sharma':   return lesson ? h(ExtensionView, {title:'📖 RD Sharma Extensions', data:lesson.rd_sharma_extensions}) : h(Loading);
      case 'rs-aggarwal': return lesson ? h(ExtensionView, {title:'📖 RS Aggarwal Extensions', data:lesson.rs_aggarwal_extensions}) : h(Loading);
      case 'model-papers': return lesson ? h(ModelPapers, {lesson}) : h(Loading);
      case 'quizzes':     return lesson ? h(Quizzes, {lesson}) : h(Loading);
      case 'vedic-math':  return lesson ? h(VedicMath, {lesson}) : h(Loading);
      case 'mind-maps':   return lesson ? h(MindMaps, {lesson}) : h(Loading);
      case 'interactive': return lesson ? h(Interactive, {lesson}) : h(Loading);
       case 'media':         return lesson ? h(Media, {lesson}) : h(Loading);
      case 'ai-tutor':    return h(AI_Tutor);
      case 'account':     return h(AuthScreen, { onAuthed: () => { const uid = (() => { try { const t = localStorageGet('cx_token'); if (t) { const u = JSON.parse(atob(t.split('.')[0])); return u.userId; } } catch(e) {} return 'student01'; })(); refreshDashboard(uid); setActiveNav('dashboard'); } });
      case 'leaderboard': return h(LeaderboardScreen);
      default:            return h(Dashboard, { subjects, analytics:dashAnalytics, profile:dashProfile, goal:dashGoal, onPickSubject:handleSubjectPick });
    }
  })();

  return div(null,
    /* ── SIDEBAR OVERLAY (mobile) ── */
    div({className:'sidebar-overlay'+(sidebarOpen?' open':''), onClick:()=>setSidebarOpen(false)}),

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
        label({style:{fontSize:12,color:'var(--textMuted)',marginRight:4}}, 'Board:'),
        select_({
          className:'chapter-select',
          value:selectedBoard,
          onChange:e => handleBoardChange(e.target.value)
        },
          option({value:'CBSE_NCERT'}, 'CBSE / NCERT'),
          option({value:'AP_BOARD'}, 'AP State Board'),
          option({value:'TS_BOARD'}, 'Telangana Board')
        ),
        label({style:{fontSize:12,color:'var(--textMuted)',margin:'0 4px 0 12px'}}, 'Subject:'),
        select_({
          className:'chapter-select',
          value:selectedSubject,
          onChange:e => handleSubjectChange(e.target.value)
        },
          subjects.map(s => option({key:s.id,value:s.id}, s.name))
        ),
        label({style:{fontSize:12,color:'var(--textMuted)',margin:'0 4px 0 12px'}}, 'Chapter:'),
        select_({
          className:'chapter-select',
          value:selectedChapter,
          onChange:e => loadLesson(e.target.value)
        },
          filteredLessons.map(l => option({key:l.lessonId,value:l.lessonId}, l.title || l.lessonId))
        ),
        div({className:'header-status '+status},
          div({className:'status-dot'}),
          status==='online'?'API Online':'API Offline'
        ),
        div({className:'role-switch'},
          ['student','teacher','parent'].map(r => btn({
            key:r, className:'role-btn'+(role===r?' active':''),
            onClick:()=>{setRole(r); setSidebarOpen(false);}
          }, r.charAt(0).toUpperCase()+r.slice(1)))
        ),
        btn({
          className:'header-user',
          onClick:()=>{ setActiveNav('account'); setSidebarOpen(false); }
        },
          div({className:'avatar'}, 'CX'),
          'My Account'
        )
      )
    ),

    /* ── LAYOUT ── */
    div({className:'layout'},
      /* Sidebar */
      div({className:'sidebar'+(sidebarOpen?' open':'')},
        btn({
          className:'nav-btn dash-nav'+(activeNav==='dashboard'?' active':''),
          onClick:()=>{setActiveNav('dashboard');setSidebarOpen(false);}
        }, span({className:'nav-icon'}, '🏠'), 'Dashboard'),
        (ROLES_GROUPS[role]||ROLES_GROUPS.student).map(group => div({key:group.label},
          div({className:'sidebar-label'}, group.label),
          group.items.map(item => {
            const nav = NAV_ITEMS.find(n => n.id === item);
            if (!nav) return null;
            return btn({
              key:nav.id, className:'nav-btn'+(activeNav===nav.id?' active':''),
              onClick:()=>{setActiveNav(nav.id);setSidebarOpen(false);}
            }, span({className:'nav-icon'}, nav.icon), nav.label);
          })
        )),
        div({className:'role-hint', style:{fontSize:11,color:'var(--textMuted)',marginTop:12,padding:'8px 10px',background:'var(--accentLight)',borderRadius:8,lineHeight:1.5}},
          '👁 ' + (ROLES_META[role] || ROLES_META.student)
        ),
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
    ),

    /* Mobile sidebar toggle */
    btn({className:'sidebar-toggle', onClick:()=>setSidebarOpen(o=>!o)}, '☰'),

  );
}

/**
 * Media Overview Component
 * Displays overview videos, flashcards, mind maps, and concept videos for a lesson
 * @param {Object} props - The component properties
 * @param {Object} props.lesson - The lesson data
 * @returns {JSX.Element} The media overview component
 */
function Media({ lesson }) {
  const [overviewVideo, setOverviewVideo] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [videosData, setVideosData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch videos.json for overview video lookup
    fetch('/content/videos.json')
      .then(res => res.json())
      .then(data => {
        setVideosData(data);
        // Find overview video for this chapter
        const subject = lesson.subject.toLowerCase();
        const chapter = lesson.chapter;
        if (videosData?.videos?.[subject]) {
          const subjectVideos = videosData.videos[subject];
          // Try exact match first
          let videoId = subjectVideos[chapter];
          // If not found, try to find any video that contains the chapter name (case insensitive)
          if (!videoId) {
            const chapterLower = chapter.toLowerCase();
            for (const [key, value] of Object.entries(subjectVideos)) {
              if (key.toLowerCase().includes(chapterLower)) {
                videoId = value;
                break;
              }
            }
          }
          if (videoId) {
            setOverviewVideo(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1&controls=0&rel=0&modestbranding=1`);
          }
        }
      })
      .catch(err => console.warn('Could not load videos.json:', err));

    // Fetch flashcards
    fetch(`/api/content/flashcards/${lesson.lessonId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.data) {
          setFlashcards(data.data.flashcards);
        }
      })
      .catch(err => console.warn('Could not load flashcards:', err))
      .finally(() => setLoading(false));
  }, [lesson]);

  if (loading) {
    return div({className:'card'}, div({className:'card-header'}, h2(null, '🎥 Media Overview')), div({style:{textAlign:'center',padding:'40px'}}, h3(null, 'Loading...')));
  }

  return div(null,
    div({className:'card'},
      div({className:'card-header'},
        h2(null, '🎥 Media Overview'),
        p(null, 'Audio/Video overviews, flashcards, mind maps, and concept visualizations for quick review')
      ),
      div({className:'media-grid'},
        // Overview Video Section
        div({className:'media-card'},
          h3(null, '🎬 Chapter Overview'),
          overviewVideo
            ? div({style:{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:10}},
                h('iframe', {
                  src: overviewVideo,
                  title: 'Chapter Overview',
                  style: {position:'absolute',top:0,left:0,width:'100%',height:'100%',border:0},
                  allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                  allowFullScreen: true
                })
              )
            : div({style:{textAlign:'center',padding:'40px',color:'var(--textMuted)'}},
                p(null, 'No overview video available for this chapter'),
                p(null, 'Check back later or explore concept videos below')
              )
        ),

        // Flashcards Section
        div({className:'media-card'},
          h3(null, '🃏 Flashcards for Quick Review'),
          flashcards.length > 0
            ? div({className:'flashcards-container'},
                flashcards.map((card, index) =>
                  div({key:index, className:'flashcard'},
                    div({className:'flashcard-front', onClick:(e)=>e.currentTarget.classList.toggle('flipped')},
                      h4(null, card.front)
                    ),
                    div({className:'flashcard-back', onClick:(e)=>e.currentTarget.classList.toggle('flipped')},
                      p(null, card.back || 'No description available')
                    )
                  )
                )
              )
            : div({style:{textAlign:'center',padding:'40px',color:'var(--textMuted)'}},
                p(null, 'No flashcards available for this chapter')
              )
        ),

        // Mind Maps Section
        lesson && lesson.mind_maps
          ? h(MindMaps, {lesson})
          : div({className:'media-card'},
              h3(null, '🧠 Mind Maps'),
              p(null, 'No mind map available for this chapter')
            ),

        // Concept Videos Section
        div({className:'media-card'},
          h3(null, '🎥 Concept Videos'),
          (lesson && lesson.concepts && lesson.concepts.some(c => c.video_embed))
            ? div({className:'videos-grid'},
                lesson.concepts.map((concept, index) =>
                  concept.video_embed
                    ? div({key:index, className:'video-item'},
                        h4(null, concept.name),
                        div({style:{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:8}},
                          h('iframe', {
                            src: concept.video_embed,
                            title: concept.name,
                            style: {position:'absolute',top:0,left:0,width:'100%',height:'100%',border:0},
                            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                            allowFullScreen: true
                          })
                        )
                      )
                    : null
                ).filter(Boolean)
              )
            : div({style:{textAlign:'center',padding:'40px',color:'var(--textMuted)'}},
                p(null, 'No concept videos available for this chapter')
              )
        )
      )
    )
  );
}

/* ───────── AI TUTOR ───────── */
function AI_Tutor() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const suggestions = [
    'Explain the quadratic formula with a real-life example',
    'How do I find the HCF of two numbers using Euclid division lemma?',
    'What is the difference between rational and irrational numbers?',
    'Show me a JEE shortcut for solving linear equations in two variables'
  ];
  const ask = async (q) => {
    const useQ = (q !== undefined) ? q : question;
    if (!useQ || !useQ.trim() || loading) return;
    setLoading(true); setAnswer(''); setMeta(null);
    try {
      const res = await fetch('/api/ai/tutor', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ question: useQ, stream: false })
      });
      const json = await res.json();
      if (json.ok) {
        setAnswer(json.answer && json.answer.text ? json.answer.text : '');
        setMeta({ tier: json.tier, source: json.source });
      } else {
        setAnswer('Error: '+(json.error || 'tutor unavailable'));
      }
    } catch(e) { setAnswer('Network error: '+e.message); }
    setLoading(false);
  };
  return div({className:'card'},
    div({className:'card-header'},
      h2(null, '🤖 AI Tutor'),
      p(null, 'Ask any concept — get an explanation tuned to Class X NCERT + IIT-JEE/NEET bridge'),
    ),
    div({style:{display:'flex',flexDirection:'column',gap:8}},
      suggestions.map((s, i) => btn({
        key:i, className:'btn btn-secondary', style:{justifyContent:'flex-start'},
        onClick:()=>{ setQuestion(s); ask(s); }
      }, '❓ '+s))
    ),
    textarea({
      className:'viz-editor', placeholder:'Type your question here...', value:question,
      style:{minHeight:90, marginTop:14},
      onChange:e=>setQuestion(e.target.value)
    }),
    div({style:{marginTop:10}},
      btn({className:'btn btn-primary', onClick:()=>ask(), disabled:loading || !question.trim()},
        loading ? 'Thinking...' : '🤖 Ask the AI Tutor')
    ),
    meta ? div({style:{marginTop:10,display:'flex',gap:6}},
        span({className:'tag cyan'}, 'Tier: '+meta.tier),
        span({className:'tag green'}, 'Source: '+meta.source)
      ) : null,
    answer ? div({style:{marginTop:16}},
      h3({style:{fontSize:14,color:C.violet,marginBottom:8}}, '💬 Answer'),
      pre({className:'answer-box', dangerouslySetInnerHTML:{__html:answer}})
    ) : null
  );
}

/* ───────── ENGAGEMENT: AUTH ───────── */
function localStorageGet(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } }
function localStorageSet(k,v){ try { window.localStorage.setItem(k,v); } catch(e){} }

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState(localStorageGet('cx_token') ? 'logged' : 'login');
  const token = localStorageGet('cx_token');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const decodeUser = (t) => { try { const b = t.split('.')[0]; return JSON.parse(atob(b)); } catch(e){ return {}; } };
  const loadProfile = async () => {
    const t = localStorageGet('cx_token');
    if (!t) return;
    const u = decodeUser(t);
    try {
      const r = await fetch('/api/profile/'+u.userId, { headers:{ Authorization:'Bearer '+t } });
      const j = await r.json();
      if (j.ok) setProfile(j.data);
    } catch(e){}
  };
  useEffect(()=>{ if (mode==='logged') loadProfile(); }, [mode]);

  const submit = async () => {
    setMsg('');
    const ep = mode==='login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode==='login' ? { email, password } : { name, email, password, role:'student' };
    try {
      const r = await fetch(ep, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.ok) {
        localStorageSet('cx_token', j.token);
        setMode('logged'); setMsg('Welcome, '+(j.data.name||'')+'!');
        onAuthed(j.data, j.token);
      } else setMsg(j.error || 'Request failed');
    } catch(e){ setMsg('Network error: '+e.message); }
  };
  const logout = () => { localStorageSet('cx_token',''); localStorageSet('cx_user',''); setMode('login'); setProfile(null); onAuthed(null, null); };

  if (mode==='logged') {
    const u = decodeUser(token);
    return div({className:'card'},
      div({className:'card-header'}, h2(null,'👤 My Account'), p(null,'Your learning profile & progression')),
      profile ? div({style:{display:'flex',flexDirection:'column',gap:14}},
        div({style:{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}},
          div({style:{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--sage))',display:'grid',placeItems:'center',fontSize:22,fontWeight:800,color:'#fff'}},
            (profile.user?.name||'U').charAt(0).toUpperCase()),
          div(null,
            h3({style:{fontSize:18,fontWeight:700,color:'var(--text)'}}, profile.user?.name||u.name||'Student'),
            p({style:{fontSize:12,color:'var(--textMuted)'}}, (profile.rank||'')+' • '+(profile.user?.email||''))
          )
        ),
        div({className:'stats-grid',style:{marginTop:8,gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))'}},
          div({className:'stat-card cyan'}, div({className:'stat-value'}, profile.progress?.totalXp??0), div({className:'stat-label'},'Total XP')),
          div({className:'stat-card green'}, div({className:'stat-value'}, profile.progress?.currentStreak??0), div({className:'stat-label'},'Day Streak')),
          div({className:'stat-card violet'}, div({className:'stat-value'}, profile.progress?.solvedCount??0), div({className:'stat-label'},'Solved')),
          div({className:'stat-card amber'}, div({className:'stat-value'}, profile.progress?.longestStreak??0), div({className:'stat-label'},'Best Streak'))
        ),
        profile.badges?.length ? div({style:{marginTop:6}},
          h4({style:{fontSize:12,color:C.amber,marginBottom:6}},'🏅 Badges'),
          div({style:{display:'flex',flexWrap:'wrap',gap:6}}, profile.badges.map((b,i)=>span({key:i,className:'tag amber'}, b)))
        ) : null,
        profile.share ? div({style:{marginTop:10,padding:'10px 12px',background:'var(--accentLight)',borderRadius:8,fontSize:12,color:'var(--textDim)'}},
          '🔗 '+profile.share
        ) : null,
        div({style:{marginTop:12,display:'flex',gap:10}},
          btn({className:'btn btn-secondary',onClick:logout},'🚪 Logout')
        )
      ) : div({style:{color:'var(--textMuted)'}}, 'Loading profile...'),
      div({style:{marginTop:12,padding:'10px',background:'var(--bg1)',borderRadius:8,fontSize:11,color:'var(--textMuted)'}},
        'Progression is stored locally on this device via your login token.'
      )
    );
  }
  const fieldstyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--panelBorder)', background:'var(--bg2)', color:'var(--text)', fontSize:14, marginBottom:10 };
  return div({className:'card',style:{maxWidth:480,margin:'0 auto'}},
    div({className:'card-header'}, h2(null, mode==='login'?'🔐 Login':'📝 Create Account'), p(null, mode==='login'?'Sign in to sync your progress across screens':'Join ClassX Companion to start earning XP')),
    div({style:{display:'flex',gap:6,marginBottom:14}},
      btn({className:'btn '+(mode==='login'?'btn-primary':'btn-secondary'),onClick:()=>{setMode('login');setMsg('');}}, 'Login'),
      btn({className:'btn '+(mode==='register'?'btn-primary':'btn-secondary'),onClick:()=>{setMode('register');setMsg('');}}, 'Register')
    ),
    mode==='register' ? div(null, label({style:{fontSize:12,color:'var(--textMuted)'}},'Full Name'), h('input',{style:fieldstyle,type:'text',value:name,placeholder:'e.g. Ananya Sharma',onChange:e=>setName(e.target.value)})) : null,
    label({style:{fontSize:12,color:'var(--textMuted)'}},'Email'),
    h('input',{style:fieldstyle,type:'email',value:email,placeholder:'you@classx.com',onChange:e=>setEmail(e.target.value)}),
    label({style:{fontSize:12,color:'var(--textMuted)'}},'Password'),
    h('input',{style:fieldstyle,type:'password',value:password,placeholder:'min 6 characters',onChange:e=>setPassword(e.target.value)}),
    msg ? p({style:{fontSize:12,color:mode==='logged'?C.green:C.red,marginBottom:8}}, msg) : null,
    btn({className:'btn btn-primary',style:{width:'100%',justifyContent:'center'},onClick:submit,disabled:!email||!password||(mode==='register'&&!name)},
      mode==='login' ? 'Sign In' : 'Create Account')
  );
}

/* ───────── ENGAGEMENT: LEADERBOARD ───────── */
function LeaderboardScreen() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(()=>{
    fetch('/api/leaderboard').then(r=>r.json()).then(j=>{
      if (j.ok) setRows(j.data);
      else setError(j.error||'Could not load leaderboard');
    }).catch(()=>setError('Leaderboard unavailable'));
  },[]);
  return div({className:'card'},
    div({className:'card-header'}, h2(null,'🏆 Leaderboard'), p(null,'Top learners by total XP across ClassX Companion')),
    error ? p({style:{color:C.red,fontSize:13}}, error) : null,
    rows.length ? rows.map((r,i)=>
      div({key:r.userId||i,className:'leaderboard-row',style:{display:'flex',alignItems:'center',gap:12,padding:'10px 8px',borderBottom:'1px solid var(--panelBorder)'}},
        div({style:{width:32,height:32,borderRadius:'50%',display:'grid',placeItems:'center',fontWeight:800,fontSize:13,color:'#fff',background:i<3?'linear-gradient(135deg,#f59e0b,#f43f5e)':'var(--accent)'}}, r.position||(i+1)),
        div({style:{flex:1,fontSize:13,color:'var(--textDim)'}}, r.name || ('Learner #'+String(r.userId||i).slice(0,4))),
        span({style:{fontSize:12,color:'var(--textMuted)'}}, r.solvedCount+' solved'),
        div({style:{display:'flex',gap:3,alignItems:'center'}},
          span({className:'tag cyan'}, r.totalXp+' XP'),
          span({className:'tag green'}, '🔥 '+r.longestStreak)
        )
      )
    ) : p({style:{color:'var(--textMuted)',textAlign:'center',padding:20}}, 'No leaderboard data yet — practice some problems to appear here!')
  );
}

/* ───────── MOUNT ───────── */
const rootEl = document.getElementById('root');
if (rootEl && window.ReactDOM && typeof window.ReactDOM.createRoot === 'function') {
  const root = window.ReactDOM.createRoot(rootEl);
  root.render(h(App));
} else if (rootEl) {
  // Pre-React-18 fallback (legacy render)
  rootEl.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-family:Inter,system-ui">React 18 root API not found. Check vendor-react-dom.production.min.js.</div>';
}
