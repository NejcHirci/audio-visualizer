import * as React from "react";
import {useFrame, useLoader} from "@react-three/fiber";
import * as THREE from "three";
import circleImg from "../assets/circle.png";
import { useCallback, useContext, useMemo, useRef } from 'react'
import { Color, Spherical, Vector3 } from 'three'
import { lerp, mapLinear, randFloat, randInt } from 'three/src/math/MathUtils'
import { ProjectStoreContext } from '../App'

export const BasicSphere = () => {
  const store = useContext(ProjectStoreContext);
  const sphereRef = useRef(null);

  let posOriginal: Float32Array = new Float32Array();


  useFrame(() => {
    if (store.dataArray) {
      store.updateArray();


      let pos = sphereRef.current.geometry.attributes.position.array;
      let normals = sphereRef.current.geometry.attributes.normal.array;

      if (posOriginal.length < 1) {
        posOriginal = new Float32Array(pos);
      }
      for (let i = 0; i < pos.length; i += 3) {
        let val = store.dataArray[Math.floor(i / 3) % store.dataArray.length];
        pos[i] = posOriginal[i] + normals[i] * Math.max(Math.min(0.05, val), -0.05);
        pos[i+1] = posOriginal[i+1] + normals[i+1] * Math.max(Math.min(0.05, val), -0.05);
        pos[i+2] = posOriginal[i+2] + normals[i+2] * Math.max(Math.min(0.05, val), -0.05);
      }
      sphereRef.current.geometry.attributes.position.needsUpdate = true;
      //sphereRef.current.geometry.computeVertexNormals();
    }
  });


  return (
    <mesh ref={sphereRef} position={[0, 0, 0]} scale={[100, 100, 100]}>
      <sphereGeometry attach="geometry" args={[0.5, 64, 64]} />
      <meshLambertMaterial wireframe={false} attach="material"/>
    </mesh>
  );
}
