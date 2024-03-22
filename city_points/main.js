import maplibre from 'maplibre-gl';
import ShaderLayer from '../ShaderLayer.js';
import frag from './frag_cities.glsl';
import vert from './vert_cities.glsl';
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

  shaderLayer = new ShaderLayer(map,
    'cities',
    ['City labels'],
    {
      fragmentSource: frag,
      vertexSource: vert,
      addedBufferNames: ['feature_color']
    });

  map.addLayer(shaderLayer, 'City labels');
  
  let colorsArray = [];
  for (var i = 0; i < shaderLayer.positionLength/2; ++i) {
      var newColor = [Math.random(), Math.random(), Math.random(), 1.0];
      colorsArray.push(...newColor);
  }

  shaderLayer.setBuffer('feature_color', colorsArray, 4, shaderLayer.context.FLOAT, false, 0, 0);
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
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
  gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
}

function updateGeometry() {
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;

  shaderLayer.updateMapBBox();

  loc_location = gl.getUniformLocation(prog, 'u_location');

  const nyc = [-71.5802, 41.1853];
  const nyc3857 = proj4('EPSG:4326', 'EPSG:3857', nyc);

  gl.uniform2fv(loc_location, nyc3857);
}

function animation(_shaderLayer) {
  frameNum++;

  const gl = _shaderLayer.context;
  const prog = _shaderLayer.program;

  gl.useProgram(prog);

  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, frameNum);
  }

  map.triggerRepaint();
  requestAnimationFrame(() => { animation(_shaderLayer) });
}

