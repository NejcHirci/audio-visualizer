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
  
  precision highp float;
  
  #define MaximumRaySteps 150
  #define MaximumDistance 200.
  #define MinimumDistance .0001
  #define fftSize 128
  #define lowLen 2
  #define midLen 6
  #define highLen 54
  
  #define PI 3.141592653589793238
  #define EPS 1e-6
  
  uniform float iTime;
  uniform float offsetTheta;
  uniform vec3 iRayOrigin;
  uniform vec2 iResolution;
  uniform float[fftSize] fftData;
  uniform float lowFFT;
  uniform float midFFT;
  uniform float highFFT;
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

  float mandelbulb2 (vec3 position) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    float power = 4.0;
  
    for (int i = 0; i < 4; i++) {
      r = length (z);
  
      if (r > 2.0) {
        break;
      }
  
      // convert to polar coordinates
      float theta = acos (z.z / r);
      float phi = atan (z.y, z.x);
      dr = pow (r, power - 1.0) * power * dr + 1.0;
  
      // scale and rotate the point
      float zr = pow (r, power);
      theta = theta * power ;
      phi = phi * power;
      
      theta = theta - offsetTheta * 2.;
      
      // convert back to cartesian coordinates
      z = zr * vec3 (sin (theta) * cos (phi), sin (phi) * sin (theta), cos (theta));
      z += position;
    }
    
    float dst = 0.5 * log (r) * r / dr;
    return dst;
  }
  
  float mandelbulb (vec3 position, float p) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    float power = p;
  
    for (int i = 0; i < 10; i++) {
      r = length (z);
  
      if (r > 2.0) {
        break;
      }
  
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
  
  // Audio sphere to smoothmin with Mandelbulb
  vec3 opTwist( vec3 p ) {
      float k = sin(iTime / (240./bpm) * 2. * PI ); // or some other amount
      float c = cos(k*p.y);
      float s = sin(k*p.y);
      mat2  m = mat2(c,-s,s,c);
      vec3  q = vec3(m*p.xz,p.y);
      return q;
  }
  
  float sdSphere( vec3 p, float s ) {
    float d1 = length(p) - s;
    return d1;
  }
  
  // polynomial smooth min
  float smin( float a, float b ) {
    const float k = 0.1;
    float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
  }
  
  float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
  
  float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
  }
  
  float atan2(in float y, in float x) {
    bool s = (abs(x) > abs(y));
    return mix(PI/2.0 - atan(x,y), atan(y,x), s);
  }
  
  // Calculate displacement
  float displacement(vec3 p) {
    float theta = map(length(p),0.0, 3.0, 0., 1.);
    int index = int(theta * (float(64) - 1.));
    float fftVal = fftData[index];
    float displacement = fftVal / 255.;
    return sin(map(displacement, 0.,1., -PI/2., PI/2.));
  }
  
  // Add sphere dist depending on distance from center
  float reactiveDistance(float fractal, vec3 p) {
    float outFloat = fractal;
    float r = length(p);
    outFloat = outFloat - displacement(p) * 0.03;
        
    return outFloat;
  }
  
  
  // Calculates de distance from a position p to the scene
  float getSceneDistance (vec3 p) {
    vec3 q = opTwist(p);
    float mandelbulb = reactiveDistance(mandelbulb(q, 8.0), q);
    return mandelbulb;
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
      }
      else if (distance > MaximumDistance) {
        break;
      }
    }
    
    float bpmSpeed = iTime / (500./bpm);
    
    if (hit) {
      col.rgb = vec3 (6.0 + 1.0 * bpmSpeed + (length (curPos) / 0.5), 0.76 + 0.01 * (lowFFT+midFFT+highFFT)/3., 0.8);
      col.rgb = hsv2rgb (col.rgb);
    }
    else {
      col.rgb = vec3 (6.0 + 1.0 * bpmSpeed + (length (minDistToScenePos) / 0.5), 0.76 + 0.01 * (lowFFT+midFFT+highFFT)/3., 0.8);
      col.rgb = hsv2rgb (col.rgb);
      col.rgb *= 1.0 / (minDistToScene * minDistToScene);
      col.rgb /= map (sin(iTime / (EPS + bpm) * 2. * PI ), -1.0, 1.0, 500.0, 1000.0);
    }
  
    col.rgb /= steps * 0.08; // Ambeint occlusion
    col.rgb *= 1.1;
  
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