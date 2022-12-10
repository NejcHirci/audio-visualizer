import * as React from "react";
import {useFrame, useLoader} from "@react-three/fiber";
import * as THREE from "three";
import circleImg from "../assets/circle.png";
import { useCallback, useContext, useMemo, useRef } from 'react'
import { Color, Spherical, Vector3 } from 'three'
import { lerp, mapLinear, randFloat, randInt } from 'three/src/math/MathUtils'
import { ProjectStoreContext } from '../App'



/**
 * MandelBulb
 * A triplex number (x, y, z) with spherical coordinates (r, THETA, PHI)
 *
 *
 *
 * **/

export const PointMandelBulb = () => {
    const store = useContext(ProjectStoreContext);
    const pointsBufferRef = useRef(null);
    const colorBufferRef = useRef(null);

    useFrame((state, delta) => {
        if (store && store.analyser) {
            store.updateArray();
        }
    });

    const DIM = 128;

    useFrame(() => {
        // We want to simply move position by a small amount in or out from the
        // direction of the center
        if (store.dataArray) {

            for (let i = 0; i < positions.length; i += 3) {
                let val = store.dataArray[Math.floor(i / 3) % store.dataArray.length];
                pointsBufferRef.current.array[i] += randInt(-1, 1);
            }
            pointsBufferRef.current.needsUpdate = true;
        }
    });

    let [positions, colors] = useMemo(() => {
        let arr = [];
        let colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < DIM; i++) {
            for (let j = 0; j < DIM; j++) {
                let edge = false;
                for (let k = 0; k < DIM; k++) {
                    // We want to keep initial x, y, z between -0.5 and 0.5
                    let x = mapLinear(i, 0, DIM, -1, 1);
                    let y = mapLinear(j, 0, DIM, -1, 1);
                    let z = mapLinear(k, 0, DIM, -1, 1);

                    let zeta = new Vector3(0, 0,0);
                    let spherical = new Spherical();

                    let n = 8;
                    let maxiterations = 30;
                    let iteration = 0;

                    while (true) {
                        spherical = new Spherical();
                        spherical.setFromCartesianCoords(zeta.x, zeta.y, zeta.z);
                        let newx = Math.pow(spherical.radius, n) * Math.sin(spherical.theta * n) * Math.cos(spherical.phi * n);
                        let newy = Math.pow(spherical.radius, n) * Math.sin(spherical.theta * n) * Math.sin(spherical.phi * n);
                        let newz = Math.pow(spherical.radius, n) * Math.cos(spherical.theta * n);

                        zeta.x = newx + x;
                        zeta.y = newy + y;
                        zeta.z = newz + z;

                        iteration++;

                        if (spherical.radius > 2) {
                            if (edge) { edge = false; }
                            break;
                        }

                        if (iteration > maxiterations) {
                            if (!edge) {
                                edge = true;
                                arr.push(100 * x, 100 * y, 100 * z);
                            }
                            break;
                        }
                    }
                }
            }
        }

        for (let i=0; i < arr.length; i+=3) {
            let x = arr[i];
            let y = arr[i];
            let z = arr[i];
            let alpha = Math.sqrt(x * x + y * y + z * z) / 200;
            color.lerpColors(new Color('red'), new Color('green'), alpha);
            colors.push(color.r, color.g, color.b);
        }



        return [new Float32Array(arr), new Float32Array(colors)];
    } , []);

    return (
        <points>
            <bufferGeometry attach={"geometry"}>
                <bufferAttribute
                    ref={pointsBufferRef}
                    attachObject={['attributes', 'position']}
                    array={positions}
                    count={positions.length / 3}
                    itemSize={3}
                />
                <bufferAttribute
                    ref={colorBufferRef}
                    attachObject={['attributes', 'color']}
                    array={colors}
                    count = {colors.length / 3}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                attach={"material"}
                vertexColors={true}
                size={0.5}
                sizeAttenuation={true}
                transparent={false}
                alphaTest={0.5}
                opacity={1.0}
            />
        </points>
    );
}
