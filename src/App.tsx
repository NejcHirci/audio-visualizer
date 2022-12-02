import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import * as React from "react";
import {Suspense, useCallback, useMemo, useRef} from "react";
import {Canvas, extend, useFrame, useLoader, useThree} from "@react-three/fiber";

import './App.css';
import circleImg from './assets/circle.png';
import {UserInterface} from "./gui/UserInterface";
import {MandelBulb} from "./components/MandelBulb";


// Create appropriate JSX component from js
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
                <MandelBulb/>
            </Suspense>
            <CameraControls/>
        </Canvas>
    )

}

const App = () => {
    return (
        <div className={"anim"}>
            <Suspense fallback={<div>Loading ...</div>}>
                <AnimationCanvas/>
            </Suspense>
            <UserInterface/>
        </div>
    );
}

export default App;