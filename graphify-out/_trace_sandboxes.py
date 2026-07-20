import json
from pathlib import Path

g = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
extract = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))

# Find live_class nodes
live_ids = {n['id'] for n in g['nodes'] if 'live_class' in n.get('id','')}
print(f"Live-Class nodes in graph: {len(live_ids)}")

# Find edges in extraction that cross from live_class to non-live_class
cross_edges = []
for e in extract['edges']:
    s, t = e.get('source',''), e.get('target','')
    in_sandbox = 'live_class' in s or 'my_first_project' in s or 'project_zero' in s or 'langchain_starts' in s or 'class_1' in s or 'class_2v2' in s or 'class_6' in s or 'class_7' in s or 'class_4' in s
    in_target = 'live_class' in t or 'my_first_project' in t or 'project_zero' in t or 'langchain_starts' in t or 'class_1' in t or 'class_2v2' in t or 'class_6' in t or 'class_7' in t or 'class_4' in t
    if in_sandbox != in_target:
        cross_edges.append(e)

print(f"\nCross edges between sandbox and main system: {len(cross_edges)}")
for e in cross_edges[:30]:
    print(f"  {e['source']} --[{e.get('relation','')}:{e.get('confidence','')}]--> {e['target']}")

# Search ARCHITECTURE.md and README.md for Caveman/RTK/Supermemory
print("\n\n=== Searching ARCHITECTURE.md ===")
arch = Path('ARCHITECTURE.md').read_text(encoding='utf-8')
for term in ['caveman', 'rtk', 'supermemory', 'super_memory', 'Super']:
    idx = arch.lower().find(term)
    if idx >= 0:
        start = max(0, idx-100)
        end = min(len(arch), idx+100)
        snippet = arch[start:end].replace('\n', ' ')
        print(f"  Found '{term}' in ARCHITECTURE.md: ...{snippet}...")
