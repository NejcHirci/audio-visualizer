import { MutableRefObject, Suspense, useContext, useRef } from 'react'
import * as React from 'react'
import { ProjectStoreContext } from '../App'

// Create appropriate JSX component from js
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MandelBulb } from './MandelBulb'
import { BasicSphere } from './BasicSphere'


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
      autoRotate={true}
      autoRotateSpeed={-0.2}
    />
  )
}

const AnimationCanvas = () => {
  return (
    <Canvas camera={{position: [100, 10, 0], fov: 75}}>
      <color attach="background" args={['black']} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.1}/>
        <pointLight position={[100, 20, 10]} intensity={1.5} />
        <BasicSphere/>
      </Suspense>
      <CameraControls/>
    </Canvas>
  )

}

