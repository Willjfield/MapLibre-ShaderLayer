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
uniform float u_test;
out highp vec4 fragColor;
void main() {
    fragColor = vec4(u_test, 2.0*u_test, 1.-u_test, 1.0);
}`

let u1Location;
let frameNum = 0;
function animate(_slayer) {
  frameNum++;
  const gl = _slayer.context;
  const prog = _slayer.program;
  //console.log(_slayer.matrix)
  gl.useProgram(prog);
  if (!u1Location) {
    u1Location = gl.getUniformLocation(prog, 'u_test');
  } else {
    gl.uniform1f(u1Location, Math.sin(frameNum / 100));
  }

  //_slayer.updateAnimationFrame(gl);
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