const banjo = require('../index.js')

b = new banjo.AudioStreamBuilder()

class MyCallback extends banjo.AudioStreamDataCallback {
    freq = 440
    t = 0
    async onAudioReady(stream, audioData, numFrames) {
        const w = (Math.PI * 2 * this.freq) / stream.sampleRate
        for (let frame = 0; frame < numFrames; frame++, this.t++) {
            const val = Math.round(stream.maxAplitude * Math.sin(w * this.t))
            for (let channel = 0; channel < stream.channelCount; channel++) {
                audioData.writeInt16LE(val, frame * 2 * stream.channelCount + (channel * 2))
            }
        }
    }
}

b.setDataCallback(new MyCallback())

stream = b.newStream()
if (stream.status != banjo.StreamStatus.OK) {
    console.log("Failed to create stream. Error: " + stream.error)
}

/////////////////////// Option 1///////////////////////////////////////
// requestStart and let the stream call onAudioReady when it needs data
stream.requestStart()


/////////////////// Option 2 //////////////////////////////////////////
// write directy to the speaker and handle the times
// t = 0
// function write() {
//     start = stream.getTime()
//     const sampleSize = stream.bitDepth / 8
//     burst = Buffer.alloc(stream.numFramesPerBurst * (sampleSize * stream.channelCount))
//     const w = (Math.PI * 2 * 440) / stream.sampleRate
//     for (let frame = 0; frame < stream.numFramesPerBurst; frame++, t++) {
//         const val = Math.round(stream.maxAplitude * Math.sin(w * t))
//         for (let channel = 0; channel < stream.channelCount; channel++) {
//             burst.writeInt16LE(val, frame * 2 * stream.channelCount + (channel * 2))
//         }
//     }
//     const timeSpent = stream.getTime() - start
//     stream.write(burst)
//     setTimeout(write, 4 - timeSpent); // write every 4 ms (substract the time spent to create the data)
// }
// // Start the writing
// write()