import { makeAutoObservable } from 'mobx'
import { MutableRefObject } from 'react'
import { DataTexture2DArray } from 'three'
import { mapLinear } from 'three/src/math/MathUtils'
import { analyze } from 'web-audio-beat-detector';
import * as Tone from 'tone';


export class ProjectStore {

  audioRef : MutableRefObject<any>
  context : AudioContext;

  // Nodes
  source : MediaElementAudioSourceNode;
  analyser : AnalyserNode;

  // Data
  fftSize : number = 512;
  dataArray : Uint8Array;
  prevArray : Uint8Array;


  // Analytics
  lowFFT : number = 1;
  midFFT : number = 1;
  highFFT : number = 1;
  bpm : number = 60;

  // AudioEffects
  chorus: Tone.Chorus;
  isChorus: boolean = false;
  tremolo: Tone.Tremolo;
  isTremolo: boolean = false;
  phaser: Tone.Phaser;
  isPhaser: boolean = false;



  constructor(audioRef?:MutableRefObject<any>) {
    if (audioRef) {
      this.audioRef = audioRef;
      this.source = this.context.createMediaElementSource(this.audioRef.current);
    }
    this.context = new AudioContext();
    Tone.setContext(this.context);
    this.chorus = new Tone.Chorus(4, 2.5, 0.5);
    this.tremolo = new Tone.Tremolo(9, 0.75);
    this.phaser = new Tone.Phaser({
      "frequency" : 15,
      "octaves" : 5,
      "baseFrequency" : 1000
    });
    this.isChorus = false;
    this.isTremolo = false;
    this.isPhaser = false;
    makeAutoObservable(this);
  }

  loadAudio(audioRef: MutableRefObject<any>, url:File) {
    this.audioRef = audioRef;

    if (!this.source) {
      this.source = this.context.createMediaElementSource(this.audioRef.current);
    } else {
      this.source = this.context.createMediaElementSource(this.audioRef.current);
    }

    this.audioRef.current.src = URL.createObjectURL(url);
    this.analyser = this.context.createAnalyser();
    this.source.connect(this.analyser);

    this.analyser.connect(this.context.destination);

    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.95;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // Calculate BPM after load
    let reader = new FileReader();

    reader.readAsArrayBuffer(url);
    reader.onloadend = () => {this.context.decodeAudioData(<ArrayBuffer>reader.result, this.tempoDetection);}
  }

  tempoDetection(buffer:AudioBuffer) {
    analyze(buffer).then((tempo) => {this.bpm = tempo;});
  }

  updateArray() {
    this.prevArray = this.dataArray;
    this.analyser.getByteFrequencyData(this.dataArray);
  }

  updateAnalytics() {
    let m1 = 6;
    let m2 = 15;
    let m3 = 110;

    this.lowFFT = mapLinear(this.avg(this.dataArray.slice(0, m1)), this.min(this.dataArray.slice(0, m1)), this.max(this.dataArray.slice(0, m1)), 0.0, 1.0);
    this.midFFT = mapLinear(this.avg(this.dataArray.slice(m1, m2)), this.min(this.dataArray.slice(m1, m2)), this.max(this.dataArray.slice(m1, m2)), 0.0, 1.0);
    this.highFFT = mapLinear(this.avg(this.dataArray.slice(m2, m3)), this.min(this.dataArray.slice(m2, m3)), this.max(this.dataArray.slice(m2, m3)), 0.0, 1.0);
  }

  getSmoothArray() {
    let smoothing = 2;
    let newArray = new Float32Array(this.dataArray.length);
    for (let i = 0; i < this.dataArray.length; i++) {
      let sum = 0;

      for (let index = i - smoothing; index <= i + smoothing; index++) {
        let thisIndex = index < 0 ? index + this.dataArray.length : index;
        sum += (this.dataArray[thisIndex] * 0.3 + this.prevArray[thisIndex] * 0.7);
      }
      newArray[i] = sum / ((smoothing*2)+1);
    }
    return newArray;
  }

  // Audio Effects to Add
  toggleChorus() {
    if (this.isChorus) {
      Tone.disconnect(this.source, this.chorus);
      Tone.disconnect(this.chorus, this.analyser);
      this.source.connect(this.analyser);

    } else {
      Tone.connect(this.source, this.chorus);
      Tone.connect(this.chorus, this.analyser);
    }
    this.isChorus = !this.isChorus;
  }

  updateChorus(f:number, delay:number, depth:number) {
    if (this.isChorus) {
      Tone.disconnect(this.source, this.chorus);
      Tone.disconnect(this.chorus, this.analyser);
      this.source.connect(this.analyser);
      this.isChorus = false;
    }
    // Create new
    this.chorus = new Tone.Chorus(f, delay, depth);
  }

  updatePhaser(f:number, octaves:number, baseF:number) {
    if (this.isPhaser) {
      Tone.disconnect(this.source, this.phaser);
      Tone.disconnect(this.phaser, this.analyser);
      this.source.connect(this.analyser);
      this.isPhaser = false;
    }
    // Create new
    this.phaser = new Tone.Phaser(f, octaves, baseF);

  }

  updateTremolo(f:number, depth:number) {
    if (this.isTremolo) {
      Tone.disconnect(this.source, this.tremolo);
      Tone.disconnect(this.tremolo, this.analyser);
      this.source.connect(this.analyser);
      this.isTremolo = false;
    }

    // Create new
    this.tremolo = new Tone.Tremolo(f, depth);
  }

  togglePhaser() {
    if (this.isPhaser) {
      Tone.disconnect(this.source, this.phaser);
      Tone.disconnect(this.phaser, this.analyser);
      this.source.connect(this.analyser);
    } else {
      Tone.connect(this.source, this.phaser);
      Tone.connect(this.phaser, this.analyser);
    }
    this.isPhaser = !this.isPhaser;
  }

  toggleTremolo() {
    if (this.isTremolo) {
      Tone.disconnect(this.source, this.tremolo);
      Tone.disconnect(this.tremolo, this.analyser);
      this.source.connect(this.analyser);
    } else {
      Tone.connect(this.source, this.tremolo);
      Tone.connect(this.tremolo, this.analyser);
    }
    this.isTremolo = !this.isTremolo;
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