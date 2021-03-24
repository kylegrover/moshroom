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
const async = require('async')
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
    mainWindow.setIgnoreMouseEvents(true, {forward: true})
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.on('closed',()=>{app.quit()})

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

ipcMain.on('basicMosh',basicMosh)
ipcMain.on('aniMosh',aniMosh)
ipcMain.on('loopMosh',loopMosh)

// handle background transparency / clickability
// mainWindow.setIgnoreMouseEvents(true, {forward: true})   // {forward: true} keeps generating MouseEvents
ipcMain.on('ignoremouse_false',()=>{
    mainWindow.setIgnoreMouseEvents(false)
})
ipcMain.on('ignoremouse_true',()=>{
    mainWindow.setIgnoreMouseEvents(true, {forward: true})   // {forward: true} keeps generating MouseEvents
})

const mainMenuTemplate = [{
    label:'File',
    submenu: [{
        label: 'Import Video',
        accelerator: 'CmdOrCtrl+O',
        click(){ basicMosh() }
    },{
        label: 'Export Video',
        accelerator: 'CmdOrCtrl+S',
        click(){  /* mosh/bake/save */ }
    },{
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click(){
            console.log(mainWindow.webContents.executeJavaScript('document.querySelector("body").classList.add("quitting")')) 
            setTimeout(()=>{app.quit()},1000)
        }
    }]
}]

if (process.platform == 'darwin') mainMenuTemplate.unshift({});
if (process.env.NODE_ENV != 'production') mainMenuTemplate.push({
    label: 'Dev Tools',
    submenu: [{
        label: 'Toggle Tools',
        accelerator: 'CmdOrCtrl+I',
        click(item, focusedWindow){ focusedWindow.toggleDevTools() }
    },
    {role: 'reload'}]
});

// mainWindow.querySelector('#openvidbtn').addEventListener('click',()=>{
//     basicMosh();
// })
function basicMosh() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
    }).then(result => {
        console.log(result.filePaths)
        if (result.filePaths.length > 0)
            doMosh(result.filePaths[0])  
    }).catch(err => {
        console.log(err)
    })
}

function loopMosh() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
    }).then(result => {
        console.log(result.filePaths)
        if (result.filePaths.length > 0)
            doLoopMosh(result.filePaths[0]) 
    }).catch(err => {
        console.log(err)
    })
}

function aniMosh() {
    // dialog.showOpenDialog(mainWindow, {
    //     properties: ['openFile']
    // }).then(result => {
    //     console.log(result.filePaths)
    //     if (result.filePaths.length > 0) 
    //         doMosh(result.filePaths[0])
    // }).catch(err => {
    //     console.log(err)
    // })
}

function doMosh(filepath) {
    mainWindow.setProgressBar(2) // indeterminate mode. maybe use ffprobe in the future to set real values

    var date = new Date
    var date_string = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds()
    var output_dir = app.getPath('videos')+'\\moshroom'
    var output_file = output_dir+"\\"+date_string+'.mp4'

    var prep_dir = exec('mkdir "'+output_dir+'"')
    prep_dir.on('exit',(code)=>{
        console.log('prep_dir code '+code)
        ffmpeg.pathname = ffmpeg.path+'\\'+ffmpeg.filename
        var prep_file = spawn(ffmpeg.pathname, ['-i','"'+filepath+'"','-vcodec libxvid -qscale 1 -g 60 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file+'-nokeys.avi'], { shell: true })
        prep_file.on('exit',(code)=>{
            console.log('prep_file code '+code)
            var mosh_file = exec('datamosh '+output_file+'-nokeys.avi -o '+output_file+'-moshed.avi')
            mosh_file.on('exit',(code)=>{
                console.log('mosh_file code '+code)
                var bake_file = exec(`moshy -m bake -i ${output_file}-moshed.avi -o ${output_file}-baked.avi`)
                bake_file.on('exit',(code)=>{
                    console.log('bake_file code '+code)
                    var save_to_mp4 = spawn(ffmpeg.pathname, ['-i',`${output_file}-baked.avi`,'-vcodec libxvid -qscale 1 -g 60 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file], { shell: true })
                    save_to_mp4.on('exit',(code)=>{
                        console.log('save_to_mp4 code '+code)
                        var clean_up = exec(`rm "${output_file}-nokeys.avi" "${output_file}-moshed.avi" "${output_file}-baked.avi"`)
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


function doLoopMosh(filepath) {
    mainWindow.setProgressBar(2) // indeterminate mode. maybe use ffprobe in the future to set real values

    var date = new Date
    var date_string = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds()
    var output_dir = app.getPath('videos')+'\\moshroom'
    var output_file = output_dir+"\\"+date_string+'.mp4'

    ffmpeg.pathname = ffmpeg.path+'\\'+ffmpeg.filename 
    var file_cleanup = [];
    async.series([
        (callback)=>{ console.log('mkdir')
            exec('mkdir "'+output_dir+'"',(stdout)=>{
                callback(0, stdout) // ignore fail
            })
        },
        (callback)=>{ console.log('prep file')
            file_cleanup.push(output_file+'-nokeys.avi')
            var prep_file = spawn(ffmpeg.pathname, ['-i','"'+filepath+'"','-vcodec libxvid -qscale 1 -g 999 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file+'-nokeys.avi'], { shell: true })
            prep_file.on('exit',(code)=>{   
                callback(code, null)
            })
        },
        (callback)=>{ console.log('mosh')
            file_cleanup.push(output_file+'-moshed.avi')
            exec('datamosh '+output_file+'-nokeys.avi -o '+output_file+'-moshed.avi',(error, stdout)=>{
                callback(error, stdout)
            })           
        },
        (callback)=>{ console.log('bake')
            file_cleanup.push(output_file+'-baked.avi')
            exec(`moshy -m bake -i ${output_file}-moshed.avi -o ${output_file}-baked.avi`,(error, stdout)=>{
                callback(error, stdout)
            })
        },
        (callback)=>{ console.log('cut last frame')
            file_cleanup.push(output_file+'-baked-lastframe.avi')
            var clip_last_frame = spawn(ffmpeg.pathname,[`-sseof -0.1 -i "${output_file}-baked.avi" -update 1 -q:v 1 ${output_file}-baked-lastframe.avi`], { shell: true });
            clip_last_frame.on('exit',(code)=>{
                callback(code, null)
            })
        },
        (callback)=>{ console.log('build concat list')
            file_cleanup.push(output_file+'-concat.txt')
            exec(`echo file ${output_file.replace(/\\/g,'/')}-baked-lastframe.avi > "${output_file}-concat.txt"`,(code)=>{
                exec(`echo file ${output_file.replace(/\\/g,'/')}-nokeys.avi >> "${output_file}-concat.txt"`,(code)=>{
                    callback(code,null)
                })
            })
        },
        (callback)=>{ console.log('stitch frame to video')
            file_cleanup.push(output_file+'-stitched.avi')
            console.log(ffmpeg.pathname,`-f concat -safe 0 -i "${output_file}-concat.txt" -c copy "${output_file}-stitched.avi"`)
            var stitch_frame = spawn(ffmpeg.pathname,['-f','concat','-safe','0','-i',`"${output_file}-concat.txt"`,'-c','copy',`"${output_file}-stitched.avi"`], { shell: true })
            stitch_frame.stdout.on('data',(data)=>{
                console.log(`stdout: ${data}`);
            })
            stitch_frame.stderr.on('data',(data)=>{
                console.error(`stderr: ${data}`);
            })
            stitch_frame.on('exit',(code)=>{
                callback(code,null)
            })
        },
        (callback)=>{ console.log('mosh2')
            file_cleanup.push(output_file+'-moshed2.avi')
            exec('datamosh '+output_file+'-stitched.avi -o '+output_file+'-moshed2.avi',(error, stdout)=>{
                callback(error, stdout)
            })           
        },
        (callback)=>{ console.log('bake2')
            file_cleanup.push(output_file+'-baked2.avi')
            exec(`moshy -m bake -i ${output_file}-moshed2.avi -o ${output_file}-baked2.avi`,(error, stdout)=>{
                callback(error, stdout)
            })
        },
        (callback)=>{ console.log('save to mp4')
            var save_to_mp4 = spawn(ffmpeg.pathname, ['-i',`${output_file}-baked2.avi`,'-vcodec libxvid -qscale 1 -g 60 -ss 0.1 -me_method epzs -bf 0 -mbd 0 -acodec copy',output_file], { shell: true })
            save_to_mp4.on('exit',(code)=>{
                callback(code, null)
            })
        },
        (callback)=>{ console.log('clean up')
            var rm_cmd = "rm"
            file_cleanup.forEach(filename => {
                rm_cmd += " "+filename
            });
            console.log(rm_cmd)
            exec(rm_cmd,(error, stdout)=>{
                callback(error, stdout)
            })
        }
    ],(err, results)=>{ console.log('final err:',err,'final results:',results)
        if (!err) shell.showItemInFolder(output_file)
        if (!err) shell.openItem(output_file)
        mainWindow.setProgressBar(-1) // done       
    })
}