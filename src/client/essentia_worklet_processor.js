// essentia-worklet-processor.ts
import { EssentiaWASM } from 'essentia.js'
import { Essentia } from 'essentia.js'

let essentia = new Essentia(EssentiaWASM);

export class EssentiaWorkletProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this.essentia = essentia;
        console.log('Backend - essentia:' + this.essentia.version + '- http://essentia.upf.edu')
    }

    //System-invoked process callback function.
    process(inputs, outputs, parameters) {

        // <inputs> and <outputs> will have as many as were specified in the options passed to the AudioWorkletNode constructor, each subsequently spanning potentially multiple channels
        let input = inputs[0]
        let output = outputs[0];

        // convert the input audio frame array from channel 0 to a std::vector<float> type for using it in essentia
        let vectorInput = this.essentia.arrayToVector(input[0]);

        // In this case we compute the Root Mean Square of every input audio frame
        // check https://mtg.github.io/essentia.js/docs/api/Essentia.html#RMS
        let rmsFrame = this.essentia.RMS(vectorInput) // input audio frame

        output[0][0] = rmsFrame.rms;

        return true; // keep the process running
    }
}

registerProcessor('essentia-worklet-processor', EssentiaWorkletProcessor); // must use the same name we gave our processor in `createEssentiaNode`

