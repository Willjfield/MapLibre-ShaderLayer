import maplibre from 'maplibre-gl';
import ShaderLayer from '../ShaderLayer.js';
import frag from './frag_ocean.glsl';
import proj4 from 'proj4';

const map = new maplibre.Map({
  container: 'map',
  style: './style.json',
  center: [-71.5593, 41.1338],
  zoom: 7,
  hash: true
});

let shaderLayer;

map.once('load', () => {
  shaderLayer = new ShaderLayer(map, 'oceanfmb', ['Water'], { fragmentSource: frag, animate: animation });
  map.addLayer(shaderLayer, 'Aeroway');
  updateResolution();
  updateGeometry();
});

let u_frame;
let u_resolutionLocation;
let u_pixelRatio;
let frameNum = 0;

window.addEventListener('resize', () => {
  updateResolution();
  updateGeometry();
});

map.on('move', () => {
  updateGeometry();
});

function updateResolution() {
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
  gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
}

function updateGeometry() {
  shaderLayer.updateMapBBox();
}

function animation(_shaderLayer) {
  frameNum++;

  const gl = _shaderLayer.context;
  const prog = _shaderLayer.program;

  gl.useProgram(prog);

  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, frameNum/100);
  }

  map.triggerRepaint();
  requestAnimationFrame(() => { animation(_shaderLayer) });
}

