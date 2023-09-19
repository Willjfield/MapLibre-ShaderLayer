import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';

const map = new maplibre.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/dataviz/style.json?key=S5ckYmY9F8cXqKTHBLHV',
  center: [20, 35],
  zoom: 5,
  hash: true
});

let slayer;

const frag = `#version 300 es
precision mediump float;
uniform float u_frame;
uniform vec4 u_bbox;
uniform vec2 u_resolution;

out highp vec4 fragColor;
//https://github.com/msfeldstein/glsl-map/blob/master/index.glsl
vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float longToNormalizedX(float lng) {
  return (lng/180.+1.)/2.;
}

float latToNormalizedY(float lat) {
  return (u_bbox.y/90.+1.)/2.;
}

vec2 normalizedFragCoordFromLatLng() {
  float normalizedX = gl_FragCoord.x / u_resolution.x;
  float normalizedY = gl_FragCoord.y / u_resolution.y;

  vec2 u_bbox = map(vec2(normalizedX, normalizedY), vec2(0., 0.), vec2(1., 1.),u_bbox.xy, u_bbox.zw);
 
  return vec2(longToNormalizedX(u_bbox.x), latToNormalizedY(u_bbox.y));
}

void main() {
    fragColor = vec4(normalizedFragCoordFromLatLng().x,normalizedFragCoordFromLatLng().y, 1.0, 1.0);
}`

let u_frame;
let u_bboxLocation;
let u_resolutionLocation;

let frameNum = 0;
function animate(_slayer) {
  frameNum++;
  const gl = _slayer.context;
  const prog = _slayer.program;

  gl.useProgram(prog);
  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, Math.sin(frameNum / 20));
  }

  //This could be on map move instead of in animate:
  if (!u_bboxLocation) {
    u_bboxLocation = gl.getUniformLocation(prog, 'u_bbox');
  } else {
    const nw = map.unproject([0,map.getContainer().offsetHeight]);
    const se = map.unproject([map.getContainer().offsetWidth, 0]);
    gl.uniform4fv(u_bboxLocation, [nw.lng, nw.lat, se.lng, se.lat]);
  }

  //This should be on resize instead of in animate:
  if(!u_resolutionLocation){
    u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
    gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  }

  map.triggerRepaint();
  requestAnimationFrame(() => { animate(slayer) });
}

map.on('load', () => {
  slayer = new ShaderLayer(map, 'test', ['Water'], { fragmentSource: frag, animate: true });
  requestAnimationFrame(() => { animate(slayer) });
  map.addLayer(slayer, 'Aeroway');
});

map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, { layers: ['Water'] });
  const slayers = slayer.getSlayerFeatures();
  console.log(features);
  console.log(slayers);
})