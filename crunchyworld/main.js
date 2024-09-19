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
let parkShader;
let urbanGreenShader;
let naturalWoodShader;
let industrialShader;

let u_resolutionLocation, u_pixelRatio;

let shaderLayers = [];

//For debugging
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  features.forEach(f => console.log(f.layer.id));

});

map.once('load', () => {
  waterShader = new ShaderLayer(map, 'waterShader', ['water'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });
  earthShader = new ShaderLayer(map, 'earthShader', ['earth'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });
  parkShader = new ShaderLayer(map, 'parkShader', ['landuse_park'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  urbanGreenShader = new ShaderLayer(map, 'urbanGreenShader', ['landuse_urban_green'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  naturalWoodShader = new ShaderLayer(map, 'naturalWoodShader', ['natural_wood'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  industrialShader = new ShaderLayer(map, 'industrialShader', ['landuse_industrial'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './crunchyworld/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });
  shaderLayers.push(waterShader);
  shaderLayers.push(earthShader);
  shaderLayers.push(parkShader);
  shaderLayers.push(urbanGreenShader);
  shaderLayers.push(naturalWoodShader);
  shaderLayers.push(industrialShader);

  map.addLayer(waterShader, 'physical_line_stream');
  map.addLayer(earthShader, 'landuse_park');
  map.addLayer(parkShader, 'landuse_hospital');
  map.addLayer(urbanGreenShader, 'landuse_hospital');
  map.addLayer(naturalWoodShader, 'natural_scrub');
  map.addLayer(industrialShader, 'natural_scrub');
  //for (let i = 0; i < shaderLayers.length; i++) {
  initShaderLayer(waterShader, [0.0, 0.0, 1.0]);
  initShaderLayer(earthShader, [0.0, 1.0, 0.3]);
  initShaderLayer(parkShader, [0.0, 0.6, 0.1]);
  initShaderLayer(urbanGreenShader, [156 / 255, 211 / 255, 180 / 255]);
  initShaderLayer(naturalWoodShader, [156 / 255, 211 / 255, 180 / 255]);
  initShaderLayer(industrialShader, [156 / 255, 130 / 255, 120 / 255]);
  //}
});

function initShaderLayer(layer, color) {
  const gl = layer.context;
  const prog = layer.program;

  gl.useProgram(prog);
  const u_zoom_location = gl.getUniformLocation(prog, 'u_zoom');
  gl.uniform1f(u_zoom_location, Math.floor(map.getZoom()));

  const u_color_location = gl.getUniformLocation(prog, 'u_color');
  gl.uniform3f(u_color_location, color[0], color[1], color[2]);

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
  const x = map.getCenter().lng//(map.getCenter().lng + 180) / 360;
  const y = map.getCenter().lat//(map.getCenter().lat + 90) / 180;
  _layer.updateMapBBox();
  const cam3857 = proj4('EPSG:4326', 'EPSG:3857', [x, y]);
  gl.uniform3f(u_camera_location, cam3857[0], cam3857[1], 1 - (map.getZoom() / 20));
}

// map.on('move', () => {
//   for (let i = 0; i < shaderLayers.length; i++) {
//     onMove(shaderLayers[i]);
//     updateResolution(shaderLayers[i]);
//   }
// });


