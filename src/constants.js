const TONE_EITHER = 0
const TONE_LEVEL = 1
const TONE_OBLIQUE = 2
const TONE_LEVEL_RHYME = 3
const TONE_OBLIQUE_RHYME = 4
const TONE_NOT_FOUND = -1
const TONE_NOT_A_CHAR = -2

const METER_NOT_FILLED = 100
const METER_VALID = 101
const METER_ERR_WRONG_TONE = 99
const METER_ERR_THREE_LEVEL_END = 98
const METER_ERR_ISOLATED_LEVEL = 97
const METER_ERR_NO_RHYME = 96
const METER_ERR_DUPLICATE_RHYME = 95
const METER_WARN_HETERONYM = 111
const METER_WARN_TONE_NOT_FOUND = 112

const isMeterError = (x)=> (x < 100)
const isMeterWarn =  (x)=> (x > 110)
const isMeterValid = (x)=> (110 >= x && x > 100)

const CONST2STR = {}

CONST2STR[METER_NOT_FILLED]= "待填"
CONST2STR[METER_VALID] = "合律"
CONST2STR[METER_WARN_HETERONYM] = "多音字"
CONST2STR[METER_WARN_TONE_NOT_FOUND] = "韵书未录"
CONST2STR[METER_ERR_WRONG_TONE] = "失粘对"
CONST2STR[METER_ERR_THREE_LEVEL_END] = "三平调"
CONST2STR[METER_ERR_ISOLATED_LEVEL] = "孤平"
CONST2STR[METER_ERR_NO_RHYME] = "落韵"
CONST2STR[METER_ERR_DUPLICATE_RHYME] = "重韵"
CONST2STR[TONE_EITHER]="中"
CONST2STR[TONE_LEVEL]="平"
CONST2STR[TONE_OBLIQUE]="仄"
CONST2STR[TONE_LEVEL_RHYME]="平韵"
CONST2STR[TONE_OBLIQUE_RHYME]="仄韵"
CONST2STR[TONE_NOT_FOUND] = "韵书未录"

const SVGICONS = {
  pencil:`<path d="M0,32 L0,24 L16,8 L24,16 L8,32 z" %FILL/><path d="M18,6 L26,14 L32,8 L24,0 z" %FILLL/>`,
  eraser:`<path d="M0,20 L20,0 L32,12 L12,32 L8,32 L0,24 z" %STROKE/><path d="M4,16 L18,2 L30,14 L16,28 z" %FILL/>`,
  trash:`<path d="M6,8 L26,8 L24,32 L8,32 z" %FILL/><path d="M4,2 L12,2 L14,0 L18,0 L20,2 L28,2 L28,6 L4,6 z" %FILL/>`,
  nodes:`<path d="M0,20 L12,20 L12,32 L0,32 z" %STROKE/><path d="M2,4 L12,4 L12,14 L2,14 z" %STROKE/>
         <path d="M20,22 L28,22 L28,30 L20,30 z" %STROKE/><path d="M18,0 L28,0 L28,10 L18,10 z" %STROKE/><path d="M18,10 L12,20" %STROKE/>
         <path d="M18,5 L12,9" %STROKE/><path d="M23,10 L24,22" %STROKE/>`,
  close:`<path d="M0,0 L32,32 M32,0 L0,32" %STROKE/>`,
  dice:`<path d="M0,8 L0,24 L16,32 L16,16 z" %STROKE/><path d="M32,8 L32,24 L16,32 L16,16 z" %STROKE/><path d="M0,8 L16,0 L32,8 L16,16 z" %STROKE/>
        <path d="M 16 5 a 4 2 0 1 0 0.01 0 z" %FILL/><path d="M 5 13 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 11 22 a 2 2 0 1 0 0.01 0 z" %FILL/>
        <path d="M 21 22 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 27 13 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 24 17.5 a 2 2 0 1 0 0.01 0 z" %FILL/>`,
  menu:`<path d="M0,2 L32,2 L32,6 L0,6 z" %FILL/><path d="M0,14 L32,14 L32,18 L0,18 z" %FILL/><path d="M0,26 L32,26 L32,30 L0,30 z" %FILL/>`,
  flag:`<path d="M4,2 L0,32 L4,32 L8,2 z" %FILL/><path d="M10,4 L16,0 L24,4 L32,0 L32,16 L24,20 L16,16 L8,20 z" %FILL/>`,
  left:`<path d="M26,0 L6,16 L26,32" %STROKE/>`,
  right:`<path d="M6,0 L26,16 L6,32" %STROKE/>`,
  refresh:`<path d="M0,16 L8,8 L14,5 L20,4 L20,0 L32,8 L20,16 L20,11 L14,11" %FILL/><path d="M32,16 L24,24 L18,27 L12,28 L12,32 L0,24 L12,16 L12,21 L18,21" %FILL/>`,
  add:`<path d="M14,0 L18,0 L18,32 L14,32" %FILL/><path d="M0,14 L0,18 L32,18 L32,14" %FILL/>`,
  circleoutline:`<path d="M0,16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0" %STROKE/>`,
  circlefilled:`<path d="M0,16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0" %FILL/>`,
  circlehalf:`<path d="M16,0 a 8 8 0 1 1 0 32" %FILL/><path d="M 0, 16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0" %STROKE/>`,
}

function makeIcon(args){
  var color = window.getComputedStyle(document.documentElement).getPropertyValue(args.color);
  var svg = SVGICONS[args.name]
    .replace(/%STROKE/g, ` stroke-width="${args.stroke}" stroke="${color}" fill="none" stroke-linejoin="round" `)
    .replace(/%FILL/g, ` fill="${color}" `)
    ;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${args.width}" height="${args.height}" viewBox="-2 -2 36 36">`+svg+"</svg>"
}


const METERS = loadJSON("/data/meters.json");
const RHYMEBOOKS = loadJSON("/data/rhymebooks.json");
const KANGXI = loadJSON("/data/kangxi.json")
const TC2SC = loadJSON("/data/TC2SC.json")
