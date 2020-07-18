const proc = require('child_process')



function configure(newer){

    let result = {}

    if(['windows 10', 'unix', 'macos'].includes(newer.system))
        result.system = newer.system
    else
        throw 'no such system'

    if(['amd64', 'i386', 'arm'].includes(newer.architecture))
        result.arch = newer.architecture
    else
        throw 'no such architecture'

    if(['nvidia', 'amd', 'intel'].includes(newer.graphicsCard))
        result.gpu = newer.graphicsCard
    else
        throw 'no such gpu'

    return result
}


let mod = {
    conf: {
        system: 'windows 10', //unix, macos, android?
        arch: '64bit', //32bit, arm
        gpu: 'nvidia' //amd, intel

    },
    configure: (system, architecture='amd64', graphicsCard='nvidia') => mod.conf = configure({system, architecture, graphicsCard}),
    hello: function(){ console.log('hello') },
    record: () => recorder(this.conf),
    streamDesktop: ()=>{



        let source = []

        console.log(mod.conf)

        if(mod.conf.system == 'unix'){

            let resolution = '1280x1024'

            source.push('-video_size')
            source.push(resolution)

            source.push('-f')
            source.push('x11grab')

            source.push('-i')
            source.push(':1')
        }
        

        let format = 'mpegts'
        let destination = 'udp://127.0.0.1:1234' 


        let args = []
        for(let option of source)
            args.push(option)

        args.push('-f')
        args.push(format)
        args.push(destination)

        console.log('Starting stream with command: ffmpeg '+ args.join(' '))

        let desktop = proc.spawn('ffmpeg', args)
        desktop.stdout.on('data', data => console.log(data.toString()))
        desktop.stderr.on('data', data => console.error(data.toString()))

        //Testing commands
        //mpv udp://236.0.0.1:2000
        //mpv udp://236.0.0.1:2000 --no-cache --untimed --no-demuxer-thread --video-sync=audio --vd-lavc-threads=1
    }
}




module.exports = mod
