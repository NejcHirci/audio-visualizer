import * as React from "react";
import {useFrame, useLoader} from "@react-three/fiber";
import * as THREE from "three";
import circleImg from "../assets/circle.png";
import {useCallback, useMemo, useRef} from "react";
import {Spherical, Vector3} from "three";



/**
 * MandelBulb
 * A triplex number (x, y, z) with spherical coordinates (r, THETA, PHI)
 *
 *
 *
 * **/

export const MandelBulb = () => {
    const imgTex = useLoader(THREE.TextureLoader, circleImg);
    const bufferRef = useRef(null);

    const DIM = 64;
    const dist = 3;

    let positions = useMemo(() => {
        let arr = [];

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
        console.log(arr);

        return new Float32Array(arr);
    } , []);

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
