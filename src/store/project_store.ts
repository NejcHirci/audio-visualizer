import { makeAutoObservable } from 'mobx'
import { MutableRefObject } from 'react'

export class ProjectStore {

  audioRef : MutableRefObject<any>
  context : AudioContext;

  // Nodes
  source : MediaElementAudioSourceNode;
  analyser : AnalyserNode;

  // Data
  fftSize : number = 512;
  dataArray : Uint8Array;

  constructor(audioRef?:MutableRefObject<any>, fftSize?:number) {
    if (audioRef) {
      this.audioRef = audioRef;
      this.source = this.context.createMediaElementSource(this.audioRef.current);
    }

    if (fftSize) this.fftSize = fftSize;

    this.context = new AudioContext();
    makeAutoObservable(this);
  }

  loadAudio(audioRef: MutableRefObject<any>, url:File) {
    this.audioRef = audioRef;

    if (!this.source) {
      this.source = this.context.createMediaElementSource(this.audioRef.current);
    }

    this.audioRef.current.src = URL.createObjectURL(url);
    this.analyser = this.context.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.analyser.fftSize = this.fftSize;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  updateArray() {
    this.analyser.getByteFrequencyData(this.dataArray);
  }
}