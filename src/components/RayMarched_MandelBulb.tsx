import * as React from "react";
import { useContext, useEffect, useMemo, useRef } from 'react'
import * as THREE from "three";
import { useFrame, useThree } from '@react-three/fiber'

import mandelbulb from '../shaders/mandelbulb'
import defaultFragShader from '../shaders/defaultFragShader'
import defaultVertexShader from '../shaders/defaultVertexShader'
import { ProjectStoreContext } from '../App'
import { mapLinear, smoothstep } from 'three/src/math/MathUtils'
import { Clock } from 'three'

export const RayMarched_MandelBulb = () => {
  const meshRef=useRef(null);
  const {camera} = useThree();
  const store = useContext(ProjectStoreContext);

  useEffect(() => {
    const handleResize = () => {
      meshRef.current.material.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const uniforms = useMemo(() => ({
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iRayOrigin: { value: camera.position },
    fftData: { value: new Float32Array(64)},
    lowFFT: { value: 0.0 },
    midFFT: { value: 0.0 },
    highFFT: { value: 0.0 }
  }), []);


  useFrame((state, delta) => {
    meshRef.current.material.uniforms.iRayOrigin.value = camera.position;

    if (store.analyser && !store.audioRef.current.paused) {
      meshRef.current.material.uniforms.iTime.value += delta;
      store.updateArray();

      let m1 = Math.round(store.analyser.frequencyBinCount / 3);
      let m2 = Math.round(store.analyser.frequencyBinCount * 2 / 3);
      let m3 = store.analyser.frequencyBinCount

      if (max(store.dataArray) > 0.0) {
        let lowFFT = mapLinear(avg(store.dataArray.slice(0, m1)), min(store.dataArray.slice(0, m1)), max(store.dataArray.slice(0, m1)), 0.9, 1.5);
        let midFFT = mapLinear(avg(store.dataArray.slice(m1, m2)), min(store.dataArray.slice(m1, m2)), max(store.dataArray.slice(m1, m2)), 0.9, 1.5);
        let highFFT = mapLinear(avg(store.dataArray.slice(m2, m3)), min(store.dataArray.slice(m2, m3)), max(store.dataArray.slice(m2, m3)), 0.9, 1.5);

        meshRef.current.material.uniforms.lowFFT.value = !isNaN(lowFFT) ? lowFFT : 0.0;
        meshRef.current.material.uniforms.midFFT.value = !isNaN(midFFT) ? midFFT : 0.0;
        meshRef.current.material.uniforms.highFFT.value = !isNaN(highFFT) ? highFFT : 0.0;
        meshRef.current.material.uniforms.fftData.value = new Float32Array(store.dataArray);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeBufferGeometry args={[2, 2, 1, 1]}/>
      <shaderMaterial
        attach={'material'}
        fragmentShader={mandelbulb}
        vertexShader={defaultVertexShader}
        uniforms={uniforms}
        wireframe={false}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function avg(arr:Uint8Array) {
  return arr.reduce((p, c) => p+c, 0);
}

function max(arr:Uint8Array) {
  return arr.reduce((a, b) => a > b ? a : b);
}

function min(arr:Uint8Array) {
  return arr.reduce((a, b) => a < b ? a : b);
}

