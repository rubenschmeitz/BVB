#!/usr/bin/env python3
"""Check local references in HTML without contacting external services."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public' if (ROOT / 'server.py').exists() else ROOT
errors=[]; checked=0
class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key,value in attrs:
            if value and key in ('src','href','poster'):
                link=urlsplit(value)
                if link.scheme or link.netloc or not link.path: continue
                if link.path.startswith('/api/'): continue
                path=PUBLIC / unquote(link.path).lstrip('/') if link.path.startswith('/') else self.source.parent / unquote(link.path)
                if not path.exists(): errors.append(f'{self.source.relative_to(PUBLIC)}: missing {value}')
for file in PUBLIC.rglob('*.html'):
    if any(p.startswith('.') or p == 'node_modules' for p in file.relative_to(PUBLIC).parts): continue
    parser=References(); parser.source=file; parser.feed(file.read_text(encoding='utf-8')); checked+=1
jsfiles=[]
for folder in ('js','assets'):
    if (PUBLIC/folder).exists():jsfiles.extend((PUBLIC/folder).rglob('*.js'))
for file in jsfiles:
    result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    if result.returncode:errors.append(result.stderr.strip())
print(json.dumps({'html_pages':checked,'javascript_files':len(jsfiles),'errors':errors},indent=2))
sys.exit(bool(errors))
