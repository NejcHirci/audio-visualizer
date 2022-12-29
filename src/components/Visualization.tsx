import * as React from 'react'
import { useContext, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { observer } from 'mobx-react-lite'

import mandelbulb from '../shaders/mandelbulb'
import defaultVertexShader from '../shaders/defaultVertexShader'
import menger_brocolli from '../shaders/menger_brocolli'

import { ProjectStoreContext } from '../App'
import menger_mushroom from '../shaders/menger_mushroom'
import savitzkyGolay from 'ml-savitzky-golay'


export const Visualization = observer(() => {
  const store = useContext(ProjectStoreContext)!
  let prevTime = 0, curTime
  const meshRef = useRef(null)
  const { camera } = useThree()

  useEffect(() => {
    const handleResize = () => {
      meshRef.current.material.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const uniforms = useMemo(() => ({
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iRayOrigin: { value: camera.position },
    offsetTheta: { value: 0.0 },
    // Audio Uniforms
    amplitudeSpectrum: { value: new Float32Array(128) },
    synthAmpSpectrum: { value: new Float32Array(128)},
    rms: { value: 0.0 },
    perceptualSpread: { value: 0.0 },
    chroma: { value: new Float32Array(13) },
    minChroma: {value: 0.0},
    bpm: { value: 0.0 }
  }), [])


  useFrame((state, delta) => {
    let activeUniforms = meshRef.current.material.uniforms;
    activeUniforms.iTime.value =  state.clock.getElapsedTime();
    activeUniforms.iRayOrigin.value = camera.position;
    activeUniforms.offsetTheta.value = (activeUniforms.offsetTheta.value + delta * store.bpm / 80.0) % (2 * Math.PI);
    activeUniforms.bpm.value = store.bpm

    if (store.amplitudeSpectrum) {
      let cur = store.getSmoothArray(new Float32Array(store.amplitudeSpectrum), store.prevAmpSpectrum, 0.1, false);
      activeUniforms.amplitudeSpectrum.value = cur;
      store.prevAmpSpectrum = cur;
    }
    if (store.chroma) {
      let cur = store.getSmoothArray(new Float32Array(store.chroma), store.prevChroma, 0.1, false);
      activeUniforms.chroma.value = cur;
      activeUniforms.minChroma.value = Math.min(...Array.from(cur));
      store.prevChroma = cur;
    }
    if (store.rms) {
      let val = store.rms * 0.5 + 0.5 * store.prevRms
      activeUniforms.rms.value = val;
      store.prevRms = val;
    }
    if (store.perceptualSpread) {
      let val = store.perceptualSpread * 0.01 + 0.99 * store.prevperceptualSpread;
      activeUniforms.perceptualSpread.value = val;
      store.prevperceptualSpread = val;
    }
    if (store.synthAmpSpectrum) {
      let cur = Array.from(store.synthAmpSpectrum);
      activeUniforms.synthAmpSpectrum.value = new Float32Array(savitzkyGolay(cur, 1,
        {derivative: 0, pad: 'post', padValue: 'replicate'}));
    }

  })

  return (
    <mesh ref={meshRef}>
      <planeBufferGeometry args={[2, 2, 1, 1]} />
      {store.selectedVisualization == 1 &&
        <shaderMaterial
          attach={'material'}
          fragmentShader={mandelbulb}
          vertexShader={defaultVertexShader}
          uniforms={uniforms}
          wireframe={false}
          depthWrite={false}
          depthTest={false}
        />
      }
      {store.selectedVisualization == 2 &&
        <shaderMaterial
          attach={'material'}
          fragmentShader={menger_brocolli}
          vertexShader={defaultVertexShader}
          uniforms={uniforms}
          wireframe={false}
          depthWrite={false}
          depthTest={false}
        />
      }
      {store.selectedVisualization == 3 &&
        <shaderMaterial
          attach={'material'}
          fragmentShader={menger_mushroom}
          vertexShader={defaultVertexShader}
          uniforms={uniforms}
          wireframe={false}
          depthWrite={false}
          depthTest={false}
        />
      }
    </mesh>
  )
})



