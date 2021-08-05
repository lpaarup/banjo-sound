const Speaker = require('speaker');
const Buffer = require('buffer').Buffer
const util = require('util');
const debuglog = util.debuglog('app');

const StreamStatus = {
    OK: 1,
    ERROR: 2
}

const Direction = {
    Output: 1,
}

class AudioStream {
    status = StreamStatus.OK
    error = null

    constructor(builder) {
        this.builder = builder

        this.speaker = new Speaker({
            sampleRate: builder.sampleRate,
            channels: builder.channelCount,
            bitDepth: builder.bitDepth
        })
        process.on('SIGINT', () => this.shutdown(this));
    }

    get bitDepth() {
        return this.builder.bitDepth
    } 

    get sampleRate(){
        return this.builder.sampleRate
    }

    get channelCount() {
        return this.builder.channelCount
    }

    get numFramesPerBurst() {
        return this.builder.numFramesPerBurst
    }

    get period() {
        return this.builder.period
    }

    get maxAplitude() {
        return this.builder.maxAplitude
    }

    get dataCallback() {
        return this.builder.dataCallback
    }

    write(data) {
        this.speaker.write(data)
    }

    getTime() {
        var hrTime = process.hrtime()
        return hrTime[0] * 1000 + hrTime[1] / 1000000
    }

    loop(obj) {
        var start = obj.getTime()
        var burst = Buffer.alloc(obj.numFramesPerBurst * (obj.bitDepth / 8 * obj.channelCount))
        this.dataCallback.onAudioReady(obj, burst, obj.numFramesPerBurst)
        this.write(burst)
        var timeSpent = obj.getTime() - start
        debuglog("spent " + timeSpent + " ms in current loop iteration")
        setTimeout(() => obj.loop(obj), obj.period - timeSpent);
    }

    requestStart() {
        debuglog("requested start...")
        this.loop(this)
    }

    shutdown(obj) {
        obj.requestStop()
    }

    requestStop() {
        debuglog("Stopping stream...")
        process.exit(0)
    }
}

module.exports = {
    StreamStatus: StreamStatus,

    Direction: Direction,

    AudioStreamBuilder: class AudioStreamBuilder {
        direction = Direction.Output
        sampleRate = 44100
        channelCount = 2
        bitDepth = 16
        maxAplitude = 2 ** (this.bitDepth - 1) - 1

        numFramesPerBurst = 192
        period = 4 // send numFramesPerBurst to speaker every 4 ms

        setDirection(direction) {
            this.direction = direction
        }

        setChannelCount(count) {
            this.channelCount = count
        }

        setSampleRate(rate) {
            this.sampleRate = rate
        }

        setNumFramesPerBurst(fpb) {
            this.numFramesPerBurst = fpb
        }

        setDataCallback(cb) {
            this.dataCallback = cb
        }

        newStream() {
            return new AudioStream(this)
        }
    },

    AudioStreamDataCallback: class AudioStreamDataCallback {
        onAudioReady(stream, audioData, numFrames) {
            throw new Error('You need to implement onAudioReady method on your callback');
        }
    },


}