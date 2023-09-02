import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';

const map = new maplibre.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/dataviz/style.json?key=S5ckYmY9F8cXqKTHBLHV',
  center: [20,35],
  zoom: 5,
  hash:true
});

let slayer;
map.on('load', () => {
  slayer = new ShaderLayer(map, 'test', ['Water']);
  map.addLayer(slayer,'Aeroway');
});

map.on('click',(e)=>{
  const features = map.queryRenderedFeatures(e.point,{ layers: ['Water'] });
  const slayers = slayer.getSlayerFeatures();
  console.log(features);
  console.log(slayers);
})