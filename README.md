# Fractal audio visualizer

Source code for the React website [Audio Visualizer](https://nejchirci.github.io/audio-visualizer) developed in 
React 3 Fiber, which is a fork of THREE.js library. 

Rendering of fractals was done with a ray marching shader solution.

## Install and run

```bash
git clone git@github.com:NejcHirci/audio-visualizer.git
npm install
npm run
```

## Known Bugs

Sometimes the browser doesn't create an AudioContext in which case the site should be refreshed a couple of times.
