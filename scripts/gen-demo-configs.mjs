/* Generates one finished sample invitation config per design into
   public/demo-configs/<design>.json — every design shows a DIFFERENT
   fictional couple, family, venue, dates and photographs (all AI/sample
   imagery, never a real customer's). Used by the public preview router
   and by the studio as the starting point for that design.
   Run: node scripts/gen-demo-configs.mjs (after npm run build so
   reference-fields.js is fresh). */
import { writeFile, mkdir } from 'node:fs/promises';
import { DEFAULTS, normalizeConfig } from '../public/config.js';
import { referenceDefaults } from '../public/reference-fields.js';
import { refreshReferenceDates } from '../public/reference-config.js';

const A = '/reference/assets/';
const P = {
  formal: A + 'current-49b574202f26.jpg', walk: A + 'current-19a7ba2fa9e4.jpg',
  varmala: A + 'current-929a30786e02.jpg', meet: A + 'current-453f66ec8adf.jpg',
  road: A + 'current-f2081c44f71c.jpg', blessed: A + 'current-0de6b0878e02.jpg',
  us: A + 'current-6def8ed83b4f.jpg', haldi: A + 'current-6d739b6d29e5.png',
  mehendi: A + 'current-cd4d616c71ec.jpg', reception: A + 'current-62d344ffd89e.jpg',
  groom2: A + 'ai-groom2.jpg', bride2: A + 'ai-bride2.jpg',
  wedland1: A + 'ai-wedland1.jpg', wedland2: A + 'ai-wedland2.jpg', wedland3: A + 'ai-wedland3.jpg',
  lake: A + 'ai-couple-lake.jpg', venue2: A + 'ai-venue2.jpg',
  sCouple: A + 'current-4d31a609d04f.jpg', sGroom: A + 'current-234c8f91fdc1.jpg',
  sBride: A + 'current-823d1cc4ff47.jpg', sVenue: A + 'current-a1240688e514.jpg',
};
const COUPLES = [P.lake, P.sCouple, P.formal, P.walk, P.us, P.varmala, P.lake, P.formal, P.sCouple, P.walk, P.varmala];

/* date, time = the wedding day. h/m/r = haldi (-2d), mehendi (-1d), reception (+2d) times. */
const D = [
 { id:'premium-original', groom:'Rupesh', bride:'Usha', gLast:'Kapoor', bLast:'Verma',
   gp:'Shri Mohan Kapoor & Shrimati Rekha Kapoor', bp:'Shri Anil Verma & Shrimati Sunita Verma',
   gAddr:'MG Road, Udaipur,\nRajasthan – 313001', bAddr:'Hiran Magri, Udaipur,\nRajasthan – 313002',
   venue:'The Lake Pichola Palace', street:'Lake Palace Road', city:'Udaipur, Rajasthan', pin:'313001',
   date:'2027-02-14', time:'19:00', h:'11:00', m:'17:00', r:'19:00',
   headline:'Two Hearts, One Beautiful Journey', quote:'Different Roots, Same Dreams — A Lifetime Together',
   story:[['How We Met','A rainy evening, one umbrella and a lakeside café in the old city — that is where our story quietly began.'],
          ['Growing Together','From boat rides at sunset to a thousand shared playlists, every small moment stitched us closer.'],
          ['Forever Begins','Now we are ready for our next chapter — and we want you beside us as it begins by the lake.']] },
 { id:'ivory-arch', groom:'Goutam', bride:'Sweety', gLast:'Sharma', bLast:'Iyer',
   gp:'Shri Sandeep Sharma & Shrimati Kavita Sharma', bp:'Shri Ramesh Iyer & Shrimati Lakshmi Iyer',
   gAddr:'Civil Lines, Jaipur,\nRajasthan – 302001', bAddr:'Malviya Nagar, Jaipur,\nRajasthan – 302017',
   venue:'The Garden Pavilion', street:'Palace Road, Civil Lines', city:'Jaipur, Rajasthan', pin:'302001',
   date:'2027-01-23', time:'18:30', h:'08:00', m:'16:00', r:'16:00',
   headline:'A Promise Written in Ivory & Gold', quote:'In all the world, there is no heart for me like yours.',
   story:[['The Bookstore','We reached for the same book in a quiet Jaipur bookstore. Neither of us let go — of the book, or each other.'],
          ['Growing Together','Long walks, longer conversations, and families that slowly became one.'],
          ['Forever Begins','Under ivory arches and winter light, we begin our forever — with you celebrating beside us.']] },
 { id:'royal-prestige', groom:'Arjun', bride:'Kavya', gLast:'Rathore', bLast:'Singh',
   gp:'Shri Devendra Rathore & Shrimati Meena Rathore', bp:'Shri Surendra Singh & Shrimati Usha Singh',
   gAddr:'Ratanada, Jodhpur,\nRajasthan – 342001', bAddr:'Sardarpura, Jodhpur,\nRajasthan – 342003',
   venue:'Umaid Heritage Lawns', street:'Circuit House Road', city:'Jodhpur, Rajasthan', pin:'342001',
   date:'2026-11-29', time:'20:00', h:'08:00', m:'17:00', r:'19:00',
   headline:'A Royal Beginning', quote:'Two families, one celebration, a lifetime of love.',
   story:[['At a Wedding','We first met at a cousin\u2019s wedding — a exchanged glance across the mandap, and fate did the rest.'],
          ['Growing Together','Distance tested us, traditions grounded us, and love quietly won every single time.'],
          ['Forever Begins','In the blue city, beneath a palace sky, we take our vows — royally, joyfully, together.']] },
 { id:'garden', groom:'Rohan', bride:'Sneha', gLast:'Mehta', bLast:'Patel',
   gp:'Shri Nilesh Mehta & Shrimati Bhavna Mehta', bp:'Shri Ketan Patel & Shrimati Rita Patel',
   gAddr:'Satellite, Ahmedabad,\nGujarat – 380015', bAddr:'Maninagar, Ahmedabad,\nGujarat – 380008',
   venue:'Green Valley Farms', street:'SP Ring Road', city:'Ahmedabad, Gujarat', pin:'380015',
   date:'2027-03-06', time:'17:30', h:'09:00', m:'16:00', r:'19:00',
   headline:'Love in Full Bloom', quote:'You are my sunshine on every ordinary day.',
   story:[['College Fest','A garba night at college, matching steps and mismatched excuses to meet again.'],
          ['Growing Together','Startups, setbacks and Sunday thalis — we grew up, and grew together.'],
          ['Forever Begins','Among spring blooms and open skies, we plant the first seed of our forever.']] },
 { id:'haldi', groom:'Kunal', bride:'Priya', gLast:'Yadav', bLast:'Gupta',
   gp:'Shri Ramakant Yadav & Shrimati Shanti Yadav', bp:'Shri Alok Gupta & Shrimati Neeta Gupta',
   gAddr:'Hazratganj, Lucknow,\nUttar Pradesh – 226001', bAddr:'Aliganj, Lucknow,\nUttar Pradesh – 226024',
   venue:'Gomti Riverfront Lawns', street:'Gomti Nagar', city:'Lucknow, Uttar Pradesh', pin:'226010',
   date:'2026-12-05', time:'10:30', h:'08:00', m:'16:00', r:'16:00',
   headline:'Wrapped in Sunshine & Haldi', quote:'Happiness is a little turmeric and a lot of love.',
   story:[['Same Office','Two desks, one project, and chai breaks that kept getting longer.'],
          ['Growing Together','Promotions, transfers and a hundred video calls — we always found our way back.'],
          ['Forever Begins','A morning wedding by the river, wrapped in sunshine — just how we dreamed it.']] },
 { id:'mehndi', groom:'Dev', bride:'Ishita', gLast:'Malhotra', bLast:'Kapoor',
   gp:'Shri Rajiv Malhotra & Shrimati Seema Malhotra', bp:'Shri Harish Kapoor & Shrimati Poonam Kapoor',
   gAddr:'Lajpat Nagar, New Delhi,\nDelhi – 110024', bAddr:'Karol Bagh, New Delhi,\nDelhi – 110005',
   venue:'Chattarpur Greens', street:'Chattarpur', city:'New Delhi, Delhi', pin:'110074',
   date:'2027-01-09', time:'16:00', h:'11:00', m:'15:00', r:'19:00',
   headline:'Painted in Henna & Love', quote:'Mehndi adorns the hands, and love adorns the heart.',
   story:[['The Metro Ride','One crowded metro, one offered seat, and a conversation that missed three stations.'],
          ['Growing Together','Delhi winters, street food trails and two families learning each other\u2019s recipes.'],
          ['Forever Begins','With henna on our hands and music in the air, we begin — come, celebrate with us.']] },
 { id:'sangeet', groom:'Aditya', bride:'Divya', gLast:'Nair', bLast:'Menon',
   gp:'Shri Prakash Nair & Shrimati Geeta Nair', bp:'Shri Mohan Menon & Shrimati Latha Menon',
   gAddr:'Kaloor, Kochi,\nKerala – 682017', bAddr:'Panampilly Nagar, Kochi,\nKerala – 682036',
   venue:'Backwater Breeze Resort', street:'Marine Drive', city:'Kochi, Kerala', pin:'682031',
   date:'2027-02-20', time:'19:30', h:'09:00', m:'17:00', r:'19:00',
   headline:'Our Hearts Dance to One Tune', quote:'Every love story is beautiful, but ours is my favourite song.',
   story:[['Music Class','She sang off-key; he played off-beat. Somehow, it became perfect harmony.'],
          ['Growing Together','Backwater evenings, filter coffee debates and families dancing at every excuse.'],
          ['Forever Begins','A night of music by the water — our forever starts with a dance. Join us!']] },
 { id:'reception', groom:'Vikram', bride:'Anjali', gLast:'Reddy', bLast:'Rao',
   gp:'Shri Srinivas Reddy & Shrimati Padma Reddy', bp:'Shri Venkat Rao & Shrimati Sarita Rao',
   gAddr:'Jubilee Hills, Hyderabad,\nTelangana – 500033', bAddr:'Banjara Hills, Hyderabad,\nTelangana – 500034',
   venue:'Deccan Pearl Convention', street:'Banjara Hills', city:'Hyderabad, Telangana', pin:'500034',
   date:'2026-12-19', time:'19:00', h:'08:00', m:'17:00', r:'19:30',
   headline:'And So, The Adventure Begins', quote:'Whatever our souls are made of, yours and mine are the same.',
   story:[['The Airport Lounge','A delayed flight, two stranded travellers, and one endless conversation over irani chai.'],
          ['Growing Together','Two cities, one rhythm — we built a home in each other\u2019s hearts.'],
          ['Forever Begins','An evening of celebration, dinner and dance as we begin our new journey together.']] },
 { id:'midnight-noor', groom:'Ayaan', bride:'Zara', gLast:'Khan', bLast:'Sheikh',
   gp:'Shri Imran Khan & Shrimati Farah Khan', bp:'Shri Salim Sheikh & Shrimati Nazia Sheikh',
   gAddr:'Bandra West, Mumbai,\nMaharashtra – 400050', bAddr:'Andheri West, Mumbai,\nMaharashtra – 400053',
   venue:'Sea Princess Lawns', street:'Juhu Tara Road', city:'Mumbai, Maharashtra', pin:'400049',
   date:'2027-01-16', time:'20:30', h:'11:00', m:'17:00', r:'20:00',
   headline:'Written in the Stars', quote:'In your light, I learn how to love.',
   story:[['Monsoon Walk','One umbrella at Bandstand, a storm rolling in, and neither of us wanting the walk to end.'],
          ['Growing Together','City lights, shared dreams and families that now celebrate every festival together.'],
          ['Forever Begins','Under a midnight sky by the sea, our noor finds its forever. Be there when it does.']] },
 { id:'blush-mehraab', groom:'Kabir', bride:'Simran', gLast:'Khanna', bLast:'Kaur',
   gp:'Shri Gurpreet Khanna & Shrimati Manjeet Khanna', bp:'Shri Harpreet Singh & Shrimati Jasleen Kaur',
   gAddr:'Rani Bagh, Amritsar,\nPunjab – 143001', bAddr:'Green Avenue, Amritsar,\nPunjab – 143001',
   venue:'Heritage Haveli', street:'Queens Road', city:'Amritsar, Punjab', pin:'143001',
   date:'2026-11-21', time:'18:00', h:'08:00', m:'16:00', r:'16:00',
   headline:'Blessed, Blushing, Beginning', quote:'With blessings above us and love around us, we begin.',
   story:[['Langar Seva','We met serving langar — hands busy, hearts fuller than the plates we carried.'],
          ['Growing Together','Morning prayers, family dinners and a love blessed at every step.'],
          ['Forever Begins','Beneath blush mehraabs in the holy city, we start our blessed forever.']] },
 { id:'emerald-darbar', groom:'Yash', bride:'Riya', gLast:'Thakur', bLast:'Chauhan',
   gp:'Shri Virendra Thakur & Shrimati Kamla Thakur', bp:'Shri Ajay Chauhan & Shrimati Rekha Chauhan',
   gAddr:'Lanka, Varanasi,\nUttar Pradesh – 221005', bAddr:'Sigra, Varanasi,\nUttar Pradesh – 221010',
   venue:'Ganga Kinare Mahal', street:'Assi Ghat Road', city:'Varanasi, Uttar Pradesh', pin:'221005',
   date:'2027-03-13', time:'18:30', h:'08:00', m:'17:00', r:'19:00',
   headline:'By the Sacred River, Forever', quote:'As endless as the river, as certain as its flow — that is us.',
   story:[['Sunrise at the Ghats','A shared boat at dawn, temple bells in the distance, and silence that said everything.'],
          ['Growing Together','Evening aartis, silk lanes and two homes that became one family.'],
          ['Forever Begins','By the sacred river, in an emerald darbar of light, we take our vows.']] },
];

const shiftDate = (iso, days) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

await mkdir('public/demo-configs', { recursive: true });
for (const [i, d] of D.entries()) {
  const hero = COUPLES[i], invite = COUPLES[(i + 2) % COUPLES.length];
  const groomPhoto = i % 2 ? P.groom2 : P.sGroom;
  const bridePhoto = i % 2 ? P.sBride : P.bride2;
  const otherBride = i % 2 ? P.bride2 : P.sBride;
  const venuePhoto = i % 2 ? P.sVenue : P.venue2;
  const ref = JSON.parse(JSON.stringify(referenceDefaults));
  const c = ref.content;
  c.headline = d.headline; c.quote = d.quote;
  /* Every layer of the file tells this design's own story — names, date,
     venue and family all belong to this couple, so no surface (preview,
     studio, published link, or the raw saved data) can show another
     design's details. */
  c.groomName = `${d.groom} ${d.gLast}`; c.brideName = `${d.bride} ${d.bLast}`;
  c.weddingDateISO = `${d.date}T${d.time}:00+05:30`;
  c.venueName = d.venue; c.venueAddressLines = [d.street, d.city];
  c.heroPhoto = hero; c.invitationPhoto = invite;
  c.groomPhoto = groomPhoto; c.bridePhoto = bridePhoto; c.venuePhoto = venuePhoto;
  c.groomParents = d.gp; c.brideParents = d.bp;
  c.groomAddress = d.gAddr; c.brideAddress = d.bAddr;
  c.siteTexts.footerText = `Made with love for ${d.groom} & ${d.bride}`;
  ref.story = ref.story.map((s, j) => ({ ...s, title: d.story[j][0], description: d.story[j][1], photo: [P.meet, P.road, invite][j] }));
  const times = { haldi: d.h, mehendi: d.m, wedding: d.time, reception: d.r };
  const offsets = { haldi: -2, mehendi: -1, wedding: 0, reception: 2 };
  /* Event cards share one wide frame: every event photo is a landscape shot
     so each photo fills its frame fully — no crop, no empty bands. The
     wedding slot rotates wide wedding-moment photos (the couple heroes are
     portrait shots, so they stay in the hero/story/gallery slots). */
  const WED = [P.varmala, P.wedland1, P.wedland2, P.wedland3];
  const images = { haldi: P.haldi, mehendi: P.mehendi, wedding: WED[i % WED.length], reception: P.reception };
  ref.events = ref.events.map(e => ({ ...e, dateISO: `${shiftDate(d.date, offsets[e.id])}T${times[e.id]}:00+05:30`, image: images[e.id] || e.image, venue: d.venue, address: `${d.venue}, ${d.street}, ${d.city} – ${d.pin}`, mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${d.venue} ${d.street} ${d.city}`) }));
  const gal = [
    [groomPhoto, d.groom], [bridePhoto, d.bride], [hero, 'Together'], [P.blessed, 'Blessed moments'],
    [P.us, 'Us'], [groomPhoto, 'The Groom'], [venuePhoto, 'The Venue'], [P.road, 'On the road'],
    [bridePhoto, 'The Bride'], [otherBride, 'Getting Ready'], [invite, 'Memories'],
  ];
  ref.gallery = ref.gallery.map((g, j) => ({ ...g, src: gal[j][0], caption: gal[j][1], fit: 'contain' }));
  const cfg = normalizeConfig({
    ...DEFAULTS, theme: d.id, partner1: d.groom, partner2: d.bride,
    groomName: d.groom, brideName: d.bride, groomDetails: d.gp, brideDetails: d.bp,
    groomAddress: d.gAddr, brideAddress: d.bAddr,
    date: d.date, time: d.time,
    venue: d.venue, address: d.street, city: d.city,
    photoUrl: hero, groomPhoto, bridePhoto, venuePhotoUrl: venuePhoto,
    gallery: gal.map(([src]) => src), reference: ref,
  });
  /* Keep the design's own reference exactly as built above (normalizeConfig
     would rebuild it from the shared defaults); only the date/time labels
     still need computing for this design's dates. */
  cfg.reference = refreshReferenceDates(ref);
  await writeFile(`public/demo-configs/${d.id}.json`, JSON.stringify(cfg, null, 1));
  console.log(`${d.id}: ${d.groom} & ${d.bride} · ${d.date} ${d.time} · ${d.city}`);
}
console.log('demo configs written:', D.length);
