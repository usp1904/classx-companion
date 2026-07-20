import json
from pathlib import Path

g = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))

sandbox_kw = ['my-first-project', 'project-zero', 'langchain-starts', 'sandbox', 'live_class']
matches = [n for n in g['nodes'] if any(k in n.get('id','') for k in sandbox_kw)]
print('SANDBOX_NODES:')
for n in matches[:15]:
    print(json.dumps({'id':n['id'],'label':n.get('label','')}))

for term in ['caveman','rtk','supermemory','super_memory']:
    found = [n for n in g['nodes'] if term in n.get('id','').lower() or term in n.get('label','').lower()]
    print(f"TERM:{term}:{len(found)}")
    for n in found[:5]:
        print(json.dumps({'id':n['id'],'label':n.get('label','')}))

# Cross edges between sandbox and rest
all_ids = {n['id'] for n in g['nodes']}
sandbox_ids = {n['id'] for n in matches}
cross_count = 0
for e in g['edges']:
    s,t = e['source'], e['target']
    if (s in sandbox_ids) != (t in sandbox_ids):
        cross_count += 1
        print(f"CROSS_EDGE:{s} -> {t}:{e.get('relation','')}:{e.get('confidence','')}")
print(f"Total cross edges: {cross_count}")
