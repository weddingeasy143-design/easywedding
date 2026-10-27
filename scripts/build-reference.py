from pathlib import Path
import json, shutil, re, urllib.parse

root = Path(__file__).resolve().parents[1]
source = root / 'qa/exact-reference'
dest = root / 'public/reference'
dest.mkdir(exist_ok=True)
(dest/'assets').mkdir(exist_ok=True)
(dest/'chunks').mkdir(exist_ok=True)
manifest = json.loads((source/'asset-manifest.json').read_text())
mapping = {}
for url, asset in manifest.items():
    if asset['ok']:
        name = asset['file'].split('-')[0] + Path(asset['file']).suffix
        shutil.copy2(source/'assets'/asset['file'], dest/'assets'/name)
        mapping[url] = '/reference/assets/'+name
        if url.startswith('https://chandan-pinki-wedding.vercel.app/'):
            mapping[url.removeprefix('https://chandan-pinki-wedding.vercel.app')] = mapping[url]
for f in (source/'assets').glob('*.woff*'):
    shutil.copy2(f,dest/'assets'/f.name)
    mapping['/_next/static/media/'+f.name] = '/reference/assets/'+f.name
for name,path in [('royal-door-bg.webp','/ornaments/royal-door-bg.webp'),('ganesh-base.webp','/ornaments/ganesh/base.webp')]:
    f=source/'assets'/name
    if f.exists():
        shutil.copy2(f,dest/'assets'/name)
        mapping[path]='/reference/assets/'+name
for u,name,status in json.loads((source/'fonts.json').read_text()):
    if not status:mapping[u]='/reference/assets/'+name
current=source/'current-source'
if current.exists():
    for url,asset in json.loads((current/'asset-manifest.json').read_text()).items():
        if not asset['ok']:continue
        name='current-'+asset['file']
        shutil.copy2(current/'assets'/asset['file'],dest/'assets'/name)
        mapping[url]='/reference/assets/'+name
        if url.startswith('https://chandan-pinki-wedding.vercel.app/'):
            mapping[url.removeprefix('https://chandan-pinki-wedding.vercel.app')] = mapping[url]
    for f in current.glob('*.css'):
        for path in re.findall(r'url\(["\']?([^\)"\']+)\)',f.read_text()):
            url=urllib.parse.urljoin('https://chandan-pinki-wedding.vercel.app/_next/static/immutable/chunks/'+f.name,path)
            if url in mapping:mapping[path]=mapping[url]
def localize(s):
    for old,new in sorted(mapping.items(),key=lambda x:-len(x[0])):s=s.replace(old,new)
    return s
for f in (dest/'assets').glob('*.css'):f.write_text(localize(f.read_text()))
chunks=[]
for f in source.glob('*.js'):
    if f.name.startswith(('webpack-','polyfills-')):continue
    text=localize(f.read_text())
    # The source uses a generated image URL; the adapter uses direct local assets.
    if f.name.startswith('page-'):
        text=text.replace('e7.toDataURL(t,','window.__referenceQRCode(t,')
        text=text.replace('children:"Your blessing has been received with love."','children:"Your blessing is ready. Review and send it to the couple below."')
    (dest/'chunks'/f.name).write_text(text)
    chunks.append('/reference/chunks/'+f.name)
cfg=json.loads(((current if current.exists() else source)/'site-config.json').read_text())
wedding=json.loads(((current if current.exists() else source)/'wedding.json').read_text())
(dest/'source-data.json').write_text(localize(json.dumps({'site':cfg,'wedding':wedding},ensure_ascii=False)))
(dest/'asset-map.json').write_text(json.dumps(mapping))
(dest/'chunks.json').write_text(json.dumps(chunks))
css=[mapping[u] for u in manifest if '.css' in u and 'fonts.googleapis' not in u]
body='__variable_a10525 __variable_e9ff3d __variable_8b3a0b font-sans'
if current.exists():
    factories=json.loads((current/'module-map.json').read_text())
    selected={key:factories[key] for key in ['52683','38126','45060','37801','89542']}
    component='export const currentFactories={'+','.join(json.dumps(key)+':'+value for key,value in selected.items())+'};\n'
    # The original clears decorative hashes on mount. Our hash contains the
    # immutable invitation snapshot and must survive refresh and sharing.
    component=component.replace('window.location.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)','void 0')
    component=component.replace('children:"Your blessing has been received with love."','children:"Your blessing is ready. Review and send it to the couple below."')
    def adapt_motion(old,new):
        if component.count(old)!=1:
            raise ValueError('The reference motion target changed: '+old[:100])
        return component.replace(old,new)
    component=adapt_motion('(0,n.jsxs)("main",{className:"min-h-screen bg-ivory', '(0,n.jsxs)("main",{"data-invitation-phase":e,className:"min-h-screen bg-ivory')
    component=adapt_motion('initial:{x:0},animate:{x:t?"-104%":"104%"},transition:{duration:2.8,delay:.7,ease:[.65,0,.35,1]}',
        '"data-theme-door":e,initial:window.__referenceThemeMotion?.doorInitial||{x:0},animate:window.__referenceThemeMotion?.door(t)||{x:t?"-104%":"104%"},transition:{duration:window.__referenceThemeMotion?.duration||2.8,delay:.7,ease:[.65,0,.35,1]}')
    component=adapt_motion('initial:a?{opacity:0}:{opacity:0,y:i},whileInView:{opacity:1,y:0}',
        'initial:a?{opacity:0}:window.__referenceThemeMotion?.enter(i)||{opacity:0,y:i},whileInView:window.__referenceThemeMotion?.shown||{opacity:1,y:0}')
    component=adapt_motion('className:"relative z-10 w-full bg-[#fff7e8]/72', 'className:"theme-opening-card relative z-10 w-full bg-[#fff7e8]/72')
    component=adapt_motion('function ah({className:e=""}){let t=nF()??!1,i=',
        'function ah({className:e=""}){if(window.__referenceThemeMotion)return window.__referenceGaneshEnabled&&(0,n.jsxs)("div",{className:"theme-ganesh theme-ganesh-opening "+e,"aria-label":"Lord Ganesha",children:[(0,n.jsx)("span",{className:"theme-ganesh-halo","aria-hidden":!0}),(0,n.jsx)(S.Image,{src:"/assets/wedding/ganesh.png",alt:"Lord Ganesha",fill:!0,priority:!0,className:"theme-ganesh-image",sizes:"118px"})]});let t=nF()??!1,i=')
    # An actual transparent portrait precedes the invocation in every world.
    # Keep the captured source mode intact for the layout comparison.
    component=adapt_motion('(0,n.jsx)(aY,{children:(0,n.jsx)("p",{className:"text-center font-display text-base tracking-[0.2em] text-maroon/80 lg:text-lg",children:"॥ श्री गणेशाय नमः ॥"})})',
        '(0,n.jsxs)(aY,{children:[window.__referenceGaneshEnabled&&(0,n.jsxs)("div",{className:"theme-ganesh theme-ganesh-family",children:[(0,n.jsx)("span",{className:"theme-ganesh-halo","aria-hidden":!0}),(0,n.jsx)(S.Image,{src:"/assets/wedding/ganesh.png",alt:"Lord Ganesha",width:112,height:112,priority:!0,className:"theme-ganesh-image"})]}),(0,n.jsx)("p",{className:"text-center font-display text-base tracking-[0.2em] text-maroon/80 lg:text-lg",children:window.__referenceCopy.text21})]})')
    component=adapt_motion('className:"relative mx-auto mt-14 h-36 w-28 sm:mt-16 sm:h-44 sm:w-36"',
        'className:(window.__referenceThemeMotion?"theme-ganesh theme-ganesh-card ":"")+"relative mx-auto mt-14 h-36 w-28 sm:mt-16 sm:h-44 sm:w-36"')
    component=adapt_motion('background:"radial-gradient(ellipse 80% 64% at 50% 44%, rgba(255,247,232,0.94) 0%, rgba(255,247,232,0.82) 44%, rgba(255,247,232,0.34) 64%, transparent 78%)"',
        'background:window.__referenceThemeMotion?"var(--theme-paper)":"radial-gradient(ellipse 80% 64% at 50% 44%, rgba(255,247,232,0.94) 0%, rgba(255,247,232,0.82) 44%, rgba(255,247,232,0.34) 64%, transparent 78%)",opacity:window.__referenceThemeMotion?0.28:1')
    component=adapt_motion('" Developed by Chandan Kumar Mahato"','window.__referenceCredit')
    (dest/'current-components.js').write_text(localize(component))
    css=[]
    for f in current.glob('*.css'):
        name='current-'+f.name
        (dest/'assets'/name).write_text(localize(f.read_text()))
        css.append('/reference/assets/'+name)
    body='Q_70la_variable gozi2a_variable _78LZta_variable font-sans'
(dest/'render.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wedding Invitation · Easy Wedding</title>'+''.join('<link rel="stylesheet" href="'+x+'">' for x in css)+'<link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="/reference-designs.css"></head><body class="'+body+'"><script id="__SITE_CONFIG__" type="application/json">{}</script><div id="ew-origin-marker" hidden data-origin="EW-ORIGIN-2026-369eafc22a98" aria-hidden="true">Easy Wedding - easywedding.in - Original creation of Chandan Kumar Mahato - (c) 2026 - EW-ORIGIN-2026-369eafc22a98</div><div id="reference-root"><p style="padding:32px;text-align:center">Preparing your invitation…</p></div><script type="module">import("./entry.js").catch(error=>{console.error(error);document.querySelector("#reference-root").textContent="Your invitation could not open. Please reload."})</script><script type="module" src="/reference-enhance.js"></script></body></html>')
print('Reference assets and motion components packaged locally')
