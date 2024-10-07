//https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/sampler_object.html
//github pages
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
  style: './example/protostyle.json',
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
let scrubShader;

let shaderLayers = [];

//For debugging
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  features.forEach(f => console.log(f.layer.id));

});

const patternScale = .75;
map.once('load', () => {

  waterShader = new ShaderLayer(map, 'waterShader', ['water'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });
  earthShader = new ShaderLayer(map, 'earthShader', ['earth'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });
  parkShader = new ShaderLayer(map, 'parkShader', ['landuse_park'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  urbanGreenShader = new ShaderLayer(map, 'urbanGreenShader', ['landuse_urban_green'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  naturalWoodShader = new ShaderLayer(map, 'naturalWoodShader', ['natural_wood'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  industrialShader = new ShaderLayer(map, 'industrialShader', ['landuse_industrial'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  scrubShader = new ShaderLayer(map, 'scrubShader', ['natural_scrub'], {
    fragmentSource: frag,
    vertexSource: vert,
    imagePath: './example/Textures/fabric/Fabric_Knitted_006_basecolor_x512.jpg',
    normalImagePath: './example/Textures/fabric/Fabric_Knitted_006_norm_x512.jpg'
  });

  shaderLayers.push(waterShader);
  shaderLayers.push(earthShader);
  shaderLayers.push(parkShader);
  shaderLayers.push(urbanGreenShader);
  shaderLayers.push(naturalWoodShader);
  shaderLayers.push(industrialShader);
  shaderLayers.push(scrubShader);

  map.addLayer(waterShader, 'physical_line_stream');
  map.addLayer(earthShader, 'landuse_park');
  map.addLayer(parkShader, 'landuse_hospital');
  map.addLayer(urbanGreenShader, 'landuse_hospital');
  map.addLayer(naturalWoodShader, 'natural_scrub');
  map.addLayer(industrialShader, 'natural_scrub');
  map.addLayer(scrubShader, 'natural_glacier');
  //for (let i = 0; i < shaderLayers.length; i++) {
  initShaderLayer(waterShader, [0.0, 0.0, 1.0]);
  initShaderLayer(earthShader, [0.0, 1.0, 0.3]);
  initShaderLayer(parkShader, [0.0, 0.6, 0.1]);
  initShaderLayer(urbanGreenShader, [156 / 255, 211 / 255, 180 / 255]);
  initShaderLayer(naturalWoodShader, [156 / 255, 211 / 255, 180 / 255]);
  initShaderLayer(industrialShader, [156 / 255, 130 / 255, 120 / 255]);
  initShaderLayer(scrubShader, [156 / 255, 211 / 255, 210 / 255]);
  //}
});

function initShaderLayer(layer, color) {
  const multi = (Math.floor(map.getZoom()) / 2) - 2
  layer.setUniform({
    name: 'u_zoom',
    type: 'float',
    value: Math.floor(map.getZoom() * multi)
  })
  layer.setUniform({
    name: 'u_color',
    type: 'vec3',
    value: color
  })

  const rand = Math.random() > 0.5;

  layer.setUniform({
    name: 'u_transpose',
    type: 'bool',
    value: rand
  })

  updateResolution(layer);

}
function updateResolution(layer) {
  layer.setUniform({
    name: 'u_resolution',
    type: 'vec2',
    value: [map.getContainer().offsetWidth, map.getContainer().offsetHeight]
  })

  layer.setUniform({
    name: 'u_devicePixelRatio',
    type: 'float',
    value: window.devicePixelRatio
  })
}
window.multiplier = 1.0;
function onMove(layer) {
  const multi = (Math.floor(map.getZoom()) / 2) - 2
  layer.setUniform({
    name: 'u_zoom',
    type: 'float',
    value: Math.floor(map.getZoom() * multi)
  })

  const x = map.getCenter().lng//(map.getCenter().lng + 180) / 360
  const y = map.getCenter().lat//(map.getCenter().lat + 90) / 180;

  layer.updateMapBBox();

  const cam3857 = proj4('EPSG:4326', 'EPSG:3857', [x, y]);
  layer.setUniform({
    name: 'u_camera',
    type: 'vec3',
    value: cam3857
  })
}

map.on('move', () => {
  for (let i = 0; i < shaderLayers.length; i++) {
    onMove(shaderLayers[i]);
    updateResolution(shaderLayers[i]);
  }
});


