export default `
  precision mediump float;
  
  // Ray Marching Settings
  #define MAX_RAY_STEPS 50
  #define MAX_DIST 100.
  #define MIN_DIST .001

  // Constants 
  #define PI 3.141592653589793238
  #define EPS 1e-6
  
  // Basic uniform
  uniform float iTime;
  uniform float offsetTheta;
  uniform vec3 iRayOrigin;
  uniform vec2 iResolution;
  
  
  // Audio Visualization settings
  #define buffSize 128
  uniform float [buffSize] amplitudeSpectrum;
  uniform float [buffSize] synthAmpSpectrum;
  uniform float rms;
  uniform float spectralCentroid;
  uniform float perceptualSpread;
  uniform float [13] chroma;
  uniform float minChroma;
  uniform float [13] mfcc;
  uniform float bpm;
  
  // TRANSFORM FUNCTIONS //
  
  vec3 calculateRayDir (vec2 uv, vec3 ro, vec3 lookat, float zoom) {
    vec3 f = normalize (lookat - ro),
      r = normalize (cross (vec3 (0, 1, 0), f)),
      u = cross (f, r),
      c = f * zoom,
      i = c + uv.x * r + uv.y * u,
      d = normalize (i);
    return d;
  }
  
  vec3 hsv2rgb (vec3 c) {
    vec4 K = vec4 (1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs (fract (c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix (K.xxx, clamp (p - K.xxx, 0.0, 1.0), c.y);
  }
  
  float map (float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }
  
  float mandelbulb (vec3 position, float p) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    float power = p;
  
    for (int i = 0; i < 10; i++) {
      r = length (z);
  
      if (r > 2.0) { break; }
  
      // convert to polar coordinates
      float theta = acos (z.z / r);
      float phi = atan (z.y, z.x);
      dr = pow (r, power - 1.0) * power * dr + 1.0;
  
      // scale and rotate the point
      float zr = pow (r, power);
      theta = theta * power ;
      phi = phi * power;
      
      theta = theta + offsetTheta;
      
      // convert back to cartesian coordinates
      z = zr * vec3 (sin (theta) * cos (phi), sin (phi) * sin (theta), cos (theta));
      z += position;
    }
    
    float dst = 0.5 * log (r) * r / dr;
    return dst;
  }
  
  // Calculate displacement
  float displacement(vec3 p) {
    float theta = map(max(length(p), 0.3), 0.3, 10.0, 0.0, 1.0);
    int index = int(theta * float(buffSize));
    float ampVal = mix(0.5, -0.5, amplitudeSpectrum[index]);
    float synthVal = synthAmpSpectrum[index];
    return ((ampVal + synthVal) / 2.0) * 0.05f * pow((1. - theta), 4.);
  }
  
  // Calculates de distance from a position p to the scene
  float getSceneDistance (vec3 p) {
    return mandelbulb(p, 6.0) - displacement(p);
  }
  
  // Marches the ray in the scene
  vec4 RayMarcher (vec3 ro, vec3 rd) {
    float steps = 0.0;
    float totalDistance = 0.0;
    float minDistToScene = 300.0;
    vec3 minDistToScenePos = ro;
    vec4 col = vec4 (0.0, 0.0, 0.0, 1.0);
    vec3 curPos = ro;
    bool hit = false;
  
    for (steps = 0.0; steps < float (MAX_RAY_STEPS); steps++) {
      vec3 p = ro + totalDistance * rd; // Current position of the ray
      float distance = getSceneDistance (p); // Distance from the current position to the scene
      curPos = ro + rd * totalDistance;
      
      // Tracked for color calculation
      if (minDistToScene > distance) {
        minDistToScene = distance;
        minDistToScenePos = curPos;
      }
      
      totalDistance += distance; // Increases the total distance ray marched
      
      // If distance is smaller than MIN_DIST this is an edge
      if (distance < MIN_DIST) {
        hit = true;
        break; 
      } 
      // If the ray marched more than MAX_DIST, break out
      else if (distance > MAX_DIST) { break; }
    }
    
    
    
    if (hit) {
      col.rgb = vec3 (6.0 + length(curPos), 0.76 + (perceptualSpread) * 0.1, 0.8);
      col.rgb = hsv2rgb (col.rgb);
    }
    else {
      col.rgb = vec3 (6.0 + length(minDistToScenePos), 0.76 + (perceptualSpread) * 0.1, 0.8);
      col.rgb = hsv2rgb (col.rgb);
      col.rgb *= 1.0 / (minDistToScene * minDistToScene);
      col.rgb /= map (sin((iTime * 0.01)), -1.0, 1.0, 10.0, 300.0);
    }
  
    col.rgb /= steps * 0.08; // ambient occlusion approximation
  
    return col;
  }
  
  void main () {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(-iRayOrigin.x, iRayOrigin.y, iRayOrigin.z); // Ray origin
    
    vec3 lookAt = vec3(0);
    vec3 rd = calculateRayDir(uv, ro, lookAt, 2.); // Ray direction (based on mouse rotation)

    vec4 col = RayMarcher (ro, rd);
  
    // Output to screen
    gl_FragColor = vec4 (col.rgb, 1.0);
  }
`