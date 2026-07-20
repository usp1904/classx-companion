import json
from pathlib import Path

g = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))

sandbox_prefixes = ['live_class', 'my_first_project', 'project_zero', 'langchain_starts']
sandbox_ids = {n['id'] for n in g['nodes'] if any(p in n.get('id','') for p in sandbox_prefixes)}
print(f"Sandbox nodes in graph: {len(sandbox_ids)}")

main_ids = {n['id'] for n in g['nodes']} - sandbox_ids
print(f"Main system nodes: {len(main_ids)}")

# Links between sandbox and main
cross = []
for link in g.get('links', []):
    s, t = link.get('source',''), link.get('target','')
    # Handle both string and object source/target in networkx format
    s_id = s if isinstance(s, str) else s.get('id','') if isinstance(s, dict) else str(s)
    t_id = t if isinstance(t, str) else t.get('id','') if isinstance(t, dict) else str(t)
    if (s_id in sandbox_ids) != (t_id in sandbox_ids):
        cross.append((s_id, t_id, link.get('relation',''), link.get('confidence','')))
        print(f"  {s_id} --{link.get('relation','')}--> {t_id} [{link.get('confidence','')}]")

print(f"\nTotal cross edges: {len(cross)}")

if not cross:
    print("\n=== No structural links between sandboxes and main system ===")
    print("The Live-Class sandboxes are ISOLATED subgraphs with zero connections to production code.")
    print("\nReasons: they're teaching materials (class exercises), not imported by the production system.")
    print("Bridge exists only semantically through ARCHITECTURE.md and README docs.")
else:
    print(f"\n=== Found {len(cross)} structural bridges ===")
    for s, t, rel, conf in cross[:20]:
        print(f"  {s} --{rel}--> {t} [{conf}]")
