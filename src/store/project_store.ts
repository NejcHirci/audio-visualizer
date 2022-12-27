import { makeAutoObservable } from 'mobx'
import { MutableRefObject } from 'react'
import { mapLinear } from 'three/src/math/MathUtils'
import { analyze } from 'web-audio-beat-detector';
// import * as Tone from 'tone'


export class ProjectStore {

  audioRef : MutableRefObject<any>
  context : AudioContext;

  // Nodes
  sourcePlayer : MediaElementAudioSourceNode;
  sourceMic : MediaStreamAudioSourceNode;
  sourceEdit : AudioNode[];
  masterGain : GainNode;
  analyser : AnalyserNode;

  // Data
  fftSize : number = 512;
  fftArray : Uint8Array;
  prevFFTArray : Uint8Array;
  timeArray : Uint8Array;
  prevFloatArray : Uint8Array;


  // Analytics
  lowFFT : number = 1;
  midFFT : number = 1;
  highFFT : number = 1;
  bpm : number = 60;

  // AudioEffects
  // chorus: Tone.Chorus;
  // isChorus: boolean = false;
  // tremolo: Tone.Tremolo;
  // isTremolo: boolean = false;
  // phaser: Tone.Phaser;
  // isPhaser: boolean = false;

  // Microphone
  micEnabled: boolean = false;



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

    this.createInitialGraph();
    makeAutoObservable(this);
  }

  createInitialGraph() {
    this.context = new AudioContext();

    // We want to have 3 possible sources

    // Source 1: audio player
    this.sourcePlayer = null;

    // Source 2: microphone
    this.sourceMic = null;

    // Source 3: all the oscillators
    this.sourceEdit = []

    // We create the masterGain node for all source nodes
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.33;

    // Create the analyser node
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.9;

    // Initialize array buffers
    this.fftArray = new Uint8Array(this.analyser.fftSize);
    this.timeArray = new Uint8Array(this.analyser.fftSize);
    this.prevFFTArray = new Uint8Array(this.analyser.fftSize);
    this.prevFloatArray = new Uint8Array(this.analyser.fftSize);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  useMicrophone() {
    if (!this.micEnabled) {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ 'audio': true }).then((stream) => {
          this.sourceMic = this.context.createMediaStreamSource(stream);
          this.sourceMic.connect(this.masterGain);
          this.micEnabled = true;
        }).catch((err) => {
          console.log(err);
        });
      }
    }
  }

  loadAudio(audioRef: MutableRefObject<any>, url:File) {
    this.audioRef = audioRef;
    this.sourcePlayer = this.context.createMediaElementSource(this.audioRef.current);
    this.audioRef.current.src = URL.createObjectURL(url);
    this.sourcePlayer.connect(this.masterGain);

    // Calculate BPM after load
    let reader = new FileReader();
    reader.readAsArrayBuffer(url);
    reader.onloadend = () => {this.context.decodeAudioData(<ArrayBuffer>reader.result, this.tempoDetection);}
  }

  tempoDetection(buffer:AudioBuffer) {
    analyze(buffer).then((tempo) => {this.bpm = tempo; console.log(tempo);});
  }

  updateArray() {
    this.prevFFTArray = this.fftArray;
    this.analyser.getByteFrequencyData(this.fftArray);
  }

  updateAnalytics() {
    let m1 = 6;
    let m2 = 15;
    let m3 = 110;

    this.lowFFT = mapLinear(this.avg(this.fftArray.slice(0, m1)), this.min(this.fftArray.slice(0, m1)), this.max(this.fftArray.slice(0, m1)), 0.0, 1.0);
    this.midFFT = mapLinear(this.avg(this.fftArray.slice(m1, m2)), this.min(this.fftArray.slice(m1, m2)), this.max(this.fftArray.slice(m1, m2)), 0.0, 1.0);
    this.highFFT = mapLinear(this.avg(this.fftArray.slice(m2, m3)), this.min(this.fftArray.slice(m2, m3)), this.max(this.fftArray.slice(m2, m3)), 0.0, 1.0);
  }

  getSmoothArray() {
    let smoothing = 5;
    let newArray = new Float32Array(this.fftArray.length);
    for (let i = 0; i < this.fftArray.length; i++) {
      let sum = 0;

      for (let index = i - smoothing; index <= i + smoothing; index++) {
        let thisIndex = index < 0 ? index + this.fftArray.length : index;
        sum += (this.fftArray[thisIndex] * 0.3 + this.prevFFTArray[thisIndex] * 0.7);
      }
      newArray[i] = sum / ((smoothing*2)+1);
    }
    return newArray;
  }

  updateChorus(f:number, delay:number, depth:number) {
    // if (this.isChorus) {
    //   Tone.disconnect(this.source, this.chorus);
    //   Tone.disconnect(this.chorus, this.gain);
    //   this.source.connect(this.gain);
    //   this.isChorus = false;
    // }
    // // Create new
    // this.chorus = new Tone.Chorus({frequency: f, delayTime: delay, depth: depth});
  }

  updatePhaser(f:number, octaves:number, baseF:number) {
    // if (this.isPhaser) {
    //   Tone.disconnect(this.source, this.phaser);
    //   Tone.disconnect(this.phaser, this.gain);
    //   this.source.connect(this.gain);
    //   this.isPhaser = false;
    // }
    // // Create new
    // this.phaser = new Tone.Phaser({frequency: f, octaves: octaves, baseFrequency: baseF});

  }

  updateTremolo(f:number, depth:number) {
    // if (this.isTremolo) {
    //   Tone.disconnect(this.sou, this.tremolo);
    //   Tone.disconnect(this.tremolo, this.gain);
    //   this.source.connect(this.gain);
    //   this.isTremolo = false;
    // }
    //
    // // Create new
    // this.tremolo = new Tone.Tremolo({frequency:f, depth:depth, wet:0.5});
  }

  togglePhaser() {
    // if (this.isPhaser) {
    //   Tone.disconnect(this.source, this.phaser);
    //   Tone.disconnect(this.phaser, this.gain);
    //   this.source.connect(this.gain);
    // } else {
    //   Tone.connect(this.source, this.phaser);
    //   Tone.connect(this.phaser, this.gain);
    // }
    // this.isPhaser = !this.isPhaser;
  }

  toggleTremolo() {
    // if (this.isTremolo) {
    //   Tone.disconnect(this.source, this.tremolo);
    //   Tone.disconnect(this.tremolo, this.gain);
    //   this.source.connect(this.gain);
    // } else {
    //   Tone.connect(this.source, this.tremolo);
    //   Tone.connect(this.tremolo, this.gain);
    // }
    // this.isTremolo = !this.isTremolo;
  }

  // Audio Effects to Add
  toggleChorus() {
    // if (this.isChorus) {
    //   Tone.disconnect(this.source, this.chorus);
    //   Tone.disconnect(this.chorus, this.gain);
    //   this.source.connect(this.gain);
    //
    // } else {
    //   Tone.connect(this.source, this.chorus);
    //   Tone.connect(this.chorus, this.gain);
    // }
    // this.isChorus = !this.isChorus;
  }



  // UTILITIES

  avg(arr:Uint8Array) {
    return arr.reduce((p, c) => p+c, 0) / arr.length;
  }

  max(arr:Uint8Array) {
    return arr.reduce((a, b) => a > b ? a : b);
  }

  min(arr:Uint8Array) {
    return arr.reduce((a, b) => a < b ? a : b);
  }
}