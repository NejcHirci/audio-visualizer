import { makeAutoObservable } from 'mobx'
import { MutableRefObject } from 'react'
import { analyze } from 'web-audio-beat-detector'
import Meyda from 'meyda'
import savitzkyGolay from 'ml-savitzky-golay'

import * as Tone from 'tone'
import { Gain } from 'tone'


export class ProjectStore {

  audioRef : MutableRefObject<any>
  context : AudioContext;

  // Nodes
  sourcePlayer : MediaElementAudioSourceNode;
  sourceMic : MediaStreamAudioSourceNode;
  masterGain : GainNode;
  micAndSynthGain : GainNode;


  // Analysers
  analyserPlayer : Meyda.MeydaAnalyzer;


  analyserMicAndSynth : Meyda.MeydaAnalyzer;
  synthAmpSpectrum : Float32Array;

  // Data Player
  bufferSize : number = 256;
  rms: number = 0;
  prevRms: number = 0;
  spectralCentroid: number | null;
  perceptualSpread: number;
  prevperceptualSpread : number = 0;
  chroma: Float32Array;
  prevChroma: Float32Array;
  amplitudeSpectrum: Float32Array;
  prevAmpSpectrum: Float32Array;
  bpm : number = 60;

  // Microphone
  micEnabled: boolean = false;

  // VisualizationSettings
  visualizations = [
    {id: 1, label: 'Mandel Bulb'},
    {id: 2, label: 'Menger Brocolli'},
    {id: 3, label: 'Menger Mushroom'}
  ]
  selectedVisualization: number


  // For adding sounds
  synth : Tone.Synth;



  constructor() {
    // Tone.setContext(this.context);
    // this.chorus = new Tone.Chorus({frequency: 6, delayTime: 0.5, depth: 0.5});
    // this.tremolo = new Tone.Tremolo({ frequency: 12, depth: 0.9});
    // this.phaser = new Tone.Phaser({
    //   frequency : 15,
    //   octaves : 5,
    //   baseFrequency : 500
    // });
    // this.isChorus = false;
    // this.isTremolo = false;
    // this.isPhaser = false;

    this.selectedVisualization = 1;
    this.createInitialGraph();
    makeAutoObservable(this);
  }

  createInitialGraph() {
    this.context = new AudioContext();

    // We create the masterGain node for all source nodes
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.context.destination);

    // We want to have 3 possible sources
    // Source 1: audio player
    this.sourcePlayer = null;

    this.micAndSynthGain = this.context.createGain();
    this.micAndSynthGain.gain.value = 0.5;

    // Source 2: microphone
    this.sourceMic = null;

    // Source 3:
    Tone.setContext(this.context);
    this.synth = new Tone.Synth();
    Tone.connect(this.synth, this.masterGain);
    Tone.connect(this.synth, this.micAndSynthGain);


    this.prevChroma = new Float32Array(12);
    this.prevAmpSpectrum = new Float32Array(this.bufferSize / 2);

    // Create the analyser node
    this.analyserMicAndSynth = Meyda.createMeydaAnalyzer({
      audioContext: this.context,
      source: this.micAndSynthGain,
      bufferSize: this.bufferSize,
      featureExtractors: [
        "amplitudeSpectrum"
      ],
      callback: (features:any) => {
        this.synthAmpSpectrum = features.amplitudeSpectrum;
      }
    });
    this.analyserMicAndSynth.start();
  }

  triggerNote(note:string, duration:string="4n") {
    this.synth.triggerAttackRelease(note, duration);
  }

  toggleMic() {
    if (!this.micEnabled) {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ 'audio': true }).then((stream) => {
          if (!this.sourceMic) {
            this.sourceMic = this.context.createMediaStreamSource(stream);
          }
          this.sourceMic.connect(this.micAndSynthGain);
          this.micEnabled = true;
        }).catch((err) => {
          console.log(err);
        });
      }
    } else {
      this.sourceMic.disconnect();
      this.micEnabled = false;
    }
  }

  loadAudio(audioRef: MutableRefObject<any>, url:File) {
    this.audioRef = audioRef;

    if (!this.sourcePlayer) {
      this.sourcePlayer = this.context.createMediaElementSource(this.audioRef.current);
    }

    if (!this.analyserPlayer) {
      // Create the analyser node
      this.analyserPlayer = Meyda.createMeydaAnalyzer({
        audioContext: this.context,
        source: this.sourcePlayer,
        bufferSize: this.bufferSize,
        featureExtractors: [
          "rms",
          "amplitudeSpectrum",
          "spectralCentroid",
          "perceptualSpread",
          "chroma",
        ],
        callback: (features:any) => {
          this.amplitudeSpectrum = features.amplitudeSpectrum;
          this.rms = features.rms;
          this.perceptualSpread = features.perceptualSpread;
          this.spectralCentroid = features.spectralCentroid;
          this.chroma = features.chroma;
        }
      });
    }

    this.audioRef.current.src = URL.createObjectURL(url);
    this.sourcePlayer.connect(this.masterGain);

    // Calculate BPM after load
    let reader = new FileReader();
    reader.readAsArrayBuffer(url);
    reader.onloadend = async () => {
     this.bpm = await this.context.decodeAudioData(<ArrayBuffer>reader.result).then(async (buffer) => await analyze(buffer));
    }
    this.analyserPlayer.start();
  }

  getSmoothArray(arr: Float32Array, prevArr: Float32Array, k:number, useSavitzky:boolean = true) {
    if (arr && prevArr) {
      let curArrBase = Array.from(arr);
      let prevArrBase = Array.from(prevArr);

      if (useSavitzky) {
        curArrBase = savitzkyGolay(curArrBase, 1, {
          pad: 'post',
          padValue: 'replicate',
          derivative: 0
        });
        prevArrBase = savitzkyGolay(prevArrBase, 1, {
          pad: 'post',
          padValue: 'replicate',
          derivative: 0
        });
      }

      let newArray = [];
      for (let i = 0; i < arr.length; i++) {
        newArray.push(curArrBase[i] * k + prevArrBase[i] * (1 - k));
      }
      return new Float32Array(newArray);
    }
    return new Float32Array(arr);
  }

  setVisualization(id:number) {
    this.selectedVisualization = id;
  }


  max(arr:Uint8Array) {
    return arr.reduce((a, b) => a > b ? a : b);
  }

  min(arr:Uint8Array) {
    return arr.reduce((a, b) => a < b ? a : b);
  }
}