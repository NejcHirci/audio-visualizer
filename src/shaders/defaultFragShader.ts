export default `
in vec2 vUv;
 
void main() {
    gl_FragColor = vec4( 0.0, vUv.x, vUv.y, 1.0 );
}
`