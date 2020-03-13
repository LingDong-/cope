const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote

const template = [
  { role: 'appMenu' },
  { role: 'fileMenu'
    //,submenu: [{label: "Load/Create New Notebook", click:function(){}}]
  },
  { role: 'editMenu' },
  {
    label: "Cells",
    submenu: [
      {
        label: "Insert Cell Before",
        accelerator: 'CmdOrCtrl+T',
        click:menuFunctions.insertCellBefore
      },
      {
        label: "Insert Cell After",
        accelerator: 'Shift+CmdOrCtrl+T',
        click:menuFunctions.insertCellAfter
      },
      {
        label: "Delete Cell",
        accelerator: 'CmdOrCtrl+Delete',
        click:menuFunctions.deleteCell
      },
    ]
  },
  {
    label: "Analytics",
    submenu: [
      {label: "Bag-of-Words Embedding",click:menuFunctions.embedBow},
      {label: "Line-wise Nearest Neighbor",click:menuFunctions.lineNN},
      {label: "Markov Chain Edit Suggestions",click:menuFunctions.markovSug},
    ]
  },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  { role: 'help' },
]

var menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)