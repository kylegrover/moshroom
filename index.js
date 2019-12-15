const electron = require('electron')
const url = require('url')
const path = require('path')
const fs = require('fs')

const exec = require('child_process').exec

const {app, Menu, BrowserWindow, shell, ipcMain, dialog } = electron

// production mode - uncomment and run `npm package-win` etc to build
// process.env.NODE_ENV = 'production'

let mainWindow

app.on('ready',()=>{
    mainWindow = new BrowserWindow({
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file:',
        slashes: true
    }))

    // mainWindow.on('closed',()=>{app.quit()})

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

ipcMain.on('chooseVideo',chooseVideo)

const mainMenuTemplate = [{
    label:'File',
    submenu: [{
        label: 'Import Video',
        accelerator: 'CmdOrCtrl+O',
        click(){ chooseVideo() }
    },{
        label: 'Export Video',
        accelerator: 'CmdOrCtrl+S',
        click(){  /* mosh/bake/save */ }
    },{
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click(){ app.quit() }
    }]
}]

if (process.platform == 'darwin') mainMenuTemplate.unshift({});
if (process.env.NODE_ENV != 'production') mainMenuTemplate.push({
    label: 'Dev Tools',
    submenu: [{
        label: 'Toggle Tools',
        accelerator: process.platform == 'darwin'?'Command+I':'Ctrl+I',
        click(item, focusedWindow){ focusedWindow.toggleDevTools() }
    },
    {role: 'reload'}]
});

// mainWindow.querySelector('#openvidbtn').addEventListener('click',()=>{
//     chooseVideo();
// })
function chooseVideo() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
    }).then(result => {
        console.log(result.filePaths)
        if (result.filePaths.length > 0) 
            loadVideo(result.filePaths[0])
    }).catch(err => {
        console.log(err)
    })
}

function loadVideo(filepath) {
    /* 
    fs.readFile(filepath, 'utf-8', (err,data) => {
        if (err) {
            alert('Couldn\'t load video '+filepath)
            return
        }

        do something with data
        console.log(data)
    }) 
    */

    var date = new Date
    var date_string = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds()
    var output_dir = app.getPath('videos')+'\\moshroom'

    var prep_dir = exec('mkdir -p "'+output_dir+'"')
    prep_dir.on('exit',()=>{
        var output_file = output_dir+"\\"+date_string+'.mp4'
        var mosh_cmd = 'bash\\mosh.bat "'+filepath+'" "'+output_file+'"'
        console.log(mosh_cmd)
        var mosh_process = exec(mosh_cmd)
        mainWindow.setProgressBar(2) // indeterminate mode. maybe use ffprobe in the future to set real values
        mosh_process.stdout.pipe(process.stdout)
        mosh_process.on('exit',()=>{
            console.log("mosh complete")
            console.log(output_dir)
            console.log(output_file)
            shell.showItemInFolder(output_file)
            mainWindow.setProgressBar(-1) // done
        })
    })
}