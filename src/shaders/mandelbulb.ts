export default `
  /**
   * @file Mandelbulb.glsl
   *
   * @brief This shader targets to achieve a mathematical render of Mandelbrot's Bulb, a fractal based on the same
   * Mandelbrots's Formula used to construct the well known Mandelbrot's set.
   *
   * @author Pedro Schneider 
   *
   * @date 06/2020
   *
   * Direct link to ShaderToy: 
  */
  
  precision mediump float;
  
  #define MaximumRaySteps 250
  #define MaximumDistance 200.
  #define MinimumDistance .0001
  #define PI 3.141592653589793238
  #define fftSize 64
  
  uniform float iTime;
  uniform vec3 iRayOrigin;
  uniform vec2 iResolution;
  uniform float[fftSize] fftData;
  uniform float lowFFT;
  uniform float midFFT;
  uniform float highFFT;
  
  

  
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
  
  float mandelbulb (vec3 position) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    int iterations = 0;
    float power = 8.0;
  
    for (int i = 0; i < 7; i++) {
      iterations = i;
      r = length (z);
  
      if (r > 2.0) {
        break;
      }
  
      // convert to polar coordinates
      float theta = acos (z.z / r);
      float phi = atan (z.y, z.x);
      dr = pow (r, power - 1.0) * power * dr + 1.0;
  
      // scale and rotate the point
      float fftVal = fftData[int(r * 64.)] / 64.;
      float zr = pow (r, power);
      theta = theta * power ;
      phi = phi * power;
      
      theta = theta + map((lowFFT + midFFT + highFFT) / (64. * 3.), 0., 1., 0., 2. * PI);
      
      
  
      // convert back to cartesian coordinates
      z = zr * vec3 (sin (theta) * cos (phi), sin (phi) * sin (theta), cos (theta));
      z += position;
    }
    float fftVal = fftData[int(r/dr * 64.)] / 64.;
    float dst = 0.5 * log (r) * r / dr;
    return dst;
  }
  
  // Audio sphere to smoothmin with Mandelbulb
  float sdSphere( vec3 p, float s ) {
    return length(p)-s;
  }
  
  // polynomial smooth min
  float smin( float a, float b ) {
    float k = 0.1;
    float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
  }
  
  // Calculates de distance from a position p to the scene
  float DistanceEstimator (vec3 p) {
    
    float mandelbulb = mandelbulb(p);
    float sphere = sdSphere(p, 10.0);
    return sphere;
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
      float distance = DistanceEstimator (p); // Distance from the current position to the scene
      curPos = ro + rd * totalDistance;
      if (minDistToScene > distance) {
        minDistToScene = distance;
        minDistToScenePos = curPos;
      }
      if (minDistToOrigin > length (curPos)) {
        minDistToOrigin = length (curPos);
        minDistToOriginPos = curPos;
      }
      totalDistance += distance; // Increases the total distance armched
      if (distance < MinimumDistance) {
        hit = true;
        break; // If the ray marched more than the max steps or the max distance, breake out
      }
      else if (distance > MaximumDistance) {
        break;
      }
    }
    
    float fftVal = fftData[int(minDistToScene * 64.)] / 64.;  
    float iterations = float (steps) + log (log (MaximumDistance)) / log (2.0) - log (log (dot (curPos, curPos))) / log (2.0);
  
    if (hit) {
      col.rgb = vec3 (0.8 + (length (curPos) / 0.5), 1.0, 0.8);
      col.rgb = hsv2rgb (col.rgb);
    }
    else {
      col.rgb = vec3 (0.8 + (length (minDistToScenePos) / 0.5), 1.0, 0.8);
      col.rgb = hsv2rgb (col.rgb);
      col.rgb *= 1.0 / (minDistToScene * minDistToScene);
      col.rgb /= map (sin (iTime * 2.0), -1.0, 1.0, 500.0, 600.0);
    }
  
    col.rgb /= steps * 0.05; // Ambeint occlusion
    col.rgb /= pow (distance (ro, minDistToScenePos), 3.0);
    col.rgb *= 10.0;
  
    return col;
  }
  
  void main () {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(-iRayOrigin.x, iRayOrigin.y, iRayOrigin.z); // Ray origin
    
    vec3 lookAt = vec3(0);
    vec3 rd = RayDirection(uv, ro, lookAt, 2.); // Ray direction (based on mouse rotation)

    vec4 col = RayMarcher (ro, rd);
  
    // Output to screen
    gl_FragColor = vec4 (col);
  }
`