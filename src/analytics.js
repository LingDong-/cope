const {UMAP} = require('umap-js');
var distMetric = "euc"//"chi2"
var poetsBow = loadJSON("/data/poets-bow.json")
var charsFreq = loadTSV("/data/chars-freq.tsv")
var charsOI = charsFreq.map(x=>x[0]);
var poemLines = undefined

const K = 1024
const NP = 256
const NNN = 10

function parseUrlQuery(){
  var x = window.location.href.split("?")[1].split("&").map(u=>u.split("="))
  console.log(x)
  var options = {}
  for (var i = 0; i < x.length; i++){
    options[x[i][0]]=decodeURI(x[i][1])
  }
  console.log(options)
  return options
}

function dist(a,b){
  if (distMetric == "euc"){
    var s = 0;
    for (var i = 0; i < a.length; i++){
      s += Math.pow(a[i]-b[i],2);
    }
    return Math.sqrt(s);
  }else if (distMetric == "chi2"){
    var s = 0;
    for (var i = 0; i < a.length; i++){
      s += Math.pow(a[i]-b[i],2)/(a[i]+b[i] == 0 ? 1 : a[i]+b[i]);
    }
    return s;
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function makeBow(dat){
  var bow = new Array(K).fill(0);
  for (const chr of dat){
    if (chr.charCodeAt(0)<19968 || 40959<chr.charCodeAt(0)){
      continue
    }
    var idx = charsOI.indexOf(chr)
    if (idx < 0){
      idx += bow.length
    }
    bow[idx]++;
  }
  var s = 0;
  for (var j = 0; j < bow.length; j++){
    bow[j] = bow[j]/charsFreq[j][1]
    s += bow[j]
  }
  for (var j = 0; j < bow.length; j++){
    bow[j]/=s
  }
  
  return bow
}

function makePrediction(x){
  var ds = []
  var names = Object.keys(poetsBow);
  for (var p in poetsBow){
    if (names.includes(p)){
      var d = dist(poetsBow[p],x);
      ds.push([p,d])
    }
  }
  ds.sort((a,b)=>(a[1]-b[1]));
  var out = ""
  
  var m = (Math.sqrt(2)-ds[0][1])/Math.sqrt(2);
  for (var i = 0; i < NNN; i++){
    var t = (1-(ds[i][1]-ds[0][1])/(ds[ds.length-1][1]-ds[0][1]))*m;
    out += `<div>${ds[i][0].padEnd(4,String.fromCharCode(0x3000))}${(t*100).toFixed(2)}% <span style="display:inline-block;background:var(--color-valid);width:${Math.floor(t*100)}px;height:3px;border-radius:4px;transform:translate(0px,-2px);"></span></div>`
  }

  document.getElementsByClassName("nearestNeighborContainer")[0].innerHTML = out
  return ds;
}

function doUMAP(lines){
  var X = []
  var labels = []
  for (var k in poetsBow){
    labels.push(k)
    X.push(poetsBow[k].map(x=>x*100))
  }
  X.push()
  const umap = new UMAP({nNeighbors: NNN});
  const nEpochs = umap.initializeFit(X);
  console.log(nEpochs);
  var i = 0
  function step(){
    if (i > nEpochs){
      document.getElementsByClassName("progressBar")[0].style.width = `0%`
      return;
    }
    setTimeout(step,10);
    umap.step();
    const Y= umap.getEmbedding();
    document.getElementsByClassName("embeddingContainer")[0].innerHTML = drawEmbedding(Y,labels,lines,800,800);
    var c = document.getElementsByClassName("embeddingPointHl")[0]
    if (c){
      c.scrollIntoView();
    }

    i ++;
    document.getElementsByClassName("progressBar")[0].style.width = `${Math.ceil(i/nEpochs*100)}%`
  }
  step();
}

function drawEmbedding(Y,labels,lines,w,h){
  var out = ""
  var xmin = Infinity
  var xmax = -Infinity
  var ymin = Infinity
  var ymax = -Infinity
  for (var i = 0; i < Y.length; i++){
    var y = [Y[i][0],Y[i][1]]
    xmin = Math.min(xmin,y[0]);
    xmax = Math.max(xmax,y[0]);
    ymin = Math.min(ymin,y[1]);
    ymax = Math.max(ymax,y[1]);
  }
  var p = 40;
  var Yt =[]
  for (var i = 0; i < Y.length; i++){
    var y = [p+(Y[i][0]-xmin)*(w-p-p)/(xmax-xmin),p+(Y[i][1]-ymin)*(h-p-p)/(ymax-ymin)]
    Yt.push(y)
    out += `<div class="embeddingPoint${labels[i] == "我"?" embeddingPointHl":""}" style="left:${y[0]}px;top:${y[1]}px;"><div style="position:absolute;left:2px;top:1px;width:50px;height:10px;pointer-events:none">${labels[i]}</div></div>`
  }
  for (var i = 0; i < lines.length; i++){
    var [x0,y0] = Yt[labels.indexOf(lines[i][0])]
    var [x1,y1] = Yt[labels.indexOf(lines[i][1])]

    var l = Math.sqrt(Math.pow(x0-x1,2)+Math.pow(y0-y1,2))
    var a = Math.atan2(y1-y0,x1-x0)*180/Math.PI
    out += `<div class="drawLine drawLineWarn"
              style="top:${y0}px;left:${x0}px;width:${l}px;transform:rotate(${a}deg)"></div>`
  }
  return `<div style="width:${w}px;height:${h}px">${out}</div>`

}

function makeBowObj(dat){
  var bow = {};
  for (const chr of dat){
    if (chr.charCodeAt(0)<19968 || 40959<chr.charCodeAt(0)){
      continue
    }
    if (!(chr in bow)){
      bow[chr]=0
    }
    bow[chr]++;
  }
  return bow
}

function doLineNN(text){
  console.log(text)
  var ls = splitTextToLines(text);
  var lls = []
  for (var j = 0; j < ls.length; j+=2){
    if (j+1>=ls.length){
      break
    }
    ls[j] = ls[j].trim();
    ls[j+1] = ls[j+1].trim();
    if (ls[j].length == ls[j+1].length && (ls[j].length == 5 || ls[j].length == 7)){
      lls.push(ls[j]+ls[j+1])
    }
  }
  var divs = []
  for (var _i = 0; _i < lls.length; _i++){
    var _b0 = makeBowObj(filterTraditionalChars(lls[_i]));
    var dss = Array(lls.length).fill(0).map(x=>[])
    var div = document.createElement("div");
    document.getElementsByClassName("main")[0].appendChild(div);
    divs.push(div)

    function scope(){
      var j = 0;
      var i = _i;
      var b0 = JSON.parse(JSON.stringify(_b0));
      function doit(){
        if (j % 200 == 0){
          callback(lls[i],i,dss[i])
        }
        if (j >= poemLines.length){
          callback(lls[i],i,dss[i])
          console.log(lls[i],ds)
          return;
        }
        setTimeout(doit,1);

        poemLines[j].bows = []
        for (var k = 0; k < poemLines[j].data.length; k++){
          if (poemLines[j].data[k].length == lls[i].length){
            var b1;
            if (poemLines[j].bows[k] == undefined){
              b1 = makeBowObj(poemLines[j].data[k])
              poemLines[j].bows[k] = b1
            }else{
              b1 = poemLines[j].bows[k]
            }
            var d = 0;
            var bb = Object.keys(b0).concat(Object.keys(b1))
            for (var l = 0; l < bb.length; l++){
              var x = b0[bb[l]];
              var y = b1[bb[l]];
              if (x && y){

                if (x == y){
                  d += x*y
                }else{
                  d += Math.min(x,y)/Math.max(x,y);
                }
                var ci = charsOI.indexOf(bb[l])
                if (ci >= 0){
                  d += (1-Math.min(charsFreq[ci][1]/10000,1))*0.19
                }else{
                  // console.log(bb[l])
                  d += 0.2
                }
              }
            }
            dss[i].push([[poemLines[j].title,poemLines[j].author,poemLines[j].data[k]],d])
          }
        }
        j++;
        document.getElementsByClassName("progressBar")[0].style.width = `${Math.ceil(j/poemLines.length*100)}%`
      }
      doit()
    }
    scope();
  }
  function callback(line,i,ds){
    ds.sort((a,b)=>(b[1]-a[1]))
    // console.log(line)
    // console.log(ds.slice(0,10))
    var m = line.length/2;
    var out = `<table style="font-size:13px;white-space:nowrap;word-break:keep-all;"><tr style="color:var(--color-text);"><td></td><td>${line.slice(0,m)} ${line.slice(m)}</td><td></td></tr>`;
    for (var j = 0; j < Math.min(7,ds.length); j++){
      out += `<tr style="color:var(--color-text-dimmer);"><td style="font-family:monospace;">${(ds[j][1]/(line.length*2)*100).toFixed(2).padStart(6,String.fromCharCode(0x00A0))}%</td><td style="color:var(--color-text-dim);">${ds[j][0][2].slice(0,m)} ${ds[j][0][2].slice(m)}</td><td>(${ds[j][0][1]} ${ds[j][0][0]})</td></tr>`;
    }
    out += "</table>"
    divs[i].innerHTML = out
  }
}

function markovSolve(nodes, order, refLines, legalFun, useCorresp=false, searchK=10){
  var [refLinesText,refLinesWeight] = refLines;

  function normalizeProbDist(x){
    var s = 0;
    for (var k in x){
      s += x[k]
    }
    for (var k in x){
      x[k]/=s
    }
  }

  function searchNext(x,dir){
    var scoreboard = {}
    for (var i = 0; i < refLinesText.length; i++){
      for (var j = 0; j < refLinesText[i].length; j++){
        if (refLinesText[i][j] == x){
          var k = j;
          if (dir[0] != 0){
            k = (j < refLinesText[i].length/2) ? (j+refLinesText[i].length/2) : (j-refLinesText[i].length/2)
          }
          var next = refLinesText[i][k+dir[1]]
          if (next){
            if (!scoreboard[next]){
              scoreboard[next] = 0
            }
            scoreboard[next]+=refLinesWeight[i]
          }
        }
      }
    }
    normalizeProbDist(scoreboard);
    return scoreboard;
  }

  function mergeProbDist(x0,x1){
    var keys = Object.keys(x0).concat(Object.keys(x1))
    var y = {}
    for (var i = 0; i < keys.length; i++){
      var p = (keys[i] in x0) ? x0[keys[i]] : 0
      var q = (keys[i] in x1) ? x1[keys[i]] : 0
      var r = p*q;
      if (r != 0){
        y[keys[i]] = r;
      }
    }
    return y
  }

  function subInCopy(nodes,i,char){
    var nnodes = nodes.slice()
    nnodes[i] = {valid:true, char:char}
    if (nodes[i].isLast){
      nnodes[i].isLast = true;
    }
    return nnodes;
  }

  function getCorresp(nodes,i0){
    var nlines = 0;
    var ilines = 0;
    var lens = [];
    var n = 1;
    for (var i = 0; i < nodes.length; i++){
      if (nodes[i].isLast){
        lens.push(n);
        nlines ++;
        if (i < i0){
          ilines ++;
        }
        n = 0;
      }
      n++;
    }
    // console.log(lens);
    if (ilines % 2 == 0){
      if (lens[ilines]==lens[ilines+1]){
        return nodes[i0+lens[ilines]]
      }
    }else{
      if (lens[ilines-1]==lens[ilines]){
        return nodes[i0-lens[ilines]]
      }
    }
  }

  var solutions = []

  for (var o = 0; o < order.length; o++){
    var i = order[o];
    if (nodes[i].valid == false){
      // console.log(i,nodes[i])
      var prev = nodes[i-1]
      var next = nodes[i+1]
      var crsp = getCorresp(nodes,i);

      var p;
      var gotCoresp = false
      if (useCorresp && !nodes[i].rhyme && crsp && crsp.valid){
        var r = searchNext(crsp.char,[1,0])
        var re = Object.entries(r);
        re.sort((a,b)=>(b[1]-a[1]));
        // console.log(crsp.char,re)
        if (Object.keys(r).length>searchK){
          p = r;
          normalizeProbDist(p);
          gotCoresp = true;
        }
      }
      if (useCorresp != 2 || !gotCoresp){
        if (prev && prev.valid){
          var q = searchNext(nodes[i-1].char,[0,1])
          if (prev.isLast){
            for (var k in q){
              q[k] = q[k]*0.5+0.5
            }
          }
          if (p){
            p = mergeProbDist(p, q)
            normalizeProbDist(p);
          }else{
            p = q;
          }
        }
        if (next && next.valid && !nodes[i].isLast){
          var q = searchNext(nodes[i+1].char,[0,-1])
          if (p){
            p = mergeProbDist(p, q)
            normalizeProbDist(p);
          }else{
            p = q;
          }
        }
      }
      


      var pe = [];
      if (p /*&& Object.keys(p).length*/){
        pe = Object.entries(p);
        if (nodes[i].rhyme){
          pe = pe.filter(x=>nodes[i].rhyme(x[0]));
        }
        pe = pe.map(x=>([x[0],x[1]*(Math.random())]))
        pe.sort((a,b)=>(b[1]-a[1]));
        
      }else{
        pe = charsFreq.slice(0,-1);
        shuffle(pe)// pe.sort(() => Math.random() - 0.5);
      }

      for (var j = 0; j < Math.min(searchK*(nodes[i].isLast?2:1),pe.length); j++){
        var nnodes = subInCopy(nodes,i,pe[j][0])
        var o = nnodes.map(x=>x.char?x.char:"*")
        try{
          postMessage({progress:i,data:o})
        }catch(e){
          //not in worker context;
          console.log(o.join(""),i)
        }
        
        var todo = order.slice(o+1);
        if (legalFun(nnodes,i,todo)){
          solutions=solutions.concat(markovSolve(nnodes,todo,refLines,legalFun,useCorresp,searchK));
        }
        if (solutions.length){
          break;
        }
      }
      return solutions

    }
  }
  return [nodes.slice()];
}

function doMarkovSug(rhymebook,meter,text,useCorresp=0,fillRhymeFirst=0,authors=[]){
  // alert(JSON.stringify({text,useCorresp,authors}))
  var text = filterTraditionalChars(text);
  var textLines = splitTextToLines(text).map(x=>x.trim())

  var text = textLines.join("。");
  var checkResult = checkMeter(rhymebook,meter,text); var ii = 0;
  var nodes = []
  var meterLines = meter.split(',')
  var rhymeGroup = inferRhymeGroupFromText(rhymebook,meter,text);
  if (getTonePattern(rhymebook,rhymeGroup)==TONE_OBLIQUE){
    rhymeGroup = undefined;
  }
  console.log(rhymeGroup);
  for (var i = 0; i < meterLines.length; i++){
    for (var j = 0; j < meterLines[i].length; j++){
      var chr = textLines[i] ? textLines[i][j] : undefined;
      var info;
      if (!chr || chr.charCodeAt(0)<19968 || 40959<chr.charCodeAt(0) || isMeterError(checkResult[ii])){
        info = {valid:false,tone:meterLines[i][j]};
      }else{
        info = {valid:true,char:chr};
      }
      if (j == meterLines[i].length-1){
        info.isLast = true;
      }
      if (meterLines[i][j] > 2){
        info.rhyme=function(x){if (!rhymeGroup) return true; return getRhymeGroup(rhymebook,x).includes(rhymeGroup)};
      }
      nodes.push(info)
      ii++;
    }
  }
  var refLinesText = [];
  var refLinesWeight = [];
  var refLines = [];
  for (var i = 0; i < poemLines.length; i++){
    for (var j = 0; j < poemLines[i].data.length; j++){
      var chrs = []
      for (var k of poemLines[i].data[j]){
        chrs.push(k)
      }
      refLinesText.push(chrs);
      if (authors.includes(poemLines[i].author)){
        refLinesWeight.push(1);
      }else{
        refLinesWeight.push(0.01);
      }
    }
  }
  refLines = [refLinesText,refLinesWeight];
  console.log(refLines)

  function nodesToText(nnodes){
    var t = ""
    var ii = 0;
    for (var i = 0; i < meterLines.length; i++){
      for (var j = 0; j < meterLines[i].length; j++){
        t += nnodes[ii].char || "*";
        ii++;
      }
      t += "\n"
    }
    return t;
  }
  function legalFun(nnodes,idx,todo){
    var t = nodesToText(nnodes)
    var checkResult = checkMeter(rhymebook,meter,t)
    // return !isMeterError(checkResult[idx]);
    for (var i = 0; i < nnodes.length; i++){
      if (!todo.includes(i) && isMeterError(checkResult[i])){
        if (nodes[i].valid == false){
          // console.log("BAD!",nodes[i],CONST2STR[checkResult[i]])
          return false;
        }
      }
    }
    if (!isMeterValid(checkResult[idx])){
      return false;
    }
    return true;
  }
  var order = []
  if (fillRhymeFirst){
    var ii = 0;
    for (var i = 0; i < meterLines.length; i++){
      for (var j = 0; j < meterLines[i].length; j++){
        if (j == meterLines[i].length-1 && meterLines[i][j] > 2){
          order.push(ii)
        }
        ii++;
      }
    }
  }
  for (var i = 0; i < nodes.length; i++){
    if (!order.includes(i)){
      order.push(i)
    }
  }
  var results = markovSolve(nodes, order, refLines, legalFun, useCorresp);
  if (!results.length){
    // return []
    return doMarkovSug(rhymebook,meter,text,useCorresp,fillRhymeFirst,authors)
  }
  var goodResults = []
  for (var ix = 0; ix < results.length; ix++){
    var t = nodesToText(results[ix]);
    var checkResult = checkMeter(rhymebook,meter,t);
    var ok = true;
    for (var i = 0; i < checkResult.length; i++){
      if (isMeterError(checkResult[i])){
        ok = false;
        break;
      }
    }
    if (ok){
      goodResults.push(t)
    }
  }
  if (goodResults.length){
    return goodResults;
  }else{
    return doMarkovSug(rhymebook,meter,nodesToText(results[0]), useCorresp,fillRhymeFirst,authors)
  }
}

var drawMarkovSug = function(rhymebook,meter,text,ret){
  var meterLines = meter.split(",")
  var textLines = splitTextToLines(text)

  var p = ret.data.filter(x=>x!="*").length/ret.data.length;
  if (ret.progress == -1){
    p = 0;
  }
  document.getElementsByClassName("progressBar")[0].style.width = Math.floor(100*p)+"%";
  
  var ii;

  var checkResult = checkMeter(rhymebook,meter,text);

  var tdstyle = `valign="top" style="background:rgba(0,0,0,0.1);"`
  var chstyle = `display:inline-block;font-size:16px;
        width:20px !important;height:20px !important;line-height:20px;
        text-align:center;
        margin:2px;`

  var result = `<table style="margin-top:15px"><tr><td ${tdstyle}>`;

  ii = 0;
  for (var i = 0; i < meterLines.length; i++){
    var chrs = []
    if (textLines[i]){
      for (ch of textLines[i]){
        chrs.push(ch)
      }
    }
    for (var j = 0; j < meterLines[i].length; j++){
      var s = ""
      if (isMeterError(checkResult[ii])){
        s = "background:var(--color-error-bg);"
      }else if (ret.data[ii]!=chrs[j] && ret.data[ii]!=undefined){
        s = "background:var(--color-warn-bg);"
      }
      result+=`<span style="
        ${chstyle}
        color:var(--color-text);
        ${s}
      ">${(chrs[j]==undefined||chrs[j]==" ")?"&nbsp;":chrs[j]}</span>`;
      ii++;
    }
    result+="<br>"
  }

  result+=`</td><td style="width:35px;padding-left:5px">${makeIcon({name:"right",width:24,height:24,stroke:1,color:"--color-text"})}</td><td ${tdstyle}>`

  ii = 0;
  for (var i = 0; i < meterLines.length; i++){
    for (var j = 0; j < meterLines[i].length; j++){
      var s="color:var(--color-text);"
      if (ii == ret.progress){
        s="color:var(--color-text-hl);font-weight:bold;"
      }
      result+=`<span style="
        ${chstyle}
        ${s}
      ">${(ret.data[ii]=="*"||ret.data[ii]==undefined)?"&nbsp;":ret.data[ii]}</span>`;
      ii++;
    }
    result+="<br>"
  }
  result += "</td></tr></table>"
  return result;
}

var markovSugWorkerCode = function(){
  var options = {}
  onmessage = function(e){
    if (e.data.op == "init"){
      options=Object.assign({},e.data.options);
      main();
    }
  }
  function main(){
    var result = doMarkovSug(
      options.rhymebook,
      options.meter,
      options.text,
      options.useCorresp,
      options.fillRhymeFirst,
      options.authors
    )[0];
    postMessage({progress:'done',data:result})
  }
}

var globalsToString = function(libraryGlobals){
  var result = ";;;";
  for (var i = 0; i < libraryGlobals.length; i++){
    if (!libraryGlobals[i].length){
      continue;
    }
    var str = ""
    var obj = window[libraryGlobals[i]]
    try{
      if (obj == undefined){
        obj = eval(libraryGlobals[i])
      }
      if (obj == undefined){
        str = "undefined"
      }else if (typeof obj == 'object'){
        str = JSON.stringify(obj)
      }else{
        str = obj.toString();
      }
    }catch(e){
      continue;
    }
    result+=";var "+libraryGlobals[i]+"="+str
  }
  return result+";;;";
}

var options = parseUrlQuery()

var progressDiv = document.createElement("div");
document.body.append(progressDiv);
progressDiv.classList.add("progressBar");

if (options.op == "EMBEDBOW"){
  poetsBow = Object.fromEntries(Object.entries(poetsBow).slice(0,NP));
  var text = splitTextToLines(options.q).join('')
  var bow = makeBow(filterTraditionalChars(text))

  var embedDiv = document.createElement("div");
  document.getElementsByClassName("main")[0].append(embedDiv);
  embedDiv.classList.add("embeddingContainer")

  var nnDiv = document.createElement("div");
  document.getElementsByClassName("main")[0].append(nnDiv);
  nnDiv.classList.add("nearestNeighborContainer")

  var ds = makePrediction(bow);
  var lines = []
  for (var i = 0; i < NNN; i++){
    lines.push(["我",ds[i][0]])
  }
  poetsBow["我"]=bow;
  doUMAP(lines);

}else if (options.op == "LINENN"){
  if (poemLines == undefined){
    poemLines = loadJSON("/data/quantang-lines.json")
  }
  doLineNN(options.q);
  
  

}else if (options.op == "MARKOVSUG"){
  if (poemLines == undefined){
    poemLines = loadJSON("/data/quantang-lines.json")
  }
  var runBtn = document.createElement("button");
  runBtn.innerHTML = "▶"
  document.getElementsByClassName("ribbon")[0].append(runBtn);

  var authorLbl = document.createElement("span");
  authorLbl.innerHTML="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;诗风"
  document.getElementsByClassName("ribbon")[0].append(authorLbl);
  var authorDom = document.createElement("select");
  document.getElementsByClassName("ribbon")[0].append(authorDom);
  var authorChoices = {
    "全唐":[],
    "李白":["李白"],
    "杜甫":["杜甫"],
    "李贺":["李贺"],
    "李商隐":["李商隐"],
    "刘白":["刘禹锡","白居易"],
    "元白":["元稹","白居易"],
    "王孟":["王维","孟浩然"],
    "小李杜":["杜牧","李商隐"],
    "三十六":["李商隐","温庭筠","段成式"],
    "温韦":["温庭筠","韦庄"],
    "沈宋":["沈佺期","宋之问"],
    "高岑":["高适","岑参"],
    "韩柳":["韩愈","柳宗元"],
    "张王":["张藉","王建"],
    "皮陆":["皮日休","陆龟蒙"],
    "卢马":["卢仝","马异"],
    "三罗":["罗隐","罗邺","罗虬"],
    "初唐四杰":["王勃","杨炯","卢照邻","骆宾王"],
    "大历诸子":["卢纶","吉中孚","韩翃","钱起","司空曙","苗发","崔峒","夏侯审","李端","李益"],
    "边塞三王":["王昌龄","王之涣","王翰"],
    "唐诸僧":["寒山","拾得","贯休","齐己","皎然","无可"],
    "唐诸帝":["李世民","李治","李旦","武则天","李隆基","李亨","李豫","李适","李昂","李晔"],
    "唐诸女":["鱼玄机","张太华","李冶","薛涛","刘采春","关盼盼","上官昭容","宜芬公主","徐月英","薛媛","陈玉兰","葛鸦儿"],
  }
  for (var k in authorChoices){
    var op = document.createElement('option');
    op.innerHTML = k
    op.value = k
    authorDom.appendChild(op);
  }

  var correspLbl = document.createElement("span");
  correspLbl.innerHTML="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;对仗"
  document.getElementsByClassName("ribbon")[0].append(correspLbl);
  var correspDom = document.createElement("select");
  document.getElementsByClassName("ribbon")[0].append(correspDom);
  var correspChoices = {
    "随缘":0,
    "尽力":1,
    "强行":2,
  }
  for (var k in correspChoices){
    var op = document.createElement('option');
    op.innerHTML = k
    op.value = k
    correspDom.appendChild(op);
  }

  var markovSugWorkerScript = globalsToString([
    "doMarkovSug","markovSolve","filterTraditionalChars","TC2SC","splitTextToLines","charsFreq","charsOI",
    "checkMeter","_inferRhymeGroupFromText","getRhymeGroupMode","getRhymeGroup","getTonePattern",
    "inferRhymeGroupFromText","isMeterError","isMeterValid","isMeterWarn","poemLines","shuffle",
    "TONE_EITHER","TONE_LEVEL","TONE_OBLIQUE","TONE_LEVEL_RHYME","TONE_OBLIQUE_RHYME","TONE_NOT_FOUND",
    "TONE_NOT_A_CHAR","","METER_NOT_FILLED","METER_VALID","METER_ERR_WRONG_TONE","METER_ERR_THREE_LEVEL_END",
    "METER_ERR_ISOLATED_LEVEL","METER_ERR_NO_RHYME","METER_ERR_DUPLICATE_RHYME","METER_WARN_HETERONYM",
    "METER_WARN_TONE_NOT_FOUND",
  ])
  
  markovSugWorkerScript = markovSugWorkerScript 
    +';('+markovSugWorkerCode.toString()+')();';
  // console.log(markovSugWorkerScript);
  var markovSugWorker = undefined;

  var text = filterTraditionalChars(options.q);

  document.getElementsByClassName("main")[0].innerHTML=drawMarkovSug(RHYMEBOOKS[options.rhymebook],METERS[options.meter],text,{progress:-1,data:[]})

  runBtn.onclick = function(){
    if (markovSugWorker != undefined){
      markovSugWorker.terminate();
    }

    markovSugWorker = new Worker(URL.createObjectURL(new Blob([markovSugWorkerScript])));

    markovSugWorker.postMessage({
      op:'init',
      options:{
        rhymebook:RHYMEBOOKS[options.rhymebook],
        meter:METERS[options.meter],
        text:text,
        useCorresp:correspChoices[correspDom.value],
        authors:authorChoices[authorDom.value],
      }
    })
    markovSugWorker.onmessage = function(e){
      var d = e.data;
      
      if (d.progress=="done"){
        console.log(d.data)
        markovSugWorker.terminate();
        var chrs = []
        for (ch of d.data){
          if (ch != "\n"){
            chrs.push(ch)
          }
        }
        d.data = chrs;
        d.progress = -1;
        document.getElementsByClassName("main")[0].innerHTML=drawMarkovSug(RHYMEBOOKS[options.rhymebook],METERS[options.meter],text,d)
      }else{
        document.getElementsByClassName("main")[0].innerHTML=drawMarkovSug(RHYMEBOOKS[options.rhymebook],METERS[options.meter],text,d)
      }
    }
  }
  

}
