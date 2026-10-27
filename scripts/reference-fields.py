import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'qa/exact-reference';current=source/'current-source';inputs=current if current.exists() else source;site=json.loads((inputs/'site-config.json').read_text());w=json.loads((inputs/'wedding.json').read_text());localized=json.loads((root/'public/reference/source-data.json').read_text())
fields=[]
def add(path,label,value,kind='text',group='Family & invitation'):
    fields.append(dict(path=path,label=label,value=value,kind=kind,group=group))
for k,label in [('groomPhoto','Groom portrait'),('bridePhoto','Bride portrait'),('heroPhoto','Video cover photograph')]:add('content.'+k,label,localized['site']['content'][k],'image')
for k in ['groomRelationLabel','groomParents','groomAddress','brideRelationLabel','brideParents','brideAddress','headline','quote','invitationMessage','venuePin','venueMapUrl']:
    add('content.'+k,re.sub(r'([A-Z])',r' \1',k).capitalize(),'' if k in ['venuePin','venueMapUrl'] else site['content'].get(k,''),'text')
for i,row in enumerate(localized['wedding']['story']):
    for k in ['title','dateLabel','description','photo']:add(f'story.{i}.{k}',f'Story {i+1} · {k}',row.get(k) or '', 'image' if k=='photo' else 'text','Our story · 3 chapters')
for i,row in enumerate(localized['wedding']['events']):
    for k in ['name','tagline','dateISO','description','dressCode','image']:add(f'events.{i}.{k}',f'Event {i+1} · {k}',row.get(k) or '', 'image' if k=='image' else 'datetime' if k=='dateISO' else 'text',f'Festivities · {len(localized["wedding"]["events"])} events')
for i,row in enumerate(localized['wedding']['gallery']):
    for k in ['src','caption']:add(f'gallery.{i}.{k}',f'Gallery {i+1} · '+('photo' if k=='src' else k),row.get(k) or '', 'image' if k=='src' else 'text',f'Our moments · {len(localized["wedding"]["gallery"])} photos')
for k,v in localized['site']['sagun'].items():
    if k in ['qr1IconsImage','qr2IconsImage']:continue
    add('sagun.'+k,re.sub(r'([A-Z])',r' \1',k).capitalize(),'' if k in ['qr1Image','qr2Image','qr1UpiId','qr2UpiId'] else v,'image' if k in ['qr1Image','qr2Image'] else 'text','Blessings & your UPI QR codes')
add('contactPhone','Venue contact number','','text','Venue & sharing')
for k in ['title','subtitle','scanLabel']:add('share.'+k,'Share · '+k,site['share'][k],'text','Venue & sharing')
add('share.whatsappMessage','Share message',"You're invited to the wedding of {groom} & {bride} on {date}! {link}",'text','Venue & sharing')
phrases=['A Little','Surprise Awaits...','Something beautiful is about to begin...','You’re Invited','To Our Wedding Celebration','Our Story','Two Hearts, One Journey','Wedding Festivities','Join Us for Our Special Moments','Wedding Timeline','Every celebration, in order','Our Moments','A few special moments from our journey','Video Section','Our invitation film','Will You Celebrate With Us?','Please RSVP and let us know your presence — it will mean a lot to us!','Celebration Details','Thank You!','For Being a Part of Our Beginning','With Love','॥ श्री गणेशाय नमः ॥','Tap to Reveal','To the Wedding of','Tap to Begin','Scroll to Explore','Same People','Same Love','Bigger Blessings','Our Family','Home','Where Our','Celebration Begins','Join us as we celebrate love, laughter and new beginnings at our family home.']
bundle=root/'public/reference/current-components.js' if current.exists() else next((root/'public/reference/chunks').glob('page-*.js'));text=bundle.read_text()
for i,phrase in enumerate(phrases):
    quoted=json.dumps(phrase,ensure_ascii=False)
    if quoted in text:
        label='Ganesh invocation' if i==21 else phrase
        value='Shree Ganeshaya Namah' if i==21 else phrase
        add('copy.text'+str(i),label,value,'text','All section headings & opening text')
        text=text.replace(quoted,'window.__referenceCopy.text'+str(i))
text=text.replace(json.dumps('Po+Ps - Pindrajora, Bokaro, Jharkhand, 827013'), 'window.__referenceVenueAddress')
text=text.replace(json.dumps('All celebrations at Keliya Dabar, Bokaro, Jharkhand'), 'window.__referenceAllCelebrations')
text=text.replace(json.dumps('26 • 11 • 2026',ensure_ascii=False), 'window.__referenceClosingDate')
text=text.replace('(0,s.jsx)(ti,{})','window.__referenceMusicEnabled&&(0,s.jsx)(ti,{})')
if current.exists():
    # Component names change in captured builds. Find the actual music control;
    # never hide navigation merely because the couple has not uploaded a song.
    marker=text.index('"Turn music off"')
    music_name=list(re.finditer(r'function ([A-Za-z0-9_$]+)\(',text[:marker]))[-1].group(1)
    calls=list(re.finditer(r'\(0,[a-z].jsx\)\('+re.escape(music_name)+r',\{\}\)',text))
    if len(calls)!=1:raise ValueError('Expected one music-control render')
    music_call=calls[0].group(0)
    text=text.replace(music_call,'window.__referenceMusicEnabled&&'+music_call)
bundle.write_text(text)
defaults={'content':{},'story':localized['wedding']['story'],'events':localized['wedding']['events'],'gallery':localized['wedding']['gallery'],'sagun':{},'share':{},'copy':{}}
for f in fields:
    parts=f['path'].split('.');o=defaults
    for k in parts[:-1]:
        if isinstance(o,list):o=o[int(k)]
        else:o=o.setdefault(k,{})
    o[parts[-1]]=f['value']
(root/'public/reference-fields.js').write_text('export const referenceFields='+json.dumps(fields,ensure_ascii=False)+';\nexport const referenceDefaults='+json.dumps(defaults,ensure_ascii=False)+';\n')
print('Reference fields:',len(fields),'new image slots:',sum(f['kind']=='image' for f in fields),'+ existing couple and venue uploads')
