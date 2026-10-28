/* Dashboard menu helpers: backdrop + close button + Escape, and the active tab in the bottom bar. */
(function(){
  'use strict';
  var $=function(s){return document.querySelector(s);};
  var side=$('.sidebar'),backdrop=$('#nav-backdrop'),menu=$('#menu-button');
  if(!side)return;
  function closeMenu(){if(side.classList.contains('open')&&menu)menu.click();}
  function sync(){
    var open=side.classList.contains('open');
    document.body.classList.toggle('nav-open',open);
    if(backdrop)backdrop.hidden=!open;
  }
  new MutationObserver(sync).observe(side,{attributes:true,attributeFilter:['class']});
  if(backdrop)backdrop.addEventListener('click',closeMenu);
  var x=$('.sidebar-close');if(x)x.addEventListener('click',closeMenu);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});
  var more=$('#more-button');if(more)more.addEventListener('click',function(){if(menu&&!side.classList.contains('open'))menu.click();});
  var tabs=[].slice.call(document.querySelectorAll('.bottom-nav [data-view]'));
  function mark(){
    var active=$('#navigation [data-view].active'),id=active?active.getAttribute('data-view'):'';
    tabs.forEach(function(b){var on=b.getAttribute('data-view')===id;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  }
  var nav=$('#navigation');if(nav){new MutationObserver(mark).observe(nav,{childList:true});}
  mark();
  if(window.lucide&&window.lucide.createIcons)window.lucide.createIcons();
})();
