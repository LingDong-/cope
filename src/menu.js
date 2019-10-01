const { remote } = require('electron')
const { Menu, MenuItem } = remote

const template = [
  { role: 'appMenu' },
  { role: 'fileMenu' },
  { role: 'editMenu' },
  {
    label: "Cells",
    submenu: [
      {label: "Insert Cell Before", click:menuFunctions.insertCellBefore},
      {label: "Insert Cell After", click:menuFunctions.insertCellAfter},
      {label: "Delete Cell", click:menuFunctions.deleteCell},
    ]
  },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  { role: 'help' },
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)