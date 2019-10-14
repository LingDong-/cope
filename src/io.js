const fs = require('fs')
function loadJSON(path){
  return JSON.parse(fs.readFileSync(path));
}
function loadTSV(path){
  return fs.readFileSync(path).toString().split("\n").filter(x=>x.length).map(x=>x.split("\t").map(y=>isNaN(parseFloat(y))?y:parseFloat(y)));
}
function writeFile(path,text){
  fs.writeFile(path,text,function(){});
}