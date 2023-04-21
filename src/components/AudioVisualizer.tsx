import { MutableRefObject, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import StatsImpl from 'stats.js'

import { ProjectStoreContext } from '../App'

// Create appropriate JSX component from js
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Visualization } from './Visualization'


export const AudioVisualizer = () => {
  const [toggle, setToggle] = useState(false)

  // Toggle stats if we press 's' button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's') {
        setToggle(prevState => !prevState);
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle]);


  return (
    <>
      <Suspense fallback={<div>Loading ...</div>}>
        <Canvas camera={{position: [0, 0, 3]}}>
          <CameraControls/>
          <Suspense fallback={null}>
            <Visualization/>
          </Suspense>
          {toggle && <Stats/>}
        </Canvas>
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
