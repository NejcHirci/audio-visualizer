import * as React from "react";
import {useFrame, useLoader} from "@react-three/fiber";
import * as THREE from "three";
import circleImg from "../assets/circle.png";
import { useCallback, useContext, useMemo, useRef } from 'react'
import { Color, Spherical, Vector3 } from 'three'
import { lerp, mapLinear, randFloat, randInt } from 'three/src/math/MathUtils'
import { ProjectStoreContext } from '../App'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise'

export const BasicSphere = () => {
  const noise = new SimplexNoise();
  const store = useContext(ProjectStoreContext);
  const sphereRef = useRef(null);

  let posOriginal: Float32Array = new Float32Array();


  useFrame((state, delta) => {
    if (store.dataArray) {
      store.updateArray();

      // Calculate important features from FFT

      let lowerHalfArray = store.dataArray.slice(0, (store.dataArray.length/2) - 1);
      let upperHalfArray = store.dataArray.slice((store.dataArray.length/2) - 1,
        store.dataArray.length - 1);

      let lowerMax = max(lowerHalfArray);
      let upperAvg = avg(upperHalfArray);


      console.log(lowerMax);
      console.log(upperAvg);

      let lowerMaxFr = lowerMax / lowerHalfArray.length;
      let upperAvgFr = upperAvg / upperHalfArray.length;

      let pos = sphereRef.current.geometry.attributes.position.array;
      let normal = sphereRef.current.geometry.attributes.normal.array;

      if (posOriginal.length < 1) {
        posOriginal = new Float32Array(pos);
      }
      for (let i = 0; i < pos.length; i += 3) {
        let rf = 0.00001;
        let noiseVec = noise.noise3d(
          pos[i] + rf,
          pos[i+1] + rf,
          pos[i+2] + rf);

        let distance = (sphereRef.current.geometry.parameters.radius +
        lowerMaxFr ) + noiseVec * upperAvgFr;

        console.log(distance);
        //pos[i] = posOriginal[i] + normal * distance
        //pos[i+1] = posOriginal[i+1] + normal * distance;
        //pos[i+2] = posOriginal[i+2] + normal * distance;
      }
      sphereRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });


  return (
    <mesh ref={sphereRef} position={[0, 0, 0]} scale={[100, 100, 100]}>
      <sphereGeometry attach="geometry" args={[0.5, 64, 64]} />
      <meshNormalMaterial wireframe={false} attach="material"/>
    </mesh>
  );


  /** FOURIER TRANSFORM THINK
   * => 8 bins
   *
   *
   *
   *
   * */


  /** ARRAY UTILITY FUNCITONS */

  function max(arr:Uint8Array) {
    return arr.reduce((a,b) => a > b ? a : b);
  }

  function avg(arr: Uint8Array) {
    return arr.reduce((a, b) =>  (a + b) / arr.length);
  }
}


