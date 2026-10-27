import React from 'react';
import {referenceImageFor} from '../../public/reference-designs.js';

/** Keep the supplied Next image API while serving the original assets locally. */
export default function Image(props: any) {
  const {fill,priority,quality,unoptimized,placeholder,blurDataURL,onLoadingComplete,...image}=props;
  const context=(window as any).__easyWedding;
  if(typeof image.src==='object')image.src=image.src.src;
  if(!image.src)return null;
  const art=context?.design.premium?{src:image.src,kind:''}:referenceImageFor(image.src,context.design);
  const ganesh=String(image.alt||'').startsWith('Lord Ganesha');
  if(ganesh && context.config.ganeshIcon==='none')return null;
  image.src=ganesh?'/assets/wedding/ganesh.png':art.src;
  if(art.kind){image.className=(image.className||'')+' theme-'+art.kind;image['data-theme-art']=art.kind;image.alt='';image['aria-hidden']=true;}
  if(ganesh)image.className=(image.className||'')+' theme-ganesh-image';
  return <img {...image} decoding="async" loading={priority?'eager':image.loading||'lazy'} style={{
    ...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...image.style,
    ...(art.kind==='floral'?{WebkitMaskImage:'none',maskImage:'none'}:{}),
    ...(ganesh?{objectFit:'contain',objectPosition:'center',filter:context.config.ganeshIcon==='vermilion'?'sepia(1) saturate(3) hue-rotate(330deg)':context.config.ganeshIcon==='ivory'?'grayscale(1) brightness(1.3)':'none'}:{})
  }}/>;
}
