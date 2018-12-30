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
const cloneNode = function(el) {
  'use strict';
  if(el !== null){ 
    let p = document.createElement('div');
    let cel = el.cloneNode(true);
        cel.removeAttribute('id');            
        p.appendChild(cel);            
        cel = el.cloneNode();
        cel.id='';
        return  p; 
  }
};
const bitCount = function(u) {
    const uCount = u - ((u >> 1) & 0o33333333333) -((u >> 2) & 0o11111111111);
    return ((uCount + (uCount >> 3)) & 0o30707070707) % 63;
}
const bitmaskGenerate = function(n){
  const bitmaskRange = (til)=>{ let x = 0, xs = []; while (x < til){ xs.push(x++); }; return xs; };
  return bitmaskRange(Math.pow(2, n))
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

  //let _theme = {templates:["default":{"id":"default","value":""}]};
  let _theme = {templates:[]};
      _theme.templates["default"]={"id":"default","value":""};
  // const _getThemeTpl = function(tplId){if not themevalues[tplId]}
  const _getThemeTpl = function(tplId,def){
    if(typeof _theme.templates[tplId] =='undefined' || _theme.templates[tplId].value.length===0){
      try {
        let el = document.getElementById(tplId);
            el = cloneNode(el);
            _theme.templates[tplId] = {"id":tplId,"value":el.innerHTML};
      } catch(e) { }
    }
    return _theme.templates[tplId].value
           || def
           || _theme.temlates["default"].value
           || '';
  };
  const _renderTheme = function(theme,targetId){
    try {
      let el = document.getElementById(targetId);
      let t = HtmlToDom(theme);
      clearNode(el);
      el.appendChild(t);
    } catch(e) {}
  };
  let _themeLevel = function(level){
          const map = {'@{name}': level.name,
                      };
          const template = _getThemeTpl('tplLevel'); 
          return String.replaceMultiple(template,map);
  };
  const _themeLevelList = function(){
          let lData = [].reduce.call(_data.values['levels']
                                    ,(theme,level)=>(theme + _themeLevel(level))
                                    ,'');
          const map = {'@{items}': lData};          
          const template = _getThemeTpl('tplLevelList'); 
          return String.replaceMultiple(template,map);
  };
  const _showLevelList = function(theme){
    _renderTheme(theme,'levelList')
  };

  let illnessId = 0;
  let _themeIllness = function(illness){
          const map = {'@{name}': illness.name,
                       '@{room}': illness.room,
                       '@{id}'  : illnessId,
                      };
          const template = _getThemeTpl('tplIllness'); 
          return String.replaceMultiple(template,map);
  };

  const _themeIllnessList = function(){
          let lData = [].reduce.call(_data.values['illnesses']
                                    ,(theme,illness)=>(theme + _themeIllness(illness))
                                    ,'');
          const map = {'@{items}': lData};          
          const template = _getThemeTpl('tplIllnessList'); 
          return String.replaceMultiple(template,map);
  };
  const _showIllnessList = function(theme){
    _renderTheme(theme,'illnessList')
  };
  //themeDiagRoom()
  const _themeDiagRoom = function(diagRoom){
          const map = {'@{id}': diagRoom.room};          
          const template = _getThemeTpl('tplDiagRoom'); 
          return String.replaceMultiple(template,map);
  };  
  //themeDiagSet()
  const _themeDiagSet = function(diagSet){
          let arrDiagRooms = _data.values['diagRooms'].filter(diagRoom=>(diagRoom.bitmask & diagSet.id));
          let lData = [].reduce.call(arrDiagRooms
                                    ,(theme,diagRoom)=>(theme + _themeDiagRoom(diagRoom))
                                    ,'');
          const map = {'@{items}': lData,
                       '@{value}': Math.round(diagSet.value*100,1)+'%'
                      };          
          const template = _getThemeTpl('tplDiagSet'); 
          return String.replaceMultiple(template,map);
  };
  //theneDiagSets()
  const _themeDiagSetList = function(diagSetList){
          let lData = [].reduce.call(diagSetList
                                    ,(theme,diagSet)=>(theme + _themeDiagSet(diagSet))
                                    ,''
                                    );
          const map = {'@{items}': lData};          
          const template = _getThemeTpl('tplDiagSetList'); 
          return String.replaceMultiple(template,map);
  };
  //showDiagSets()
  const _showDiagSetList = function(theme){
    _renderTheme(theme,'diagSetList')
  };  

  // let _commands ={}
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
  const _getSelectedIllnesses = function (){
    let t = [];
    try {
      t = [].map.call(document.querySelectorAll('#illnessList .illness.selected')
                     ,(item)=>item.getAttribute('data-name') || ''
                     );
      t = [].filter.call(_data.values['illnesses']
                        ,(item)=>t.includes(item.name)
                        );
    }  catch (e) {}
    return t || [];
  };
  const _cmdSearch = function (ev) {
    //Генерируем массив выбраных заболваний
    let arrSelectedIllnesses = _getSelectedIllnesses();
    console.log(arrSelectedIllnesses);  

    //Считаем шансы диагностики для каждого выбранного заболенвания с каждым diagSet 
    //calculateDiag()
    let arrDiagSets= bitmaskGenerate(11);
    // конвертируем массив в объект вида  ROOM:BITMASK
    let objDiagRooms = {};
    [].forEach.call(_data.values['diagRooms']
                   ,(diagRoom)=>{ objDiagRooms[diagRoom.room]=diagRoom.bitmask; }
                   );    
    console.log('228',objDiagRooms);
    //Считаем шанс диагностики для заболевания конкретным diagSet
    const calcDiagChance = function (illness, diagSet){
      return Object.keys(objDiagRooms)
                   .reduce((chance, dr) => {
                      if(diagSet & objDiagRooms[dr]){
                          chance += illness.diag[dr];
                          if(!objDiagRooms.GP || !objDiagRooms.GP2 || !objDiagRooms.TREAT){
                            chance += illness.diag["GP2"];
                          }
                        }
                      return chance;
                    },0);
    };

    let arrDiagChance = [].map.call(arrSelectedIllnesses, 
                                    (illness)=>{
                                      let t = [];
                                      arrDiagSets.forEach((diagSet)=>{
                                        t[diagSet]=calcDiagChance(illness,diagSet);
                                      });
                                      illness.diagChance = t;
                                      return illness;
                                    });
    console.log(234,arrDiagChance);
    let t = [];//arrDiagSets;
    arrDiagChance.forEach((illness)=>{
        illness.diagChance.forEach((diagChance,idx)=>{
          try {
            if(t[idx].value <= diagChance){return;}
          }catch(e){}
          t[idx]={'id':idx,'value':diagChance};
      });
    });
    console.log(214,arrDiagChance,t);
    //t=t.filter((item)=>(bitCount(item.id)<=));
    t=t.filter((item)=>((objDiagRooms.GP & item.id)
                        && !(objDiagRooms.TREAT & item.id)
                        //&&(objDiagRooms.WARD & item.id)
                        && !(objDiagRooms.PSY & item.id)
                        && !(objDiagRooms.DNA & item.id)
                        && !(objDiagRooms.GP2 & item.id)
                       )
              );
    t=t.filter((item)=>(item.value>=0.4));
    //sortDiagsSets()
    /**
    t.sort(function (a, b) {
      switch(true){
      case (bitCount(a.value) > bitCount(b.value)): { return -1; }
      case (bitCount(a.value) < bitCount(b.value)): { return  1; }
      default:
        if (a.value > b.value) { return -1; }
        if (a.value < b.value) { return  1; }
        return  0;
      }
    });
    */
    let t1 = [];
    t.forEach((item)=>t1.push(bitCount(item.value)));
    t1.forEach((bits)=>{
      bits.sort((a, b)=>{
        switch(true){
        case (bitCount(a.value) > bitCount(b.value)): return -1;
        case (bitCount(a.value) < bitCount(b.value)): return  1; 
        default: return  0;
        }
      });
    });
    let t2 = [];
    t1.map((bits)=>{
      for (let i=0;i<=bits.length;i++){
        t2.push(bits[i]);
      }
    });
    console.log(225,t, t1, t2); 
   _showDiagSetList(_themeDiagSetList(t));
  };

  const _cmdClear = function (ev) { };
  const _cmdIllnessSelect = function (ev) {
       if(ev.target.classList.contains('illness')){ 
         ev.stopPropagation();
         ev.target.classList.toggle('selected'); 
       }
  };
  const _cmdLevelSelect = function (ev) {
     if(!ev.target.classList.contains('level')){ return; }
     ev.stopPropagation();

     try {
       const levelName = ev.target.getAttribute("data-name");
       const levels = _data.values["levels"];
       let level = {};
       [].forEach.call(levels,(lvl)=>{
         if(lvl.name==levelName){
           level = lvl;
         }
       });
       const t = document.querySelectorAll('#illnessList .illness');
       [].forEach.call(t,(item)=>{item.classList.remove('selected')});
       [].forEach.call(t,(item)=>{
            [].forEach.call(level.illnesses,(illnessName)=>{
                 if(illnessName == item.getAttribute("data-name")){
                   item.classList.add('selected'); 
                 }
            });
          });
     } catch(e) {
       console.log(e);
     }
  };
  const _onload = function(event) {
    document.removeEventListener('DOMContentLoaded', _onload);
    _getData([
              {id:'levels'   ,url:'levels.json'},
              {id:'illnesses',url:'illnesses.json'},
              {id:'diagRooms',url:'rooms.json'}
             ]
             ,function(){
                _showLevelList(_themeLevelList());
                _showIllnessList(_themeIllnessList());
                _bindCmds([
//                          ['clear'          ,'btnClear'   ,'click',false,_cmdClear],
                          ['search'         ,'btnSearch'   ,'click',false,_cmdSearch],
                          ['illnessSelected','illnessList' ,'click',false,_cmdIllnessSelect],
                          ['levelSelected'  ,'levelList'   ,'click',false,_cmdLevelSelect],
                         ]);





            });
  };
  let APP = {
    init   : function() { document.addEventListener('DOMContentLoaded', _onload); },
  };
  if (init && (false === APP.init())){ return null; }
  return APP;
}(true));

