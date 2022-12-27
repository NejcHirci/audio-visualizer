import { MutableRefObject, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import StatsImpl from 'stats.js'

import { ProjectStoreContext } from '../App'

// Create appropriate JSX component from js
import { addTail, Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RayMarched_MandelBulb } from './RayMarched_MandelBulb'
import styled from 'styled-components'


export const AudioVisualizer = () => {
  return (
    <>
      <Suspense fallback={<div>Loading ...</div>}>
        <AnimationCanvas/>
      </Suspense>
    </>
  )
}

extend({OrbitControls});

const CameraControls = () => {
  const {camera, gl: {domElement}} = useThree();

  const controlsRef = useRef(null);
  useFrame(() => {
    controlsRef.current.update()
  });

  return (
    <orbitControls
      ref={controlsRef}
      args={[ camera, domElement ]}
      autoRotate={false}
    />
  )
}

const AnimationCanvas = () => {
  return (
    <Canvas camera={{position: [0, 3, 0]}}>
      <CameraControls/>
      <Suspense fallback={null}>
        <RayMarched_MandelBulb/>
      </Suspense>
      <Stats/>
    </Canvas>
  )

}

const Stats = () => {
  const [stats] = useState(() => new StatsImpl());
  // @ts-ignore
  useEffect(() => {
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    return () => document.body.removeChild(stats.dom);
  }, []);
  return useFrame(state => {
    stats.begin();
    state.gl.render(state.scene, state.camera);
    stats.end();
  }, 1);
}
