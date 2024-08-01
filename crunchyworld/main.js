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
let earthShader;
let u_resolutionLocation, u_pixelRatio;
let pu_resolutionLocation, pu_pixelRatio;
map.once('load', () => {
  shaderLayer = new ShaderLayer(map, 'shaderLayer', ['water'], {
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
  map.addLayer(shaderLayer, 'physical_line_stream');
  map.addLayer(earthShader, 'landuse_park');

  const gl = shaderLayer.context;
  const prog = shaderLayer.program;

  const earthShadergl = earthShader.context;
  const earthShaderprog = earthShader.program;

  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));

  earthShadergl.useProgram(earthShaderprog);
  const pu_zoom_location = gl.getUniformLocation(earthShaderprog, 'u_zoom');
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

  const pgl = earthShader.context;
  const pprog = earthShader.program;
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

  const pgl = earthShader.context;
  const pprog = earthShader.program;
  pgl.useProgram(pprog);

  const pu_zoom_location = gl.getUniformLocation(pprog, 'u_zoom');
  pgl.uniform1f(pu_zoom_location, Math.floor(map.getZoom()));

  const pu_camera_location = pgl.getUniformLocation(pprog, 'u_camera');
  const px = (map.getCenter().lng + 180) / 360;
  const py = (map.getCenter().lat + 90) / 180;
  earthShader.updateMapBBox();
  pgl.uniform3f(pu_camera_location, px, py, 1 - (map.getZoom() / 20));

  updateResolution();
  //console.log([x, y, 1 - (map.getZoom() / 20)])

});


