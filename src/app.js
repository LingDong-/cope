var notebook;
var cellDoms = [];
var lastFocusTextDom = undefined;
var bogusFocusChange = false;
var panelOpen = false;

var mainDom = document.getElementsByClassName("main")[0];

var meterDom = document.getElementsByClassName("selectMeter")[0];
meterDom.onchange = function(){
  if (lastFocusTextDom){
    bogusFocusChange = true;
    lastFocusTextDom.focus()
    notebook.cells[getCurrentCellIndex()].meter = meterDom.value
  }
}
for (var k in METERS){
  var op = document.createElement('option');
  op.innerHTML = k
  op.value = k
  meterDom.appendChild(op);
}

var rhymebookDom = document.getElementsByClassName("selectRhymebook")[0];
rhymebookDom.onchange = function(){
  if (lastFocusTextDom){
    bogusFocusChange = true;
    lastFocusTextDom.focus();
    notebook.cells[getCurrentCellIndex()].rhymebook = rhymebookDom.value
  }
  updateSelectRhymeGroup();
}
for (var k in RHYMEBOOKS){
  var op = document.createElement('option');
  op.innerHTML = k
  op.value = k
  rhymebookDom.appendChild(op);
}


function updateSelectRhymeGroup(){
  var sel = document.getElementsByClassName("selectRhymeGroup")[0]
  sel.innerHTML = "";
  var book = RHYMEBOOKS[rhymebookDom.value]
  for (var i = 0; i < book.length; i++){
    for (var j = 0; j < book[i].length; j++){
      var k = book[i][j][0];
      var op = document.createElement('option');
      op.innerHTML = k
      op.value = i+","+j
      sel.appendChild(op);
    }
  }
  updateViewRhymeGroup();
  sel.onchange = updateViewRhymeGroup;
}

function updateViewRhymeGroup(){
  var div = document.getElementsByClassName("panelMain")[0]
  var sel = document.getElementsByClassName("selectRhymeGroup")[0]
  var inp = document.getElementsByClassName("searchInput")[0]
  var dic = document.getElementsByClassName("panelDict")[0]

  var [i,j] = sel.value.split(",");
  div.innerHTML = "";
  RHYMEBOOKS[rhymebookDom.value][i][j].split('').map(function(x){
    var sp = document.createElement("span");
    sp.classList.add("panelChar")
    if (x==inp.value){
      sp.style = `color:var(--color-text-hl); font-weight:bold;`;
    }
    sp.innerHTML = x;
    sp.onclick = function(){
      var expl = KANGXI[x] || "查无此字"
      dic.innerHTML = `<span style="color:var(--color-text-hl)">${x}</span>&nbsp;`+expl;
    }
    div.appendChild(sp);
  });
}
function updateSearchForRhymeGroup(){
  
  var inp = document.getElementsByClassName("searchInput")[0]
  var sel = document.getElementsByClassName("selectRhymeGroup")[0]

  var book = RHYMEBOOKS[rhymebookDom.value]
  for (var i = 0; i < book.length; i++){
    for (var j = 0; j < book[i].length; j++){
      var k = book[i][j].indexOf(inp.value[0])
      if (k != -1){
        sel.value = i+","+j
        break
      }
    }
  }
  updateViewRhymeGroup();
}
var cachedSearchRhymeGroupValue = "";
setInterval(function(){
  var inp = document.getElementsByClassName("searchInput")[0]
  if (inp.value.length && inp.value != cachedSearchRhymeGroupValue){
    cachedSearchRhymeGroupValue = inp.value
    updateViewRhymeGroup();
  }
},100)
document.getElementsByClassName("searchInput")[0].onkeypress = function(e){if (e.key=="Enter"){updateSearchForRhymeGroup()}};
document.getElementsByClassName("searchInput")[0].onfocus = function(){bogusFocusChange = true}
updateSelectRhymeGroup();



var btnOpenPanel = document.getElementsByClassName("btnOpenPanel")[0];
var panelDom = document.getElementsByClassName("panel")[0]
var iconLeft = makeIcon({name:"left",width:12,height:12,stroke:5,color:"--color-text-dim"});
var iconRight = makeIcon({name:"right",width:12,height:12,stroke:5,color:"--color-text-dim"});
btnOpenPanel.innerHTML = iconLeft
btnOpenPanel.onclick = function(){
  panelOpen = !panelOpen;
  if (panelOpen){
    btnOpenPanel.innerHTML = iconRight;
    panelDom.classList.remove("panelHidden")
    mainDom.classList.add("mainSided");
  }else{
    btnOpenPanel.innerHTML = iconLeft;
    panelDom.classList.add("panelHidden")
    mainDom.classList.remove("mainSided");
  }
}
function loadNotebook(path){
  notebook = loadJSON(path);
  cellDoms = []
  lastFocusTextDom = undefined;
  mainDom.innerHTML = "";
  for (var i = 0; i < notebook.cells.length; i++){
    insertCellFromNotebook(cellDoms.length, notebook.cells[i]);
  }
  if (!notebook.cells.length){
    insertCell(0,"");
  }
  focusOnCellByIndex(0);
  console.log(notebook)
}

loadNotebook("/savefiles/mypoems.json")

function onTextFocus(that){
  console.log(JSON.stringify(notebook),that)
  if (!bogusFocusChange){
    var idx = cellDoms.map(x=>x.getElementsByClassName("textArea")[0]).indexOf(that);
    meterDom.value = notebook.cells[idx].meter;
    rhymebookDom.value = notebook.cells[idx].rhymebook;
    updateSelectRhymeGroup();
  }
  bogusFocusChange = false;
}

function getCurrentCellIndex(){
  return cellDoms.map(x=>x.getElementsByClassName("textArea")[0]).indexOf(lastFocusTextDom);
}
function focusOnCellByIndex(idx){
  cellDoms[idx].getElementsByClassName("textArea")[0].focus();
}

function insertCellFromNotebook(idx,cell){
  var cellDom = document.createElement("div");
  cellDom.classList.add("cell");
  cellDom.innerHTML =`
    <table class="cellInner${cell.text.length ? "" : " cellInnerEmpty"}"><tr>
      <td class="textArea" contenteditable="true" onfocus="onTextFocus(this)">
        ${cell.text.replace(/[\n\r]/g,"<br>")}
      </td>
      <td class="preview">
      </td>
    </tr></table>
  `
  cellDom.addEventListener("paste", function(e) {
    e.preventDefault();
    var text = e.clipboardData.getData("text/plain");
    text = text.replace(/[ 　　　\t]/g,'').replace(/[\n\r]/,'<br>')
    document.execCommand("insertHTML", false, text);
  })
  cellDom.addEventListener("keypress", function(e){
    if (e.key == "Enter" && event.ctrlKey){
      var jdx = cellDoms.indexOf(cellDom)+1
      if ((!cellDoms[jdx]) || (cellDoms[jdx].getElementsByClassName("textArea")[0].innerText.length)){
        insertCell(jdx,'');
      }
      cellDoms[jdx].getElementsByClassName("textArea")[0].focus();
      lastFocusTextDom = cellDoms[jdx]
    }
  })
  if (!cellDoms.length){
    mainDom.appendChild(cellDom);
  }else{
    mainDom.insertBefore(cellDom,cellDoms[idx]);
  }
  cellDoms.splice(idx,0,cellDom);
  return cellDom
}


function insertCell(idx,text){
  var cell = {meter:"五律平起首句不入韵",rhymebook:'平水韵',text:text}
  var cellDom = insertCellFromNotebook(idx,cell);
  notebook.cells.push(cell);
}

var menuFunctions = {
  removeCell: function(idx){
    mainDom.removeChild(cellDoms[idx])
    notebook.cells.splice(idx,1);
    cellDoms.splice(idx,1);
  },
  insertCellBefore: function(){
    var idx = Math.max(0,getCurrentCellIndex());
    insertCell(idx,'')
    focusOnCellByIndex(idx);
  },
  insertCellAfter: function(){
    var idx = Math.min(cellDoms.length,getCurrentCellIndex()+1);
    insertCell(idx,'')
    focusOnCellByIndex(idx);
  },
  deleteCell: function(){
    if (confirm("This action is not undoable. 此操作不容悔改。")){
      removeCell(Math.min(0,cellDoms.indexOf(lastFocusTextDom)));
    }
  },
  embedBow: function(){
    openAnalytics({op:"EMBEDBOW"})
  },
  lineNN: function(){
    openAnalytics({op:"LINENN"})
  },
}

function updateCell(idx){
  var cellDom = cellDoms[idx];
  var textArea = cellDom.getElementsByClassName("textArea")[0];
  var preview = cellDom.getElementsByClassName("preview")[0];
  var text = textArea.innerText;
  notebook.cells[idx].text = text;
  var meter = METERS[notebook.cells[idx].meter];

  if (text.length || getCurrentCellIndex() == idx){
    if (cellDom.getElementsByClassName("cellInner")[0].classList.contains("cellInnerEmpty")){
      cellDom.getElementsByClassName("cellInner")[0].classList.remove("cellInnerEmpty")
    }
  }else{
    cellDom.getElementsByClassName("cellInner")[0].classList.add("cellInnerEmpty");
    preview.innerHTML = "";
    return false;
  }

  var meterLines = meter.split(",")
  var textLines = splitTextToLines(text);

  var checkResult = checkMeter(RHYMEBOOKS[notebook.cells[idx].rhymebook],meter,text); var ii = 0;

  var out = "";
  var msgs = [];
  for (var i = 0; i < meterLines.length; i++){
    var chars = [];
    var cntMsg = 0;
    if (i < textLines.length){
      for (const chr of textLines[i]) { chars.push(chr); }
    }
    for (var j = 0; j < meterLines[i].length; j++){
      var filled = (j < chars.length && chars[j].trim().length)

      var m = filled ? getTonePattern(RHYMEBOOKS[notebook.cells[idx].rhymebook],filterTraditionalChars(chars[j]))
                     : parseInt(meterLines[i][j]);

      var icon;

      var w = filled ? 8 : 16;
      var sw = filled ? 6 : 3;

      var iconColor = "--color-icon-hint"
      if (filled){
        if (isMeterValid(checkResult[ii])){
          iconColor = "--color-valid"
        }else if (isMeterWarn(checkResult[ii])){
          iconColor = "--color-warn"
        }else if (isMeterError(checkResult[ii])){
          iconColor = "--color-error"
        }
      }

      if (m <= 0){
        icon = makeIcon({name:"circlehalf",width:w,height:w,stroke:sw,color:iconColor});
      }else if (m % 2 == 0){
        icon = makeIcon({name:"circlefilled",width:w,height:w,stroke:sw,color:iconColor});
      }else{
        icon = makeIcon({name:"circleoutline",width:w,height:w,stroke:sw,color:iconColor});
      }

      if (filled){
        if (isMeterWarn(checkResult[ii])){
          msgs.push({type:'Warn',index:[i,j,cntMsg],text:CONST2STR[checkResult[ii]]});
          cntMsg ++;
        }else if (isMeterError(checkResult[ii])){
          msgs.push({type:'Err',index:[i,j,cntMsg],text:CONST2STR[checkResult[ii]]});
          cntMsg ++;
        }

        out += `<div class="charCellWrapper">
                  <div class="charCell charCellFilled">
                    ${chars[j]}<div class="meterIconWrapper meterIconWrapperCorner">${icon}</div>
                  </div>
                </div>`
      }else{
        out += `<div class="charCellWrapper">
                  <div class="charCell charCellEmpty">
                    &nbsp;<div class="meterIconWrapper">${icon}</div>
                  </div>
                </div>`
      }

      ii ++;
    }
    out += "<br>"
  }
  var lastY = 0;
  var pl = 10;
  var pt = 5;
  var h = 38;
  var w = 38;
  var hh = h/3;
  for (var i = 0; i < msgs.length; i++){
    var y = Math.max(lastY+hh,pt+msgs[i].index[0]*h+msgs[i].index[2]*hh);
    var y1 = y+hh;
    var y0 = pt+h*msgs[i].index[0]+10;
    var l = Math.floor((y1-y0)*Math.sqrt(2)+1);
    var x0 = pl+w*msgs[i].index[1]+32;
    var x1 = x0+(y1-y0);
    out += `<div class="meterMsg meterMsg${msgs[i].type}"
              style="top:${Math.round(y)}px">
              ${msgs[i].text}
            </div>`
    out += `<div class="drawLine drawLine${msgs[i].type}"
              style="top:${y0}px;left:${x0}px;width:${l}px;transform:rotate(${45}deg)"></div>`
    out += `<div class="drawLine drawLine${msgs[i].type}"
              style="top:${y1}px;left:${x1}px;width:${preview.offsetWidth-x1}px;"></div>`
    lastY = y;
  }
  preview.innerHTML = out;
  return true;
}

function update(){
  var lastCellFilled;
  for (var idx = 0; idx < cellDoms.length; idx++){
    lastCellFilled = updateCell(idx);
  }
  if (lastCellFilled){
    insertCell(cellDoms.length,'')
  }
  if (document.activeElement.classList.contains("textArea")){
    lastFocusTextDom = document.activeElement;
  }
}

function autosave(){
  writeFile("savefiles/mypoems.json",JSON.stringify(notebook));
}

function openAnalytics(options){

  var textLines = splitTextToLines(notebook.cells[getCurrentCellIndex()].text);
  var data = textLines.join('。');
  // var data = notebook.cells[getCurrentCellIndex()].text
  var qstr = "q="+data
  for (var k in options){
    qstr += "&"+k+"="+options[k];
  }

  window.open(
    './analytics.html?'+qstr,
    'COPE Analytics',
    'height=600,width=600,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes'
  )
}

setInterval(update,200);
setInterval(autosave,2000);
