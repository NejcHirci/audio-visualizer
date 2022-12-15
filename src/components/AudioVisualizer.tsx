import { MutableRefObject, Suspense, useContext, useRef } from 'react'
import * as React from 'react'
import { ProjectStoreContext } from '../App'

// Create appropriate JSX component from js
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RayMarched_MandelBulb } from './RayMarched_MandelBulb'


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
    </Canvas>
  )

}

