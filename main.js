import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';

const map = new maplibre.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/dataviz/style.json?key=S5ckYmY9F8cXqKTHBLHV',
  center: [20,35],
  zoom: 5,
  hash:true
});

map.on('load', () => {
  map.addLayer(new ShaderLayer(map, 'test', ['Water']),'Aeroway');
});
