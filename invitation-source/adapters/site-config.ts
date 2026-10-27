// Public configuration only. The original application's Prisma/admin backend
// is deliberately replaced by the existing Easy Wedding invitation editor.
const site=(window as any).__easyWedding.site;
export const DEFAULT_SAGUN=site.sagun;
export const DEFAULT_SHARE=site.share;
export type SagunConfig=typeof DEFAULT_SAGUN;
export type ShareConfig=typeof DEFAULT_SHARE;
