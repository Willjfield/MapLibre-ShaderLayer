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

uniform bool u_transpose;

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
    //float _pow = u_zoom > 7. ? 3.25 : 2.;
    float _zoom = max(pow(u_zoom*2.,2.),1.);

    vec2 transposedNormCoord = u_transpose ? v_normcoord.yx : v_normcoord.xy;
    vec2 transposedTexCoord = u_transpose ? v_texcoord.yx : v_texcoord.xy;

    vec4 normSample = texture(u_normal, transposedNormCoord*_zoom);
    vec4 textureSample = texture(u_texture, transposedTexCoord*_zoom);

    highp vec2 uv = gl_FragCoord.xy/u_resolution;
    float aspectRatio = u_resolution.x/u_resolution.y;

    vec2 center = vec2(.5*aspectRatio,1.);

    vec3 fakeWorldFragCoordPt = vec3(uv,0.);
    vec3 fakeWorldCameraPt = vec3(center,.5);

    vec3 camToCoordVec = normalize(fakeWorldCameraPt-fakeWorldFragCoordPt);
    camToCoordVec.z *= -.75;

    vec3 camReflection = reflect(camToCoordVec,normSample.xyz);

    float dist=dot(camReflection,vec3(uv,-.1));
    fragColor = textureSample*vec4(u_color,1.)*vec4(vec3(max(.2,min(dist,1.))),1.);
    
      
}