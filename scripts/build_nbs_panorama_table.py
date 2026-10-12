#!/usr/bin/env python3
"""Build SVG display filters and CSS for a continuous exhibition table.

Reads the approved scene images solely to sample cloth colours and identify
isolated blue objects to protect. Never exports or modifies a raster image.
Output is scoped to panorama thumbnails; full-detail images are unaffected.
Requires Pillow, numpy and the existing local OpenCV dependency.
"""
from pathlib import Path
from PIL import Image
import json, statistics, urllib.parse, sys
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/".local/nbs-exhibition/python-deps"))
import cv2
root=Path(__file__).resolve().parents[1];s=(root/'js/nbs-exhibition-data.js').read_text();data=json.loads(s[s.index('{'):].rstrip().rstrip(';'))
out=root/'images/nbs-2026/table-v18';out.mkdir(exist_ok=True)
filters=[];css=[]
# A common tabletop and front. Coordinates are relative to the panorama scene.
stops=[(.74,(62,86,141)),(.86,(58,80,132)),(.91,(53,73,123)),(.914,(39,54,94)),(1.,(31,44,79))]
def target(y):
 for (a,ca),(b,cb) in zip(stops,stops[1:]):
  if y<=b:
   t=max(0,min(1,(y-a)/(b-a)));return tuple(x+(z-x)*t for x,z in zip(ca,cb))
 return stops[-1][1]
def svguri(rows, smoothen=True):
 smooth=[tuple(sum(rows[j][c] for j in range(max(0,i-4),min(len(rows),i+5)))/len(range(max(0,i-4),min(len(rows),i+5))) for c in range(3)) for i in range(len(rows))]
 if not smoothen: smooth=rows
 stops=''.join(f'<stop offset="{i/(len(rows)-1):.5f}" stop-color="rgb({r:.3f},{g:.3f},{b:.3f})"/>' for i,(r,g,b) in enumerate(smooth))
 return 'data:image/svg+xml,'+urllib.parse.quote(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1">{stops}</linearGradient></defs><rect width="1" height="1" fill="url(#c)"/></svg>',safe='')
for item in data['exhibits']:
 p=item['photos'][0];layout=p['sceneLayout'];im=Image.open(root/p['src']).convert('RGB');w,h=im.size;px=im.load();baseline=[];desired=[]
 for i in range(256):
  y=round(i/255*(h-1));coords=[px[x,yy] for x in list(range(0,24))+list(range(w-24,w)) for yy in range(max(0,y-3),min(h,y+4))]
  baseline.append(tuple(statistics.median(c[cidx] for c in coords)/2 for cidx in range(3)))
  desired.append(tuple(c/2 for c in target(layout['top']+layout['scale']*i/255)))
 sid=p['sourceId'].lower();horizon=layout['horizon']
 rgb=np.asarray(im).astype('float32')/255
 gate=np.clip(-8*rgb[:,:,0]-2*rgb[:,:,1]+10*rgb[:,:,2]-.35,0,1)
 gate[:int(horizon*h)]=0
 count,labels,stats,_=cv2.connectedComponentsWithStats((gate>.06).astype('uint8'),8)
 floor=set(labels[-1,:])|set(labels[:,0])|set(labels[:,-1]);protect=[]
 for label in range(1,count):
  if label in floor: continue
  x,y,ww,hh,area=stats[label]
  if area<5: continue
  protect.append(f'<rect x="{max(0,x-2)}" y="{max(0,y-2)}" width="{ww+4}" height="{hh+4}" fill="black"/>')
 protection='data:image/svg+xml,'+urllib.parse.quote(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none"><rect width="{w}" height="{h}" fill="white"/>'+''.join(protect)+'</svg>',safe='')

 # Only chromatically blue cloth below the original horizon is adjusted.
 # The arithmetic preserves texture, shadows and object geometry.
 filters.append(f'''<filter id="{sid}" x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
 <feImage href="{svguri(baseline)}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="baseline"/>
 <feComposite in="SourceGraphic" in2="baseline" operator="arithmetic" k2="1" k3="-2" k4="0.5" result="detail"/>

 <feImage href="{svguri(desired, False)}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="table"/>
 <feComposite in="detail" in2="table" operator="arithmetic" k2="1" k3="2" k4="-0.5" result="adjusted"/>
 <feColorMatrix in="table" type="matrix" values="2 0 0 0 0  0 2 0 0 0  0 0 2 0 0  0 0 0 0 1" result="flatTable"/>
 <feComposite in="adjusted" in2="flatTable" operator="arithmetic" k2="0.65" k3="0.35" result="clothTone"/>
 <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 -2 10 0 -0.35" x="0" y="{horizon}" width="1" height="{1-horizon}" result="cloth"/>
 <feImage href="{protection}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="protection"/>
 <feColorMatrix in="protection" type="luminanceToAlpha" result="protection"/>
 <feComposite in="cloth" in2="protection" operator="in" result="cloth"/>
 <feComposite in="clothTone" in2="cloth" operator="in" result="adjustedCloth"/>
 <feComposite in="SourceGraphic" in2="cloth" operator="out" result="foreground"/>
 <feComposite in="foreground" in2="adjustedCloth" operator="arithmetic" k2="1" k3="1"/>
</filter>''')
 css.append(f'.ex-panel-image[src*="-{sid}-panorama.webp"] {{ filter: url("../images/nbs-2026/table-v18/filters.svg#{sid}"); }}')
 css.append(f'.ex-panel:has([src*="-{sid}-panorama.webp"]) {{ --scene-margin: {(1-layout["scale"])*50:.5f}%; --scene-gap: calc(var(--ex-panel-width) * {(1-layout["scale"])/2:.6f}); }}')

(out/'filters.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><defs>'+''.join(filters)+'</defs></svg>')
(root/'css/nbs-panorama-table.css').write_text('/* Panorama-only colour treatment: all original and detail assets stay intact. */\n'+'\n'.join(css)+'''
.ex-panel-frame::before { content: ''; position: absolute; inset: 74% 0 0; background: linear-gradient(to bottom, rgb(62,86,141), rgb(58,80,132) 46.15%, rgb(53,73,123) 65.38%, rgb(39,54,94) 66.92%, rgb(31,44,79)); }
.ex-panel-frame .ex-panel-image { z-index: 1; }
/* Collapse only the empty framing, never the approved photograph itself. */
.ex-panel, .ex-panel + .ex-panel { margin-left: calc(-1 * var(--scene-gap, 0px)); margin-right: calc(-1 * var(--scene-gap, 0px)); }
.ex-panel:first-child { margin-left: 0; }
.ex-panel:last-child { margin-right: 0; }
.ex-panel .ex-panel-frame, .ex-panel:not(:first-child) .ex-panel-frame:has(.is-reconstructed) { mask-image: none; clip-path: inset(0 var(--scene-margin, 0%) 0 var(--scene-margin, 0%)); }
.ex-panel:first-child .ex-panel-frame { clip-path: inset(0 var(--scene-margin, 0%) 0 0); }
.ex-panel:last-child .ex-panel-frame { clip-path: inset(0 0 0 var(--scene-margin, 0%)); }
.ex-panel:only-child .ex-panel-frame { clip-path: none; }
.ex-panel + .ex-panel { margin-left: calc(-1 * var(--scene-gap, 0px) - var(--ex-panel-width) * .015); }
.ex-panel:not(:first-child) .ex-panel-frame:has(.is-reconstructed) { mask-image: linear-gradient(to right, transparent var(--scene-margin), #000 calc(var(--scene-margin) + 1.5%)); }
.ex-panel-button { clip-path: inset(0 var(--scene-margin, 0%) 0 var(--scene-margin, 0%)); }
.ex-panel:first-child .ex-panel-button { clip-path: inset(0 var(--scene-margin, 0%) 0 0); }
.ex-panel:last-child .ex-panel-button { clip-path: inset(0 0 0 var(--scene-margin, 0%)); }
.ex-panel:only-child .ex-panel-button { clip-path: none; }
/* No blur on the shared table edge: it is one continuous horizontal line. */
.ex-scene::after { background: linear-gradient(to bottom, #17191b18, transparent 10%); }
''')
print('Built 66 vector colour filters; photo files untouched')
