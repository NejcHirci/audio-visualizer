export default `
  precision mediump float;
  
  // Ray Marching Settings
  #define MaximumRaySteps 100
  #define MaximumDistance 250.
  #define MinimumDistance .001

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
  
  mat2 Rotate (float angle) {
    float s = sin (angle);
    float c = cos (angle);
    return mat2 (c, -s, s, c);
  }
  
  vec3 RayDirection (vec2 uv, vec3 ro, vec3 lookat, float zoom) {
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
  
  float mengerbrocolli (vec3 z, float p) {
    float iterations = 25.0;
    float Scale = 2.421312 + (sin (iTime / 5.0) * 0.3);
    vec3 Offset = vec3 (0.7687, 1.32837, 0.0);
    float bailout = 1000.0;
  
    float r = length (z);
    int n = 0;
    while (n < int (iterations) && r < bailout) {
      z.x = abs (z.x);
      z.y = abs (z.y);
      z.z = abs (z.z);
  
      if (z.x - z.y < 0.0) z.xy = z.yx; // fold 1
      if (z.x - z.z < 0.0) z.xz = z.zx; // fold 2
      if (z.y - z.z < 0.0) z.zy = z.yz; // fold 3
  
      z.yx *= Rotate (0.436332 + map(sin(offsetTheta), -1., 1., 1., PI) * 0.9 * 0.1 + 4.9);
      
      z.zy *= Rotate(0.3323 * rms);
  
      z.x = z.x * Scale - Offset.x * (Scale - 1.0);
      z.y = z.y * Scale - Offset.y * (Scale - 1.0);
      z.z = z.z * Scale;
  
      if (z.z > 0.5 * Offset.z * (Scale - 1.0)) {
        z.z -= Offset.z * (Scale - 1.0);
      }
  
      r = length(z);
  
      n++;
    }
  
    return (length (z) - 2.0) * pow (Scale, -float (n));
  }
  
  float sdSphere( vec3 p, float s ) {
    float d1 = length(p) - s;
    return d1;
  }
  
  float atan2(in float y, in float x) {
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
  }
  
  // Calculate displacement
  float displacement(vec3 p) {
    float theta = map(max(length(p), 1.0), 1.0, 8.0, 0.0, 1.0);
    
    // Option 3: Amplitude spectrum
    int index = int(theta * float(128.));
    float ampVal = amplitudeSpectrum[index];
    float synthVal = synthAmpSpectrum[index];
    float displacement = ((ampVal + synthVal) / 2.0) * 0.01 * sin(1.0 - theta);
    
    return displacement;
  }
  
  // Add sphere dist depending on distance from center
  float reactiveDistance(float fractal, vec3 p) {
    float outFloat = fractal;
    outFloat = outFloat - displacement(p);
        
    return outFloat;
  }
  
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0-h);
  }
  
  vec3 opTwist( vec3 p ) {
      float k = sin(iTime / (240./bpm) * 2. * PI ); // or some other amount
      float c = cos(k*p.y);
      float s = sin(k*p.y);
      mat2  m = mat2(c,-s,s,c);
      vec3  q = vec3(m*p.xz,p.y);
      return q;
  }
  
  float metaBalls (vec3 pos) {
    float ballRadius = 0.025;
    float k = 0.3;
    float outVal = MaximumDistance;
    vec3 bPos;
    
    int index = 0;

    for (float j=-0.8; j <= 0.8; j+=0.4) {
      vec2 xy = vec2(sqrt(1.5 - j*j), 0.0) * Rotate(offsetTheta);
      bPos = pos + vec3(xy.x, xy.y, j);
      outVal = smin(outVal, sdSphere(bPos, ballRadius + map(chroma[index], minChroma, 1., 0., 1.) / 5.0), k);
      index++;
    }
    
    return outVal;
  }
  
  
  // Calculates de distance from a position p to the scene
  float getSceneDistance (vec3 p) {
    float fractal = reactiveDistance(mengerbrocolli(p, 6.0), p);
    float balls = metaBalls(p);
    return smin(fractal, balls, 0.3);
  }
  
  // Marches the ray in the scene
  vec4 RayMarcher (vec3 ro, vec3 rd) {
    float steps = 0.0;
    float totalDistance = 0.0;
    float minDistToScene = 300.0;
    vec3 minDistToScenePos = ro;
    float minDistToOrigin = 200.0;
    vec3 minDistToOriginPos = ro;
    vec4 col = vec4 (0.0, 0.0, 0.0, 1.0);
    vec3 curPos = ro;
    bool hit = false;
  
    for (steps = 0.0; steps < float (MaximumRaySteps); steps++) {
      vec3 p = ro + totalDistance * rd; // Current position of the ray
      float distance = getSceneDistance (p); // Distance from the current position to the scene
      curPos = ro + rd * totalDistance;
      if (minDistToScene > distance) {
        minDistToScene = distance;
        minDistToScenePos = curPos;
      }
      if (minDistToOrigin > length (curPos)) {
        minDistToOrigin = length (curPos);
        minDistToOriginPos = curPos;
      }
      totalDistance += distance; // Increases the total distance ray marched
      if (distance < MinimumDistance) {
        hit = true;
        break; // If the ray marched more than the max steps or the max distance, breake out
      } else if (distance > MaximumDistance) {
        break;
      }
    }
    
    if (hit) {
      col.rgb = vec3 (1.0 + (length (curPos)), 0.76 + (perceptualSpread) * 0.01, 0.3 + 0.1 * (rms));
      col.rgb = hsv2rgb (col.rgb);
    }
    else {
      col.rgb = vec3 (1.0 + (length (minDistToScenePos)), 0.76 + (perceptualSpread) * 0.01, 0.3 + 0.1 * (rms));
      col.rgb = hsv2rgb (col.rgb);
      col.rgb *= 1.0 / (minDistToScene * minDistToScene);
      col.rgb /= map (sin((iTime * perceptualSpread * 0.01)), -1.0, 1.0, 500.0, 1000.0);
    }
  
    col.rgb /= steps * 0.08; // Ambeint occlusion
  
    return col;
  }
  
  void main () {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(-iRayOrigin.x, iRayOrigin.y, iRayOrigin.z); // Ray origin
    
    vec3 lookAt = vec3(0);
    vec3 rd = RayDirection(uv, ro, lookAt, 2.); // Ray direction (based on mouse rotation)

    vec4 col = RayMarcher (ro, rd);
  
    // Output to screen
    gl_FragColor = vec4 (col.rgb, 1.0);
  }
`