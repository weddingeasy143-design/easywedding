/* Easy Wedding — keeps the design prices on the register page in step with the admin price list. */
(function(){
  var rupees=function(p){return '\u20b9'+Math.round(p/100).toLocaleString('en-IN');};
  fetch('/api/pricing').then(function(r){return r.ok?r.json():null;}).then(function(d){
    if(!d||!Array.isArray(d.designs))return;
    d.designs.forEach(function(row){
      var card=document.querySelector('.rg-card[data-design="'+row.id+'"]');if(!card)return;
      var price=card.querySelector('.rg-price');if(!price)return;
      price.textContent='';
      if(row.launchActive&&row.regular>row.current){var s=document.createElement('s');s.textContent=rupees(row.regular);price.append(s,' ');}
      var b=document.createElement('b');b.textContent=rupees(row.current);price.append(b);
    });
  }).catch(function(){});
})();
