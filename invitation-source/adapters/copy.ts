export const copyText=(index:number,fallback:string):string => (window as any).__easyWedding?.copy?.['text'+index]??fallback;
