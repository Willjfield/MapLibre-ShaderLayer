//https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/sampler_object.html
import maplibre from 'maplibre-gl';
import ShaderLayer from '../ShaderLayer.js';
import frag from './frag.glsl';
import vert from './vert.glsl';
import proj4 from 'proj4';
import { Protocol } from 'pmtiles';
const protocol = new Protocol();
maplibre.addProtocol('pmtiles', protocol.tile);
const map = new maplibre.Map({
  container: 'map',
  //style: './style.json',
  style: './crunchyworld/protostyle.json',
  center: [-71.5593, 41.1338],
  zoom: 7,
  hash: true
});

let shaderLayer;

map.once('load', () => {
  shaderLayer = new ShaderLayer(map, 'shaderLayer', ['landuse_park'], { fragmentSource: frag, vertexSource: vert });
  map.addLayer(shaderLayer, 'landuse_urban_green');
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;

  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));
  console.log(gl.getProgramInfoLog(prog))

});

map.on('move', () => {
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));
});


