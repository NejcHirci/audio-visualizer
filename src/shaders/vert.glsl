uniform float u_time;
uniform sampler2DArray signal;

out vec3 vPosition;
out vec3 vNormal;
out vec3 vColor;


void main() {
    vUv = uv;

    position = max(signal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}