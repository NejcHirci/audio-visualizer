import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import audioSample from "./audio/sound_helix.mp3"
import { createNoise3D } from 'simplex-noise'
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2


/** ============= BASIC AUDIO LISTENER ============= **/
const listener = new THREE.AudioListener();
camera.add( listener );
console.log('ADDED AUDIO LISTENER');

// create an Audio source
const audio = new Audio(audioSample);
const context = new AudioContext();
const src = context.createMediaElementSource(audio);
const analyzer = context.createAnalyser();
src.connect(analyzer);
analyzer.connect(context.destination);
analyzer.fftSize = 32;
const bufferLength = analyzer.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

/** ============= BASE RENDER SETTINGS  ============= **/
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.SphereGeometry()
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
})

const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function makeRoughObject(mesh:THREE.Mesh, bassFr:number, treFr:number) {
    // Create multiplication matrix for each vector
    const positions = mesh.geometry.attributes.position.array

    let x,y,z;
    x = y = z = 0;
    for (let i=0; i < positions.length;) {
        x = positions [ i++ ];
        y = positions [ i++ ];
        z = positions [ i++ ];

        let vecSize = Math.sqrt(x*x + y*y +z*z);
        let offset:number = mesh.geometry.attributes.radius.;
        let time = window.performance.now();

        x = x / vecSize;
        y = y / vecSize;
        z = z / vecSize;

        let distance = (offset + bassFr) + createNoise3D(

        ) * 1.1 * treFr;
        x *= distance;
        y *= distance;
        z *= distance;
    }
}

function animate() {
    requestAnimationFrame(animate)

    let speed = 0.01;
    sphere.scale.x = 1 + avg(dataArray) * speed;

    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;

    controls.update()

    render()
}

// runs at every update
function render() {
    analyzer.getByteFrequencyData(dataArray);

    // slice the array into two halves
    let lowerHalf = dataArray.slice(0, dataArray.length/2 -1);
    let upperHalf = dataArray.slice(dataArray.length/2 - 1, dataArray.length - 1);

    // Do some normalisations
    let lowerMax = max(lowerHalf);
    let lowerAvg = avg(lowerHalf);
    let upperAvg = avg(upperHalf);

    /* use the reduced values to modulate the 3d objects */
    makeRoughObject()

    console.log(dataArray);
    renderer.render(scene, camera)
}

// Begin animation loop
window.onload = () => {
    audio.load();
    audio.play();
}
animate()

/** ============ ARRAY FUNCTIONS ============ **/
function avg(arr:Uint8Array) {
    let total = arr.reduce((sum, b) => {return sum + b});
    return (total / arr.length);
}

function max(arr:Uint8Array) {
    return arr.reduce((a, b) => {return Math.max(a, b)});
}