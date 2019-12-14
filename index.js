const electron = require('electron')
const url = require('url')
const path = require('path')
const fs = require('fs')

const exec = require('child_process').exec

const {app, BrowserWindow, Menu, dialog, shell} = electron

let mainWindow

app.on('ready',()=>{
    mainWindow = new BrowserWindow({})
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file:',
        slashes: true
    }))

    // mainWindow.on('closed',()=>{app.quit()})

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

const mainMenuTemplate = [
    {
        label:'File',
        submenu: [
            {
                label: 'Import Video',
                accelerator: process.platform == 'darwin'?'Command+O':'Ctrl+O',
                click(){
                    // file picker
                    dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile']
                    }).then(result => {
                        console.log(result.filePaths)
                        loadVideo(result.filePaths[0])
                    }).catch(err => {
                        console.log(err)
                    })
                }
            },
            {
                label: 'Export Video',
                accelerator: process.platform == 'darwin'?'Command+S':'Ctrl+S',
                click(){
                    // mosh/bake/save
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin'?'Command+Q':'Ctrl+Q',
                click(){
                    app.quit()
                }
            }
        ]
    }
]

if (process.platform == 'darwin') mainMenuTemplate.unshift({});
if (process.env.NODE_ENV != 'production') mainMenuTemplate.push({
    label: 'Dev Tools',
    submenu: [
        {
            label: 'Toggle Tools',
            accelerator: process.platform == 'darwin'?'Command+I':'Ctrl+I',
            click(item, focusedWindow){
                focusedWindow.toggleDevTools();
            }
        },
        {
            role: 'reload'
        }
    ]
});

function loadVideo(filepath) {
    // fs.readFile(filepath, 'utf-8', (err,data) => {
    //     if (err) {
    //         alert('Couldn\'t load video '+filepath)
    //         return
    //     }

        // do something with data
        // console.log(data)
    // })
    // shell.showItemInFolder(filepath)

    var date = new Date
    var date_string = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds()
    var output_file = 'output/'+date_string+'.mp4'
    exec('ffmpeg -i '+filepath+' '+output_file, (err, stdout, stderr) => { 
        if (err != null) { 
            console.log(err)
        } else if (stderr != null) {
            console.log(stderr)
        } else {
            console.log('success!')
            console.log(stdout)
            shell.showItemInFolder(output_file)
        }
    });
}