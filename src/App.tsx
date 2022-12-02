import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as React from 'react'
import { createContext, Suspense, useCallback, useMemo, useRef } from 'react'
import { Canvas, extend, useFrame, useLoader, useThree } from '@react-three/fiber'

import './App.css'
import { UserInterface } from './components/UserInterface'
import { AudioVisualizer } from './components/AudioVisualizer'
import { ProjectStore } from './store/project_store'

export const projectStore = new ProjectStore();
export const ProjectStoreContext = createContext<ProjectStore>(projectStore);

const App = () => {
  return (
    <ProjectStoreContext.Provider value={projectStore}>
      <div className={'anim'}>
        <AudioVisualizer/>
        <UserInterface/>
      </div>
    </ProjectStoreContext.Provider>
  )
}

export default App