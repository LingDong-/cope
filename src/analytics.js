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
  
  

}
