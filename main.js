import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';
import frag from './frag.glsl';
import proj4 from 'proj4';

const map = new maplibre.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/dataviz/style.json?key=S5ckYmY9F8cXqKTHBLHV',
  center: [20, 35],
  zoom: 5,
  hash: true
});

let slayer;

map.once('load', () => {
  slayer = new ShaderLayer(map, 'test', ['Water'], { fragmentSource: frag, animate: animation });

  map.addLayer(slayer, 'Aeroway');
});

let u_frame;
let u_resolutionLocation;
let loc_location;

map.on('move', () => {
  const gl = slayer.context;
  const prog = slayer.program;

  slayer.updateMapBBox();

  loc_location = gl.getUniformLocation(prog, 'u_location');

  const nyc = [-71.5802, 41.1693];
  const nyc3857 = proj4('EPSG:4326', 'EPSG:3857', nyc);

  gl.uniform2fv(loc_location, nyc3857);
});

let frameNum = 0;
function animation(_slayer) {
  frameNum++;

  const gl = _slayer.context;
  const prog = _slayer.program;

  gl.useProgram(prog);

  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, Math.sin(frameNum / 20));
  }

  //This should be on resize instead of in animate:
  if (!u_resolutionLocation) {
    u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
    gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  }

  map.triggerRepaint();
  requestAnimationFrame(() => { animation(_slayer) });
}

