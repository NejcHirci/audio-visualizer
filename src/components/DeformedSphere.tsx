import * as React from "react";
import { useRef } from 'react'
import { useLoader } from '@react-three/fiber'


export const DeformedSphere = () => {
    const pointsBufferRef = useRef(null);
    const colorBufferRef = useRef(null);
    return (
        <mesh position={[0, 0, 0]}>
            <sphereBufferGeometry/>
            <meshStandardMaterial
                color={'white'}
                displacementMap={}
            />
        </mesh>
    );
}