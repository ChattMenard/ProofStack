#!/usr/bin/env python3
"""
Simple TASKS.md summary: counts open vs completed checklist items.
Usage: python tools/check_tasks.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TASKS = ROOT / 'TASKS.md'

if not TASKS.exists():
    print('TASKS.md not found in project root')
    raise SystemExit(1)

text = TASKS.read_text(encoding='utf-8')

# match markdown task list items '- [ ]' or '- [x]'
open_items = re.findall(r"^\s*[-*]\s+\[\s\]\s+.+$", text, flags=re.M)
done_items = re.findall(r"^\s*[-*]\s+\[[xX]\]\s+.+$", text, flags=re.M)

print('TASKS.md summary')
print('-----------------')
print(f'Total tasks: {len(open_items) + len(done_items)}')
print(f'Open: {len(open_items)}')
print(f'Done: {len(done_items)}')
print('Top open tasks (first 10):')
for i, t in enumerate(open_items[:10], start=1):
    print(f'{i}. {t.strip()}')
