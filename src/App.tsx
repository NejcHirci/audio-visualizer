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


const Points = () => {
    const imgTex = useLoader(THREE.TextureLoader, circleImg);
    const bufferRef = useRef(null);

    let t = 0;
    let f = 0.002;
    let a = 5;
    const graph = useCallback((x, z) => {
        return Math.sin(f * (x ** 2 + z ** 2 + t)) * a;
    }, [t, f, a]);

    const count = 100;
    const dist = 3;
    // [x1, y1, z1, x2, y2, z2, ...]
    let positions = useMemo(() => {
        let arr = [];

        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                let x = dist * (xi - count / 2);
                let z = dist * (zi - count / 2);
                let y = graph(x, z);
                arr.push(x, y, z);
            }
        }

        return new Float32Array(arr);
    } , []);

    // Hook that is called every frame in THREE.js
    useFrame(() => {
        t += 15;
        const positions = bufferRef.current.array;

        let i = 0;
        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                let x = dist * (xi - count / 2);
                let z = dist * (zi - count / 2);

                positions[i + 1] = graph(x, z);
                i += 3;
            }
        }
        bufferRef.current.needsUpdate = true;
    });

    return (
        <points>
            <bufferGeometry attach={"geometry"}>
                <bufferAttribute
                    ref={bufferRef}
                    attachObject={['attributes', 'position']}
                    array={positions}
                    count={positions.length / 3}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                attach={"material"}
                map={imgTex}
                color={0x00AAFF}
                size={0.5}
                sizeAttenuation={true}
                transparent={false}
                alphaTest={0.5}
                opacity={1.0}
            />
        </points>
    );
}

const AnimationCanvas = () => {
    return (
        <Canvas camera={{position: [100, 10, 0], fov: 75}}>
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