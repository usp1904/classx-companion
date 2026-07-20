import json
from pathlib import Path
from datetime import datetime, timezone
from graphify.detect import save_manifest

detect_path = Path('graphify-out/.graphify_detect.json')
extract_path = Path('graphify-out/.graphify_extract.json')
ast_path = Path('graphify-out/.graphify_ast.json')

if detect_path.exists():
    detect = json.loads(detect_path.read_text(encoding='utf-8'))
    save_manifest(detect.get('all_files') or detect['files'], root='.')
    total_files = detect.get('total_files', 0)
else:
    print('Warning: detect.json already cleaned up')
    total_files = 0

input_tok = 0
output_tok = 0

if extract_path.exists():
    extract = json.loads(extract_path.read_text(encoding='utf-8'))
    input_tok = extract.get('input_tokens', 0)
    output_tok = extract.get('output_tokens', 0)
elif ast_path.exists():
    ast = json.loads(ast_path.read_text(encoding='utf-8'))
    input_tok = ast.get('input_tokens', 0)
    output_tok = ast.get('output_tokens', 0)

cost_path = Path('graphify-out/cost.json')
if cost_path.exists():
    cost = json.loads(cost_path.read_text(encoding='utf-8'))
else:
    cost = {'runs': [], 'total_input_tokens': 0, 'total_output_tokens': 0}

cost['runs'].append({
    'date': datetime.now(timezone.utc).isoformat(),
    'input_tokens': input_tok,
    'output_tokens': output_tok,
    'files': total_files,
})
cost['total_input_tokens'] += input_tok
cost['total_output_tokens'] += output_tok
cost_path.write_text(json.dumps(cost, indent=2, ensure_ascii=False), encoding='utf-8')

print(f"This run: {input_tok:,} input tokens, {output_tok:,} output tokens")
print(f"All time: {cost['total_input_tokens']:,} input, {cost['total_output_tokens']:,} output ({len(cost['runs'])} runs)")
