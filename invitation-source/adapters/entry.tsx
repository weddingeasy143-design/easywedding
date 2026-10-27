import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'framer-motion';
import Home from '../src/app/page';
import {MotionPreference} from './motion-preference';
function App(){
 const [paused,setPaused]=useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{window.dispatchEvent(new Event('wedding:mounted'));},[]);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const changed=()=>setPaused(preference.matches);
  preference.addEventListener('change',changed);
  return ()=>preference.removeEventListener('change',changed);
 },[]);
 useEffect(()=>{
  document.body.dataset.motionPaused=String(paused);
  window.dispatchEvent(new CustomEvent('wedding:motion',{detail:{paused}}));
 },[paused]);
 return <MotionPreference.Provider value={paused}><MotionConfig reducedMotion={paused?'always':'never'}><Home/><button className="invitation-motion-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Resume motion':'Pause motion'}</button></MotionConfig></MotionPreference.Provider>;
}
createRoot(document.getElementById('reference-root')!).render(<App/>);
