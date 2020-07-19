const proc = require('child_process')



function configure(newer){

    let result = {}

    if(['windows 10', 'unix', 'macos'].includes(newer.system))
        result.system = newer.system
    else
        throw 'no such system'

    if(['nvidia', 'amd', 'intel'].includes(newer.graphicsCard))
        result.gpu = newer.graphicsCard
    else
        throw 'no such gpu'

    return result
}


let mod = {
    conf: {
        system: 'windows 10', //unix, macos, android?
        gpu: 'nvidia' //amd, intel

    },
    configure: (system, architecture='amd64', graphicsCard='nvidia') => mod.conf = configure({system, architecture, graphicsCard}),
    hello: function(){ console.log('hello') },
    record: () => recorder(this.conf),
    streamDesktop: desktopStream,
    scanDevices: () => {
        if(mod.conf.system == 'windows 10')
            return dshowDeviceScan()
        else 
            throw 'no device scan for this os yet'
    },
    streamMicrophone: audioStream


}


function audioStream(destination='127.0.0.1:1234', format='mpegts', device=''){

    let args = []

    if(mod.conf.system == 'windows 10'){
        if(device == '')
            device = dshowDeviceScan().audio[0].split('"')[1]

        args = `-f dshow -i`.split(' ')
        args.push('audio='+device)
    }
    else 
        throw 'no audio streaming for this system yet'


    args = args.concat(`-f ${format} udp://${destination}`.split(' '))


    console.log('Starting audio stream with command: ffmpeg '+ args.join(' '))
    let desktop = proc.spawn('ffmpeg', args)
    desktop.stdout.on('data', data => console.log(data.toString()))
    desktop.stderr.on('data', data => console.error(data.toString()))
}


function dshowDeviceScan(){
    
    let {output} = proc.spawnSync('ffmpeg', '-list_devices true -f dshow -i dummy'.split(' '))
    let q = output.join('').toString()
    q = q.split('[')
    q.shift()
    q.shift()
    q = q.join(']').split(']')


    let result = {
        audio: [],
        video: []
    }

    let audio = false

    for(let i in q)
        if(i % 2){
            let name = q[i].trim()
            if(name.includes('Alternative name'))
                continue

            if(name == 'DirectShow audio devices')
                audio = true       
            else if(audio)
                result.audio.push(name)
            else
                result.video.push(name)
        }

    return result
}


function desktopStream(destination='127.0.0.1:1234', format='mpegts'){
    let source = []

    if(mod.conf.system == 'unix'){

        let resolution = '1280x1024'

        source.push('-video_size')
        source.push(resolution)

        source.push('-f')
        source.push('x11grab')

        source.push('-i')
        source.push(':1')
    }
    else if(mod.conf.system == 'windows 10'){
        source.push('-f')
        source.push('dshow')
        source.push('-i')

        source.push('video=screen-capture-recorder:audio=virtual-audio-capturer')
    }
    else
        throw 'desktop streaming for this system is not ready'
    


    let args = []
    for(let option of source)
        args.push(option)

    args.push('-f')
    args.push(format)
    args.push('udp://'+destination)

    console.log('Starting desktop stream with command: ffmpeg '+ args.join(' '))

    let desktop = proc.spawn('ffmpeg', args)
    desktop.stdout.on('data', data => console.log(data.toString()))
    desktop.stderr.on('data', data => console.error(data.toString()))

    //Testing commands
    //mpv udp://127.0.0.1:1234
    //mpv udp://127.0.0.1:1234 --no-cache --untimed --no-demuxer-thread --video-sync=audio --vd-lavc-threads=1
}



module.exports = mod