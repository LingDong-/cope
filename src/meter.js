function getTonePattern(book,chr){
  var ret = [];
  for (var i = 0; i < book.length; i++){
    for (var j = 0; j < book[i].length; j++){
      if (book[i][j].includes(chr)){
        ret.push(i);
      }
    }
  }
  if (ret.length == 0){
    return TONE_NOT_FOUND
  }
  if (ret.length > 1){
    var s = 0;
    for (var i = 0; i < ret.length; i++){
      s += ret[i]
    }
    if (s == 0){
      return TONE_LEVEL
    }
    if (s == ret.length){
      return TONE_OBLIQUE
    }
    return TONE_EITHER
  }
  return ret[0]+1
}

function getRhymeGroup(book,chr){
  var ret = []
  for (var i = 0; i < book.length; i++){
    for (var j = 0; j < book[i].length; j++){
      if (book[i][j].includes(chr)){
        ret.push(book[i][j][0]);
      }
    }
  }
  return ret;
}

function getRhymeGroupMode(book,chrs){
  var scoreboard = {}
  for (var i = 0; i < chrs.length; i++){
    var rhymes = getRhymeGroup(book,chrs[i])
    for (var j = 0; j < rhymes.length; j++){
      if (! (rhymes[j] in scoreboard)){
        scoreboard[rhymes[j]] = 0;
      }
      scoreboard[rhymes[j]] ++;
    }
  }
  var mk;
  var mv = 0;
  for (var k in scoreboard){
    if (scoreboard[k] > mv){
      mv = scoreboard[k]
      mk = k
    }
  }
  return mk;
}


function filterTraditionalChars(text){
  var out = ""
  for (const chr of text){
    var sc = TC2SC[chr]
    if (sc){
      out += sc
    }else{
      out += chr
    }
  }
  return out;
}

function splitTextToLines(text){
  return text.replace(/[。，？！\n]/g,"\n").split("\n").filter(x=>x.length && !x.startsWith("#"));
}

function checkMeter(rhymebook,meter,text){
  text = filterTraditionalChars(text);
  var meterLines = meter.split(",")
  var textLines = splitTextToLines(text);

  var lasts = [];
  for (var i = 0; i < meterLines.length; i++){
    var chars = [];
    if (i >= textLines.length){
      continue;
    }
    for (const chr of textLines[i]) { chars.push(chr); }
    if (meterLines[i][chars.length-1] > 2){
      lasts.push(chars[chars.length-1]);
    }
  }
  var rhymeGroup = getRhymeGroupMode(rhymebook,lasts);

  var out = [];
  for (var i = 0; i < meterLines.length; i++){
    var chars = [];
    if (i < textLines.length){
      for (const chr of textLines[i]) { chars.push(chr); }
    }
    var n = meterLines[i].length;
    for (var j = 0; j < n; j++){
      var standard = parseInt(meterLines[i][j]);
      var filled = (j < chars.length && chars[j].trim().length)

      function check(chars,j){
        if (filled){
          var t = getTonePattern(rhymebook, chars[j])
          if (standard > 2 && chars[j]!= undefined && rhymeGroup != undefined){
            if (!getRhymeGroup(rhymebook,chars[j]).includes(rhymeGroup)){
              return METER_ERR_NO_RHYME;
            }
          }
          if (standard == TONE_EITHER){
            return METER_VALID
          }else if (t == TONE_LEVEL && (standard == TONE_LEVEL || standard == TONE_LEVEL_RHYME)){
            return METER_VALID
          }else if (t == TONE_OBLIQUE && (standard == TONE_OBLIQUE || standard == TONE_OBLIQUE_RHYME)){
            return METER_VALID
          }else if (j % 2 == 0 && j != n -1 ){
            if (j == n-3 && t == TONE_LEVEL){
              var t1 = chars[j+1] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j+1]);
              var t2 = chars[j+2] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j+2]);
              if (t1 == 1 && t2 == 1){
                return METER_ERR_THREE_LEVEL_END;
              }
            }else if (t == TONE_OBLIQUE){
              var t_3 = chars[j-3] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j-3]);
              var t_2 = chars[j-2] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j-2]);
              var t_1 = chars[j-1] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j-1]);
              var t1  = chars[j+1] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j+1]);
              var t2  = chars[j+2] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j+2]);
              var t3  = chars[j+3] == undefined ? TONE_NOT_A_CHAR : getTonePattern(rhymebook, chars[j+3]);

              function o(x){
                return x == TONE_NOT_A_CHAR || x == TONE_OBLIQUE
              }
              function l(x){
                return x == TONE_LEVEL
              }
              if (o(t_3) && o(t_2) && l(t_1) && o(t) && l(t1)){
                return METER_ERR_ISOLATED_LEVEL
              }else if (o(t_1) && o(t) && l(t1) && o(t2) && o(t3)){
                return METER_ERR_ISOLATED_LEVEL
              }
            }else{
              return METER_VALID
            }
          }else if (t == TONE_EITHER){
            return METER_WARN_HETERONYM
          }else if (t == TONE_NOT_FOUND){
            return METER_WARN_TONE_NOT_FOUND
          }else{
            return METER_ERR_WRONG_TONE
          }
          
          return METER_VALID

        }else{
          return METER_NOT_FILLED
        }
      }
      out.push(check(chars,j));
    }
  }
  return out;
}