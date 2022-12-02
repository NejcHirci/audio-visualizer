import * as React from "react";
import {useFrame, useLoader} from "@react-three/fiber";
import * as THREE from "three";
import circleImg from "../assets/circle.png";
import {useCallback, useMemo, useRef} from "react";
import { Color, Spherical, Vector3 } from 'three'
import { lerp, randFloat, randInt } from 'three/src/math/MathUtils'



/**
 * MandelBulb
 * A triplex number (x, y, z) with spherical coordinates (r, THETA, PHI)
 *
 *
 *
 * **/

export const MandelBulb = () => {
    const pointsBufferRef = useRef(null);
    const colorBufferRef = useRef(null);

    const DIM = 128;

    let [positions, colors] = useMemo(() => {
        let arr = [];
        let colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < DIM; i++) {
            for (let j = 0; j < DIM; j++) {
                for (let k = 0; k < DIM; k++) {

                    // We want to keep initial x, y, z between -1 and 1
                    let x = (i - DIM / 2) / (DIM / 2);
                    let y = (j - DIM / 2) / (DIM / 2);
                    let z = (k - DIM / 2) / (DIM / 2);

                    let zeta = new Vector3(0, 0,0);
                    let spherical = new Spherical();

                    let n = 8;
                    let maxiterations = 20;
                    let iteration = 0;
                    while (iteration <= maxiterations) {
                        spherical.setFromCartesianCoords(zeta.x, zeta.y, zeta.z);
                        let newx = Math.pow(spherical.radius, n) * Math.sin(spherical.theta * n) * Math.cos(spherical.phi * n);
                        let newy = Math.pow(spherical.radius, n) * Math.sin(spherical.theta * n) * Math.sin(spherical.phi * n);
                        let newz = Math.pow(spherical.radius, n) * Math.cos(spherical.theta * n);
                        zeta.x = newx + x;
                        zeta.y = newy + y;
                        zeta.z = newz + z;

                        iteration++;

                        if (spherical.radius > 16) { break; }

                        if (iteration > maxiterations) {
                            arr.push(100 * zeta.x, 100 * zeta.y, 100 * zeta.z);
                        }
                    }
                }
            }
        }

        let maxRadius = 0;

        for (let i=0; i < arr.length; i+=3) {
            let x = arr[i];
            let y = arr[i];
            let z = arr[i];
            maxRadius = Math.max(maxRadius, Math.sqrt(x*x + y*y + z*z));
        }

        for (let i=0; i < arr.length; i+=3) {
            let x = arr[i];
            let y = arr[i];
            let z = arr[i];
            let alpha = Math.sqrt(x * x + y * y + z * z) / 300;
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
