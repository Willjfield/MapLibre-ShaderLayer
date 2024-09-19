  #version 300 es

precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec2 v_normcoord;
// The texture.
uniform sampler2D u_texture;
uniform sampler2D u_normal;

out highp vec4 fragColor;
uniform float u_zoom;
uniform vec3 u_camera;
uniform highp vec2 u_resolution;
uniform vec3 u_color;

uniform vec4 u_bbox;
uniform float u_devicePixelRatio;

vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

highp vec2 normalizedFragCoordFromLatLng() {

  highp vec2 uv = gl_FragCoord.xy/u_resolution;

  return map(uv, vec2(0.), vec2(u_devicePixelRatio),u_bbox.xy, u_bbox.zw);

}


    void main(void) {
    //float circum = 6378137.0;
    //vec2 normFrag = normalizedFragCoordFromLatLng();
    //float thresh = 7000.;
    float _pow = u_zoom > 7. ? 3.25 : 2.;
    float _zoom = max(pow(u_zoom*2.,_pow),1.);

    vec4 normSample = texture(u_normal, v_texcoord*_zoom);
    vec4 textureSample = texture(u_texture, v_texcoord*_zoom);

    highp vec2 uv = gl_FragCoord.xy/u_resolution;
    float aspectRatio = u_resolution.x/u_resolution.y;
    //uv.x *= aspectRatio;
    vec2 center = vec2(1.* aspectRatio,1.);

    vec3 fakeWorldFragCoordPt = vec3(uv,0.);
    vec3 fakeWorldCameraPt = vec3(center,1.);
    vec3 camToCoordVec = normalize(fakeWorldCameraPt-fakeWorldFragCoordPt);
    camToCoordVec.z *=-.75;
    //camToCoordVec.x /= aspectRatio;
    vec3 camReflection = reflect(camToCoordVec,normSample.xyz);
    float dist=dot(camReflection,vec3(uv,-.1));
    float threshold = .05;

    
    //bool black = distance(uv,center) > threshold;
    //fragColor = black ? vec4(0.,0.,0.,1.) : vec4(1.,1.,1.,1.);

    fragColor = textureSample*vec4(u_color,1.)*vec4(vec3(min(dist,1.)),1.);
    
      
}