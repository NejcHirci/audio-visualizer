import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import THREE = require('three')
import { BufferAttribute, BufferGeometry, IcosahedronGeometry, Mesh, MeshBasicMaterial } from 'three'


export const PoppingSphere = () => {
  const normalBufferRef = useRef(null)
  let rot = 0
  const clock = new THREE.Clock();

  let [mesh, normals] = useMemo(() => {
    const geometry = new IcosahedronGeometry(1, 10)
    const pos = geometry.getAttribute('position').array
    const norms = []
    const arr = []

    for (let i = 0; i < pos.length; i += 9) {
      const normal = new THREE.Vector3(
        (pos[i] + pos[i + 3] + pos[i + 6]) / 3,
        (pos[i + 1] + pos[i + 4] + pos[i + 7]) / 3,
        (pos[i + 2] + pos[i + 5] + pos[i + 8]) / 3
      )
      normal.normalize()
      norms.push(normal.x, normal.y, normal.z);
    }
    return [null, new Float32Array(norms)];
  }, []);

  return (
    mesh.map(() => {
      return (
        <mesh>
          <bufferGeometry attach={"geometry"}>
            <icosahedronBufferGeometry
              attachObject={['attributes', 'position']}
            />
            <bufferAttribute
              attachObject={['attributes', 'normal']}
              ref={normalBufferRef}
              array={normals}
            />
          </bufferGeometry>
          <meshBasicMaterial wireframe={false} color={0xc100eb}/>
        </mesh>);
    })
  )
}