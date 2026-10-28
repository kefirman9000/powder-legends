#!/usr/bin/env python3
"""Build the single-file game: src/index.template.html + src/css + src/js  ->  index.html

  <!-- @include path -->  on its own line   = the file's contents, as-is
  <!-- @inline path -->   inside a line     = the file's contents with no added newline

Run:  python3 tools/build.py            (writes index.html)
      python3 tools/build.py --check    (exit 1 if index.html is out of date)
"""
import re,sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent;SRC=ROOT/'src'
def read(p):return (SRC/p).read_text(encoding='utf-8')
def build():
  t=read('index.template.html')
  t=re.sub(r'^<!-- @include (\S+) -->\n',lambda m:read(m.group(1)),t,flags=re.M)
  t=re.sub(r'<!-- @inline (\S+) -->',lambda m:read(m.group(1)),t)
  if '<!-- @include' in t or '<!-- @inline' in t:sys.exit('unresolved include')
  return t
out=build();dst=ROOT/'index.html'
if '--check' in sys.argv:
  ok=dst.exists() and dst.read_text(encoding='utf-8')==out
  print('index.html is up to date' if ok else 'index.html is OUT OF DATE: run python3 tools/build.py');sys.exit(0 if ok else 1)
dst.write_text(out,encoding='utf-8');print('built index.html (%d KB)'%(len(out.encode())//1024))
