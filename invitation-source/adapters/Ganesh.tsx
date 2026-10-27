import Image from './Image';
export default function Ganesh({className=''}:{className?:string}){
 if((window as any).__easyWedding.config.ganeshIcon==='none')return null;
 return <div className={'theme-ganesh source-ganesh '+className}><Image src="/assets/wedding/ganesh.png" alt="Lord Ganesha" width={112} height={112} priority className="theme-ganesh-image" /></div>;
}
