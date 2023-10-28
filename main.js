import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';
import frag from './frag_blockIsland.glsl';
import proj4 from 'proj4';

const map = new maplibre.Map({
  container: 'map',
  style: './style.json',
  center: [-71.5593, 41.1338],
  zoom: 7,
  hash: true
});

let slayer;

map.once('load', () => {
  slayer = new ShaderLayer(map, 'blockIsland', ['Water'], { fragmentSource: frag, animate: animation });
  map.addLayer(slayer, 'Aeroway');
  updateResolution();
  updateGeometry();
});

let u_frame;
let u_resolutionLocation;
let u_pixelRatio;
let loc_location;
let frameNum = 0;

window.addEventListener('resize', () => {
  updateResolution();
  updateGeometry();
});

map.on('move', () => {
  updateGeometry();
});

function updateResolution() {
  const gl = slayer.context;
  const prog = slayer.program;
  u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
  gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
}

function updateGeometry() {
  const gl = slayer.context;
  const prog = slayer.program;

  slayer.updateMapBBox();

  loc_location = gl.getUniformLocation(prog, 'u_location');

  const nyc = [-71.5802, 41.1853];
  const nyc3857 = proj4('EPSG:4326', 'EPSG:3857', nyc);

  gl.uniform2fv(loc_location, nyc3857);
}

function animation(_slayer) {
  frameNum++;

  const gl = _slayer.context;
  const prog = _slayer.program;

  gl.useProgram(prog);

  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, frameNum);
  }

  map.triggerRepaint();
  requestAnimationFrame(() => { animation(_slayer) });
}

