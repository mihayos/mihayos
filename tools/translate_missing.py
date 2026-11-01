#!/usr/bin/env python3
"""Fills every missing translation automatically.
Usage (needs internet):
    pip install deep-translator
    python3 tools/translate_missing.py
It reads tools/en-strings.json, skips strings already translated in
js/translations-auto.js, translates the rest into all 9 languages and writes
js/translations-generated.js. Re-run any time; reload the site afterwards.
Machine output: have a native speaker review important pages."""
import json,re,time,os
from deep_translator import GoogleTranslator
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
en=json.load(open(os.path.join(ROOT,'tools/en-strings.json'),encoding='utf8'))
auto=open(os.path.join(ROOT,'js/translations-auto.js'),encoding='utf8').read()
A=json.loads(re.search(r'const A=(\{.*\});\n  if \(TRANSLATIONS\.pl_a',auto,re.S).group(1))
gen_path=os.path.join(ROOT,'js/translations-generated.js')
G={}
if os.path.exists(gen_path):
    m=re.search(r'const G=(\{.*\});',open(gen_path,encoding='utf8').read(),re.S)
    if m: G=json.loads(m.group(1))
CODES={'sw':'sw','es':'es','fr':'fr','zh':'zh-CN','it':'it','de':'de','ar':'ar','ko':'ko','pl':'pl'}
KEEP=re.compile(r'^[\W\d_]*$')
for l,code in CODES.items():
    G.setdefault(l,{}); tr=GoogleTranslator(source='en',target=code)
    todo=[k for k,v in en.items() if k not in A.get(l,{}) and k not in G[l]]
    print(l,len(todo),'to translate')
    for i,k in enumerate(todo):
        try: G[l][k]=tr.translate(en[k]) if not KEEP.match(en[k]) else en[k]
        except Exception as e: print('retry',k,e); time.sleep(3); continue
        if i%50==0:
            open(gen_path,'w',encoding='utf8').write('(function(){const G='+json.dumps(G,ensure_ascii=False)+';Object.keys(G).forEach(function(l){TRANSLATIONS[l]=Object.assign({},G[l],TRANSLATIONS[l]||{});});})();\n')
    open(gen_path,'w',encoding='utf8').write('(function(){const G='+json.dumps(G,ensure_ascii=False)+';Object.keys(G).forEach(function(l){TRANSLATIONS[l]=Object.assign({},G[l],TRANSLATIONS[l]||{});});})();\n')
print('done')
