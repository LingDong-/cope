const fs = require('fs')
function loadJSON(path){
  return JSON.parse(fs.readFileSync(__dirname+'/'+path));
}
function loadTSV(path){
  return fs.readFileSync(__dirname+'/'+path).toString().split("\n").filter(x=>x.length).map(x=>x.split("\t").map(y=>isNaN(parseFloat(y))?y:parseFloat(y)));
}
function writeFile(path,text){
  fs.writeFile(__dirname+'/'+path,text,function(){});
}
function copyFile(path0,path1){
  fs.copyFileSync(__dirname+'/'+path0,__dirname+'/'+path1);
}