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
let pavementShader;
let u_resolutionLocation, u_pixelRatio;
let pu_resolutionLocation, pu_pixelRatio;
map.once('load', () => {
  shaderLayer = new ShaderLayer(map, 'shaderLayer', ['landuse_park'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/Dirtx256.png',
    normalImagePath: './crunchyworld/Textures/DirtNorm.png'
  });
  pavementShader = new ShaderLayer(map, 'pavementShader', ['earth'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/Pavementx256.png',
    normalImagePath: './crunchyworld/Textures/PavementNormx256.png'
  });
  map.addLayer(shaderLayer, 'landuse_urban_green');
  map.addLayer(pavementShader, 'shaderLayer');

  const gl = shaderLayer.context;
  const prog = shaderLayer.program;

  const pavementShadergl = pavementShader.context;
  const pavementShaderprog = pavementShader.program;

  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));

  pavementShadergl.useProgram(pavementShaderprog);
  const pu_zoom_location = gl.getUniformLocation(pavementShaderprog, 'u_zoom');
  gl.uniform1f(pu_zoom_location, Math.floor(map.getZoom() * -.1));

  console.log(gl.getProgramInfoLog(prog))

});

function updateResolution() {
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  gl.useProgram(prog);
  u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
  gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
  gl.uniform1f(u_pixelRatio, window.devicePixelRatio);

  const pgl = pavementShader.context;
  const pprog = pavementShader.program;
  pgl.useProgram(pprog);
  pu_resolutionLocation = pgl.getUniformLocation(pprog, 'u_resolution');
  pgl.uniform2fv(pu_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  pu_pixelRatio = pgl.getUniformLocation(pprog, 'u_devicePixelRatio');
  pgl.uniform1f(pu_pixelRatio, window.devicePixelRatio);

}

map.on('move', () => {

  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  gl.useProgram(prog);

  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));

  const u_camera_location = gl.getUniformLocation(prog, 'u_camera');
  const x = (map.getCenter().lng + 180) / 360;
  const y = (map.getCenter().lat + 90) / 180;
  shaderLayer.updateMapBBox();
  gl.uniform3f(u_camera_location, x, y, 1 - (map.getZoom() / 20));

  const pgl = pavementShader.context;
  const pprog = pavementShader.program;
  pgl.useProgram(pprog);

  const pu_zoom_location = gl.getUniformLocation(pprog, 'u_zoom');
  pgl.uniform1f(pu_zoom_location, Math.floor(map.getZoom()));

  const pu_camera_location = pgl.getUniformLocation(pprog, 'u_camera');
  const px = (map.getCenter().lng + 180) / 360;
  const py = (map.getCenter().lat + 90) / 180;
  pavementShader.updateMapBBox();
  pgl.uniform3f(pu_camera_location, px, py, 1 - (map.getZoom() / 20));

  updateResolution();
  //console.log([x, y, 1 - (map.getZoom() / 20)])

});


