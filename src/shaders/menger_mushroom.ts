export default `
  precision mediump float;
  
  // Ray Marching Settings
  #define MAX_RAY_STEPS 50
  #define MAX_DIST 150.
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
  
  mat2 rotate2d (float angle) {
    float s = sin (angle);
    float c = cos (angle);
    return mat2 (c, -s, s, c);
  }
  
  vec3 calcRayDirection (vec2 uv, vec3 ro, vec3 lookat, float zoom) {
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
  
  float mengermushroom (vec3 z) {
    float iterations = 20.0;
    float Scale = 2.6 + (sin (iTime / 5.0) * 0.5);
    vec3 Offset = 0.8 * vec3 (1.0, 1.0, 1.0);
  
    float r = length (z);
    int n = 0;
    while (n < int (iterations)) {
      z.yx *= rotate2d(sin (iTime / 5.0));
  
      z.x = abs (z.x);
      z.y = abs (z.y);
      z.z = abs (z.z);
  
      if (z.x - z.y < 0.0) z.xy = z.yx; // fold 1
      if (z.x - z.z < 0.0) z.xz = z.zx; // fold 2
      if (z.y - z.z < 0.0) z.zy = z.yz; // fold 3
  
      z.yz *= rotate2d(sin (iTime / 2.0) / 2.0);
      z.xz *= rotate2d(sin (iTime / 2.0) / 5.0);
  
      z.x = z.x * Scale - Offset.x * (Scale - 1.0);
      z.y = z.y * Scale - Offset.y * (Scale - 1.0);
      z.z = z.z * Scale;
  
      if (z.z > 0.5 * Offset.z * (Scale - 1.0)) {
        z.z -= Offset.z * (Scale - 1.0);
      }
  
      r = length (z);
  
      n++;
    }
  
    return (length (z) - 2.0) * pow (Scale, -float (n));
  }
  
  float sdSphere( vec3 p, float s ) {
    float d1 = length(p) - s;
    return d1;
  }
  
  // Calculate displacement
  float displacement(vec3 p) {
    float theta = map(max(length(p), 0.3), 0.3, 10.0, 0.0, 1.0);
    int index = int(theta * float(buffSize));
    float ampVal = amplitudeSpectrum[index];
    float synthVal = synthAmpSpectrum[index];
    float displacement = ((ampVal + synthVal) / 2.0) * 0.01 * pow((1. - theta), 4.);
    
    return displacement;
  }
  
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0-h);
  }
  
  float metaBalls (vec3 pos) {
    float ballRadius = 0.001;
    float k = 0.2;
    float outVal = MAX_DIST;
    vec3 bPos;
    
    int index = 0;

    for (float j=-0.8; j <= 0.8; j+=0.4) {
      vec2 xy = vec2(sqrt(1.1 - j*j), 0.0) * rotate2d(offsetTheta);
      bPos = pos + vec3(xy.x, xy.y, j);
      outVal = smin(outVal, sdSphere(bPos, ballRadius + map(chroma[index], minChroma, 1., 0., 0.2)), k);
      index++;
    }
    
    return outVal;
  }
  
  
  // Calculates de distance from a position p to the scene
  float getSceneDistance (vec3 p) {
    float fractal = mengermushroom(p) - displacement(p);
    float balls = metaBalls(p);
    return smin(fractal, balls, 0.4);
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
      col.rgb = vec3 (6.0 + (length (curPos) / 0.5), 0.76 + (perceptualSpread) * 0.01, 0.2);
      col.rgb = hsv2rgb (col.rgb);
    }
    else {
      col.rgb = vec3 (6.0 + (length (minDistToScenePos) / 0.5), 0.76 + (perceptualSpread) * 0.01, 0.2);
      col.rgb = hsv2rgb (col.rgb);
      col.rgb *= 1.0 / (minDistToScene * minDistToScene);
      col.rgb /= map (sin((iTime * 0.01)), -1.0, 1.0, 1000.0, 5000.0);
    }
  
    col.rgb /= steps * 0.08; // Ambeint occlusion
  
    return col;
  }
  
  void main () {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(-iRayOrigin.x, iRayOrigin.y, iRayOrigin.z); // Ray origin
    
    vec3 lookAt = vec3(0);
    vec3 rd = calcRayDirection(uv, ro, lookAt, 2.); // Ray direction (based on mouse rotation)

    vec4 col = RayMarcher (ro, rd);
  
    // Output to screen
    gl_FragColor = vec4 (col.rgb, 1.0);
  }
`