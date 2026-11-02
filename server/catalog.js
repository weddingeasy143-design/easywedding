/* The Easy Wedding catalogue + support contacts — the ONE place these words
   live for the website AND the Android app.
 *
 * Served at GET /api/catalog (designs + add-ons) and inside GET /api/site-info
 * (the `support` block). The website's own pages still carry their rendered
 * copies (public/landing.html cards, public/studio.js ADDON_NAMES/ADDON_DESCS,
 * the landing footer) — when a design or add-on is renamed, edit THIS file and
 * those pages together; the app follows this endpoint on its own, with no app
 * update. Prices are NOT here: they live in the prices table and are served by
 * /api/pricing.
 *
 * Artwork paths are root-relative; the payload builder prefixes the request
 * origin so the app always receives absolute URLs on the serving domain. */

/* Order is the catalogue order (the landing grid's order). `premium` marks the
   one premium design, whose full artwork is the ornaments opener; every other
   design's artwork is assets/wedding/<id>.webp with the 480px catalogue thumb. */
export const CATALOG_DESIGNS=[
 {id:'premium-original',name:'Premium Original',style:'Cinematic curtain & doors · 23 photos',premium:true,artwork:'/ornaments/opening-realistic.webp',thumbnail:'/assets/catalog/premium-original-480.webp'},
 {id:'royal-prestige',name:'Crimson Vows',style:'Rose drift · royal gates',premium:false,artwork:'/assets/wedding/royal-prestige.webp',thumbnail:'/assets/catalog/royal-prestige-480.webp'},
 {id:'mehndi',name:'Peacock Promise',style:'Feather sway · peacock fan',premium:false,artwork:'/assets/wedding/mehndi.webp',thumbnail:'/assets/catalog/mehndi-480.webp'},
 {id:'midnight-noor',name:'Starlit Vows',style:'Moonlit float · starlight reveal',premium:false,artwork:'/assets/wedding/midnight-noor.webp',thumbnail:'/assets/catalog/midnight-noor-480.webp'},
 {id:'haldi',name:'Golden Phere',style:'Marigold flutter · golden curtain',premium:false,artwork:'/assets/wedding/haldi.webp',thumbnail:'/assets/catalog/haldi-480.webp'},
 {id:'ivory-arch',name:'Ivory Jasmine',style:'Jasmine breeze · silk reveal',premium:false,artwork:'/assets/wedding/ivory-arch.webp',thumbnail:'/assets/catalog/ivory-arch-480.webp'},
 {id:'garden',name:'Botanical Forever',style:'Leaf sway · garden unfold',premium:false,artwork:'/assets/wedding/garden.webp',thumbnail:'/assets/catalog/garden-480.webp'},
 {id:'sangeet',name:'Wisteria Vows',style:'Wisteria cascade · violet veil',premium:false,artwork:'/assets/wedding/sangeet.webp',thumbnail:'/assets/catalog/sangeet-480.webp'},
 {id:'reception',name:'Champagne Forever',style:'Candlelight drift · editorial reveal',premium:false,artwork:'/assets/wedding/reception.webp',thumbnail:'/assets/catalog/reception-480.webp'},
 {id:'blush-mehraab',name:'Blush Lotus',style:'Lotus bloom · petal drift',premium:false,artwork:'/assets/wedding/blush-mehraab.webp',thumbnail:'/assets/catalog/blush-mehraab-480.webp'},
 {id:'emerald-darbar',name:'Sacred Courtyard',style:'Terracotta warmth · courtyard fold',premium:false,artwork:'/assets/wedding/emerald-darbar.webp',thumbnail:'/assets/catalog/emerald-darbar-480.webp'},
];

/* The paid add-ons, in the studio's order (public/studio.js ADDON_NAMES /
   ADDON_DESCS carry the same words for the website's own screens). Ids are the
   contract shared with /api/pricing and /api/entitlements. */
export const CATALOG_ADDONS=[
 {id:'addon-personal',name:'Personal Invitations',description:'A special link for every guest, with their own name on the invitation — plus who opened it and who replied.'},
 {id:'addon-language-hi',name:'Extra Language — Hindi',description:'Guests can also read your invitation in Hindi.'},
 {id:'addon-pdf',name:'Print-ready PDF',description:'A beautiful printable PDF card of your invitation, with your link and QR.'},
 {id:'addon-gallery',name:'Premium Gallery',description:'Gallery photos: 4 are FREE with every design. With this add-on, you get 12 gallery photos.'},
 {id:'addon-shortlink',name:'Custom Short Link',description:'Your own short address, like easywedding.in/rahul-weds-seema.'},
];

/* Support contacts, as shown in the website footer; served inside
   /api/site-info so the app shows the same words without an app update. */
export const SUPPORT={
 phone:'8789991983',
 phoneDisplay:'+91 87899 91983',
 whatsapp:'https://wa.me/918789991983?text=Namaste%20Easy%20Wedding!%20%F0%9F%99%8F%20Meri%20shaadi%20ke%20liye%20mujhe%20ek%20sundar%20sa%20digital%20invitation%20banana%20hai.%20Kripya%20mujhe%20designs%20aur%20daam%20ki%20jaankari%20dijiye.%20Dhanyavaad!%20%F0%9F%92%90',
 email:'support@easywedding.in',
 hours:'10 AM – 8 PM',
 instagram:'https://www.instagram.com/easywedding.in/',
 facebook:'https://www.facebook.com/profile.php?id=61595890109942',
};

/** The /api/catalog body for [origin] (e.g. "https://easywedding.in"). */
export function catalogPayload(origin){
 const abs=p=>p.startsWith('http')?p:origin+p;
 return {
  designs:CATALOG_DESIGNS.map(d=>({id:d.id,name:d.name,style:d.style,premium:d.premium,artwork:abs(d.artwork),thumbnail:abs(d.thumbnail)})),
  addons:CATALOG_ADDONS.map(a=>({id:a.id,name:a.name,description:a.description})),
 };
}
