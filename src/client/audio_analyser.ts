export class AudioAnalyser {

    audioCtx:AudioContext;
    workletProcessorCode = "essentia-worklet-processor.js";
    essentiaNode?: AudioWorkletNode;

    constructor(audioCtx:AudioContext) {
        this.audioCtx = audioCtx
    }

    async createEssentiaNode() {
        try {
            // add our custom code to the worklet scope and register our processor as `essentia-worklet-processor`
            await this.audioCtx.audioWorklet.addModule(this.workletProcessorCode);
        } catch(e) {
            console.log(e);
        }
        // instantiate our custom processor as an AudioWorkletNode
        this.essentiaNode =  new AudioWorkletNode(this.audioCtx, 'essentia-worklet-processor');
    }
}