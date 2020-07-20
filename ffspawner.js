const proc = require('child_process')



function audioStream(destination='127.0.0.1:1234', format='mpegts', device=''){

    let args = []


    switch(process.platform){
        case 'win32':
            if(device == '')
                device = dshowDeviceScan().audio[0].split('"')[1]

            args = `-f dshow -i`.split(' ')
            args.push('audio='+device)
            break
        case 'linux':
            if(device == '')
                device = 'hw:0'

            args = `-f alsa -i ${device}`.split(' ')
            break
        default:
            throw 'no audio streaming for this system yet'
    }



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


function alsaDeviceScan(){
    let {output} = proc.spawnSync('arecord', ['-l'])
    let q = output.toString().split('\n')
    q.shift()

    let tmp = ''
    for(let i of q)
        if(i[0] != ' ')
            tmp += i + '\n'
    q = tmp.split('\n')
    q.pop()
    q.pop()
    q = q.map(line => {
        return {
            name: line.split(':')[1].split(',')[0].trim(),
            id: line.split(' ')[1].slice(0, -1)
        }
    })

    let result = []
    for(let i = 0; i < q.length -1; i++)
        if(q[i].id != q[i+1].id)
            result.push(q[i])
    result.push(q[q.length-1])

    console.log(result)
    return result
}


function desktopStream(destination='127.0.0.1:1234', format='mpegts'){
    let source = []

    switch(process.platform){
        case 'linux':
            let resolution = '1280x1024'
            source = source.concat(`-video_size ${resolution} -f x11grab -i :1`).split(' ')
            break
        case 'win32':
            source = source.concat('-f dshow -i'.split(' '))
            source.push('video=screen-capture-recorder:audio=virtual-audio-capturer')
            break
        default:
            throw 'desktop streaming for this system is not ready'
    }


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

let mod = {
    streamDesktop: desktopStream,
    scanDevices: () => {
        switch(process.platform){
            case 'win32':
                return dshowDeviceScan()
            case 'linux':
                return {
                    audio: alsaDeviceScan(),
                    video: 'not ready yet'
                }
            default:
                throw 'no device scan for this os yet'
        }
    },
    streamMicrophone: audioStream //not suitable for real-time communication :(
    
}

module.exports = mod