var getXmlHttp = function() {
  'use strict';
  var xmlhttp;
  try {
    xmlhttp = new ActiveXObject('Msxml2.XMLHTTP');
  } catch (e) {
    try {
      xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
    } catch (E) {
      xmlhttp = false;
    }
  }
  if (!xmlhttp && typeof XMLHttpRequest !== 'undefined') {
    xmlhttp = new XMLHttpRequest();
  }
  return xmlhttp;
};
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
var hashCode = function(s) {
  'use strict';
  s=s||'';
  var i,l,hash=0x811c9dc5;
  for(i=0,l=s.length;i<l;i++){
    hash^=s.charCodeAt(i);
    hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24);
  }
  return hash>>>0;
};
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
              _data.values.push({name:lData.id,value:json});
              _data.ready=(_data.values.length==data.length);
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

  let tplIllness = '';
  const _themeIllness = function(illness){
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
                       '@{room}' : illness.room,
                      };
          return Object.keys(map)
                       .reduce((tpl,token)=>tpl.replace(token, map[token]),tplIllness);
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
          _data.values.forEach((value)=>{
            if(value.name=='illnesses'){ lData = value; } 
          });

    //      lData = _data.values[1];
    //      console.log(_data.values,_data.values.length,lData);
          return lData.value.reduce((theme,illness)=>{
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
    let arrSelectedIllnesses = document.querySelectorAll('.illnessList ,illness.selected') || [];
    //Считаем шансы диагностики для каждого выбранного заболенвания с каждым diagSet 
    //calculateDiag()
    const bitmaskRange = function(til){ let x = 0, xs = []; while (x < til){ xs.push(x++); }; return xs; };
    const bitmaskGenerate = function(n){return bitmaskRange(Math.pow(2, n))};
    let arrDiagSets= bitmaskGenerate(11);
    // конвертируем массив в объект вида  ROOM:BITMASK
    console.log('194',_data.values,_data.values['diagRooms']);
    let arrDiagRooms = [];
    _data.values.forEach((value)=>{ if(value.name=='diagRooms'){ arrDiagRooms = value; } });
    console.log('197',arrDiagRooms);
    let objDiagRooms = {};
    arrDiagRooms.forEach(dr=>{ objDiagRooms[dr.room]=dr.bitmask; });    
    console.log('199',objDiagRooms);
    //Считаем шанс диагностики для заболевания конкретным diagSet
    const calcDiagChance = function (illness, diagSet){
      let dc = Object.keys(objDiagRooms).reduce(chance, dr => {
        if(diagSet & objDiagRooms[dr]){
           return chance * illness.diag[dr];
        };
      },1);
      return dc;
    };
    let arrDiagChance = [];
        arrDiagChance = arrSelectedIllnesses.map(illness=>{
                          let t = [];
                          arrDiagSets.forEach(ds=>{
                            t.push({ds:calcDiagChance(illness,diagSet)});
                          });
                          illness.diagChance = t;
                          return illness;
                        });

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

