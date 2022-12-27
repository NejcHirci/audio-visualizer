import * as React from "react";
import { useContext, useEffect, useMemo, useRef } from 'react'
import * as THREE from "three";
import { useFrame, useThree } from '@react-three/fiber'

import mandelbulb from '../shaders/mandelbulb'
import deformedSphere from '../shaders/deformedSphere'
import defaultFragShader from '../shaders/defaultFragShader'
import defaultVertexShader from '../shaders/defaultVertexShader'

import { ProjectStoreContext } from '../App'
import { mapLinear, smoothstep } from 'three/src/math/MathUtils'
import { Clock } from 'three'

export const RayMarched_MandelBulb = () => {
  let prevTime = 0, curTime;

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
    highFFT: { value: 0.0 },
    offsetTheta: {value: 0.0},
    bpm: { value: 0.0}
  }), []);


  useFrame((state, delta) => {
    let activeUniforms = meshRef.current.material.uniforms;
    curTime = state.clock.getElapsedTime();
    activeUniforms.iTime = state.clock.getElapsedTime();


    if (curTime - prevTime > 0.02) {
      activeUniforms.iRayOrigin.value = camera.position;
      activeUniforms.offsetTheta.value =
        (activeUniforms.offsetTheta.value * store.bpm / 60.0 + delta) % (2 * Math.PI);
      activeUniforms.bpm.value = store.bpm;
      if (store.audioRef || store.micEnabled) {
        store.updateArray();
        store.updateAnalytics();

        if (store.lowFFT + store.midFFT + store.highFFT > 0.0) {
          activeUniforms.lowFFT.value = 0.5 * activeUniforms.lowFFT.value + store.lowFFT * 0.5;
          activeUniforms.midFFT.value = 0.5 * activeUniforms.midFFT.value + store.midFFT * 0.5;
          activeUniforms.highFFT.value = 0.5 * activeUniforms.highFFT.value + store.highFFT * 0.5;
          activeUniforms.fftData.value = store.getSmoothArray();
        }
      }
      prevTime = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeBufferGeometry args={[2, 2, 1, 1]}/>
      <shaderMaterial
        attach={'material'}
        fragmentShader={deformedSphere}
        vertexShader={defaultVertexShader}
        uniforms={uniforms}
        wireframe={false}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}



