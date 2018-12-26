if (!('escape' in RegExp)){
  RegExp.escape = function(str) {
    //return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
}
if (!('replaceMultiple' in String)){
  String.replaceMultiple = function(str,map,reOptions){
    reOptions = reOptions || 'gi';
    if ((typeof map !== 'object') || (typeof str !== 'string')){
      return str;
    }
    var n = Object.keys(map);
    if(n.length<=0){
      return str;
    }
    for(var i=0;i<n.length;i++){
      n[i]=RegExp.escape(n[i]);
    }
    n=n.join('|');
    var re = new RegExp(n, reOptions);
    var t=str.replace(re,function(a){return map[a];});
    return t;
  };
}
var HtmlToDom = function(html) {
  'use strict';
  if (html){
    var range = document.createRange();
    range.selectNode(document.body);
    return range.createContextualFragment(html);
  }
};
var clearNode = function(node) {
  'use strict';
  while (node.firstChild) {
      node.removeChild(node.firstChild);
  }
};
var bitCount = function(u) {
    const uCount = u - ((u >> 1) & 0o33333333333) -((u >> 2) & 0o11111111111);
    return ((uCount + (uCount >> 3)) & 0o30707070707) % 63;
}
// **********************************************
let APP = (function(init) {
  'use strict';
  let _data = {ready: false, values: []};

  const _getData = function(data,callback){
    data.forEach((lData)=>{
           fetch(lData.url)
           .then((response)=>{
              let cth = response.headers.get("content-type");
              if(cth && cth.includes("application/json")) {
                return response.json();
              }
              throw new TypeError("Oops, we haven't got JSON!");
            })// then
           .then((json)=>{
              //_data.values.push({name:lData.id,value:json});
              //_data.ready=(_data.values.length==data.length);
              _data.values[lData.id] = json;
              _data.ready=(Object.keys(_data.values).length==data.length);
            })// then
           .catch((e)=>{
              console.log('Data load error.',lData.id,e);
            });//catch, fetch
    });//forEach
    _waitData(true,callback);
  };//_getData

  const _waitData = function(start, callback){
    let t;
    let c = function(){
      clearTimeout(t);
      if(_data.ready){
        //setTimeout(callback,1000);
        callback();
        return;
      };
      t=setTimeout(c,240);
    };
    switch(true){
      case (typeof start === 'undefined' && typeof callback === 'undefined'):
      break;
      case (start === true && typeof callback === 'function' && typeof t === 'undefined'):
        //t=setTimeout(c,1000);
        c();
      break;
      case (start === false && typeof t !== 'undefined'):
        clearTimeout(t);
      break;   
    };
  };

  let tplIllness = '';let illnessId = 0;
  let _themeIllness = function(illness){
          if(tplIllness.length===0){
            let el = document.getElementById('tplIllness');
            if(el !== null){ 
              let p = document.createElement('div');
              let cel = el.cloneNode(true);
                  cel.removeAttribute('id');            
                  p.appendChild(cel);            
                  cel = el.cloneNode();
                  cel.id='';
              tplIllness = p.innerHTML; 
            }
          }

          const map = {'@{name}': illness.name,
                       '@{room}': illness.room,
                       '@{id}'  : illnessId,
                      };
          return String.replaceMultiple(tplIllness,map);
  };

  let tplIllnessList = '';
  const _themeIllnessList = function(){
          if(tplIllnessList.length===0){
            let el = document.getElementById('tplIllnessList');
            if(el !== null){ 
              let p = document.createElement('div');
              let cel = el.cloneNode(true);
                  cel.removeAttribute('id');            
                  p.appendChild(cel);            
                  cel = el.cloneNode();
                  cel.id='';
              tplIllnessList = p.innerHTML; 
            }
          }
          var lData = {};
          //_data.values.forEach((value)=>{
          //   if(value.name=='illnesses'){ lData = value.value; } 
          //});
          lData = _data.values['illnesses'];

          return lData.reduce((theme,illness)=>{
                               return theme + _themeIllness(illness);
                             },tplIllnessList);
  };

  const _showIllnessList = function(theme){
    let el = document.getElementById('illnessList');
    if (el === null){ return; }
    let t = HtmlToDom(theme);
    clearNode(el);
    el.appendChild(t);
  };

  const _bindCmds = function (commands) {
    if( !Array.isArray(commands)){return false};
    commands.forEach((command)=>{
      //[id,targetId,eventType,capture,callback]
      let el = document.getElementById(command[1]);
      try {
        el.addEventListener(command[2],command[4],command[3]);
      } catch (e) { console.log('Bind command error.',command,el,e); }
    });
  };  
////////////////////////////////////
  const _cmdSearch = function (ev) {
    //getSelectedIllnesses()
    //Генерируем массив выбраных заболваний
    let arrIllnesses = _data.values['illnesses'] || {};
    let arrSelectedIllnesses = [].map.call(document.querySelectorAll('#illnessList .illness.selected'), (item)=>{
            try {
              let illnessName = item.getAttribute('data-name')
              for(let i=1;i<=arrIllnesses.length;i++){
                let illness = arrIllnesses[i];
                if(illness.name==illnessName) { return illness; }
              }
            }catch(e){}
        });
    console.log(arrSelectedIllnesses);  

    //Считаем шансы диагностики для каждого выбранного заболенвания с каждым diagSet 
    //calculateDiag()
    const bitmaskRange = function(til){ let x = 0, xs = []; while (x < til){ xs.push(x++); }; return xs; };
    const bitmaskGenerate = function(n){return bitmaskRange(Math.pow(2, n))};
    let arrDiagSets= bitmaskGenerate(11);
    // конвертируем массив в объект вида  ROOM:BITMASK
    let arrDiagRooms = _data.values['diagRooms'];
    let objDiagRooms = {};
    arrDiagRooms.forEach(dr=>{ objDiagRooms[dr.room]=dr.bitmask; });    
    console.log('228',objDiagRooms);
    //Считаем шанс диагностики для заболевания конкретным diagSet
    const calcDiagChance = function (illness, diagSet){
      return Object.keys(objDiagRooms)
                   .reduce((chance, dr) => {
                      if(diagSet & objDiagRooms[dr]){
                         chance += illness.diag[dr];
                      }
                      return chance;
                    },0);
    };

    let arrDiagChance = [].map.call(arrSelectedIllnesses, 
                                    (illness)=>{
                                      let t = [];
                                      arrDiagSets.forEach(ds=>{
                                        t[ds]=calcDiagChance(illness,ds);
                                      });
                                      illness.diagChance = t;
                                      return illness;
                                    });
    console.log(234,arrDiagChance);
    let t = [];//arrDiagSets;
    arrDiagChance.forEach((illness)=>{
        illness.diagChance.forEach((dc,idx)=>{
          try {
            if(t[idx].value <= dc){return;}
          }catch(e){}
          t[idx]={'id':idx,'value':dc};
      //console.log(243,illness,t);
      });
    });
    console.log(214,arrDiagChance,t);
    t=t.filter((item)=>(bitCount(item.id)<=5));
    t=t.filter((item)=>((objDiagRooms.GP & item.id)&&(objDiagRooms.TREAT & item.id)&&(objDiagRooms.WARD & item.id)&&(objDiagRooms.GP2 & item.id)));
    t=t.filter((item)=>(item.value>=0.7));
    t.sort(function (a, b) {
      if (a.value > b.value) { return  1; }
      if (a.value < b.value) { return -1; }
      return  0;
    });
    console.log(223,t);  





    //sortDiagsSets()
    //theneDiagSets()
    ///themeDiagSet()
    ////themeDiagRoom()
    //showDiagSets()
  };
  const _cmdClear = function (ev) { };
  const _cmdIllnessSelect = function (ev) {
       if(ev.target.classList.contains('illness')){ 
         ev.stopPropagation();
         ev.target.classList.toggle('selected'); 
       }
  };

  const _onload = function(event) {
    document.removeEventListener('DOMContentLoaded', _onload);
    _getData([
              {id:'illnesses',url:'illnesses.json'},
              {id:'diagRooms',url:'rooms.json'}
            ],
            function(){
               let t = _themeIllnessList();
               _showIllnessList(t);
              //_showSearchBtn();
              _bindCmds([
                          ['clear'          ,'btnClear'   ,'click',false,_cmdClear],
                          ['search'         ,'btnSearch'   ,'click',false,_cmdSearch],
                          ['illnessSelected','illnessList','click',false,_cmdIllnessSelect],
                       ]);
            });
  };
  let APP = {
    init   : function() { document.addEventListener('DOMContentLoaded', _onload); },
  };
  if (init && (false === APP.init())){ return null; }
  return APP;
}(true));

