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

let waterShader;
let earthShader;
let u_resolutionLocation, u_pixelRatio;

let shaderLayers = [];
map.once('load', () => {
  waterShader = new ShaderLayer(map, 'waterShader', ['water'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/Water_001_SD/Water_001_COLOR.jpg',
    normalImagePath: './crunchyworld/Textures/Water_001_SD/Water_001_NORM.jpg'
  });
  earthShader = new ShaderLayer(map, 'earthShader', ['earth'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/Rock_Moss_001_SD/Rock_Moss_001_basecolor.jpg',
    normalImagePath: './crunchyworld/Textures/Rock_Moss_001_SD/Rock_Moss_001_normal.jpg'
  });
  shaderLayers.push(waterShader);
  shaderLayers.push(earthShader);

  map.addLayer(waterShader, 'physical_line_stream');
  map.addLayer(earthShader, 'landuse_park');

  for (let i = 0; i < shaderLayers.length; i++) {
    initShaderLayer(shaderLayers[i]);
  }
});

function initShaderLayer(layer) {
  const gl = layer.context;
  const prog = layer.program;

  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));
  updateResolution(layer);
  console.log(gl.getProgramInfoLog(prog))

}
function updateResolution(layer) {
  const gl = layer.context;
  const prog = layer.program;
  gl.useProgram(prog);
  u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
  gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
}

function onMove(_layer) {
  const gl = _layer.context;
  const prog = _layer.program;
  gl.useProgram(prog);

  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));

  const u_camera_location = gl.getUniformLocation(prog, 'u_camera');
  const x = (map.getCenter().lng + 180) / 360;
  const y = (map.getCenter().lat + 90) / 180;
  _layer.updateMapBBox();
  gl.uniform3f(u_camera_location, x, y, 1 - (map.getZoom() / 20));
}

map.on('move', () => {
  for (let i = 0; i < shaderLayers.length; i++) {
    onMove(shaderLayers[i]);
    updateResolution(shaderLayers[i]);
  }
});


