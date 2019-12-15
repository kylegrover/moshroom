// prepare ffmpeg
const ffbinaries = require('ffbinaries');
let ffmpeg, ffprobe
ffbinaries.downloadBinaries(['ffmpeg','ffprobe'],{destination: __dirname+'/binaries'},(err,data)=>{
    if (err) {
      console.log('Downloads failed.')
    } else {
        console.log('Downloads successful.')
        console.log(data)
        ffmpeg = data[0]
        ffprobe = data[1]
    }
});
// prepare electron & various requires
const electron = require('electron')
const {app, Menu, BrowserWindow, shell, ipcMain, dialog } = electron
const url = require('url')
const path = require('path')
const pyshell = require('python-shell')
// const fs = require('fs')

const child_process = require('child_process')
const {exec, spawn} = child_process

// production mode - uncomment and run `npm package-win` etc to build
// process.env.NODE_ENV = 'production'

let mainWindow

app.on('ready',()=>{
    mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        resizable: false,
        frame: false,
        transparent: true,
        clickThrough: 'pointer-events',
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.on('closed',()=>{app.quit()})

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
    mainWindow.setProgressBar(2) // indeterminate mode. maybe use ffprobe in the future to set real values
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
    var output_file = output_dir+"\\"+date_string+'.mp4'

    var prep_dir = exec('mkdir "'+output_dir+'"')
    prep_dir.on('exit',(code)=>{
        console.log('prep_dir code '+code)
        ffmpeg.pathname = ffmpeg.path+'\\'+ffmpeg.filename
        var prep_file = spawn(ffmpeg.pathname, ['-i',filepath,'-vcodec libxvid -qscale 1 -g 60 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file+'-nokeys.avi'], { shell: true })
        prep_file.on('exit',(code)=>{
            console.log('prep_file code '+code)
            var mosh_file = exec('datamosh', [output_file+'-nokeys.avi','-o',output_file+'-moshed.avi'])
            mosh_file.on('exit',(code)=>{
                console.log('mosh_file code '+code)
                var bake_file = exec('moshy', ['-m bake -i',output_file+'-moshed.avi','-o',output_file+'-baked.avi'])
                bake_file.on('exit',(code)=>{
                    console.log('bake_file code '+code)
                    var save_to_mp4 = spawn(ffmpeg.pathname, ['-i',output_file+'-baked.avi','-vcodec libxvid -qscale 1 -g 60 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file+'-baked.avi'], { shell: true })
                    save_to_mp4.on('exit',(code)=>{
                        console.log('save_to_mp4 code '+code)
                        var clean_up = spawn(ffmpeg.pathname, ['-m bake -i',filepath,'-strict -2 ',output_file], { shell: true })
                        clean_up.on('exit',(code)=>{
                            console.log('clean_up code '+code)
                            console.log("mosh complete")
                            console.log(output_dir)
                            console.log(output_file)
                            shell.showItemInFolder(output_file)
                            mainWindow.setProgressBar(-1) // done        
                        })
                    })
                })
            })
        })
    })
}