const fs = require('fs')
function loadJSON(path){
  return JSON.parse(fs.readFileSync(path));
}
function writeFile(path,text){
  fs.writeFile(path,text,function(){});
}