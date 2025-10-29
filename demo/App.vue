<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import LayerControl from '@/components/LayerControl.vue';
import type { LayerConfig, LayerGroup } from '@/types';

const mapContainer = ref<HTMLElement>();
const map = ref<Map>();

// ==========================================
// REAL LAYERS - Using Public APIs
// ==========================================

const layers = ref<LayerConfig[]>([
  // Basemaps
  {
    id: 'osm-base',
    name: 'OpenStreetMap',
    visible: true,
    opacity: 100,
    type: 'raster',
    source: 'osm-source',
    groupId: 'basemaps',
    metadata: {
      description: 'Standard OpenStreetMap base layer',
      source: 'OpenStreetMap Contributors',
      attribution: '© OpenStreetMap contributors',
    }
  },
  {
    id: 'satellite-base',
    name: 'Satellite Imagery',
    visible: false,
    opacity: 100,
    type: 'raster',
    source: 'satellite-source',
    groupId: 'basemaps',
    metadata: {
      description: 'ESRI World Imagery satellite basemap',
      source: 'ESRI',
      attribution: '© ESRI',
    }
  },
  {
    id: 'terrain-base',
    name: 'Terrain Map',
    visible: false,
    opacity: 100,
    type: 'raster',
    source: 'terrain-source',
    groupId: 'basemaps',
    metadata: {
      description: 'Terrain basemap with hillshading',
      source: 'OpenTopoMap',
      attribution: '© OpenTopoMap',
    }
  },
  
  // Overlays
  {
    id: 'country-borders',
    name: 'Country Borders',
    visible: true,
    opacity: 80,
    type: 'line',
    source: 'borders-source',
    groupId: 'overlays',
    metadata: {
      description: 'International country boundaries',
      source: 'Natural Earth Data',
    }
  },
  {
    id: 'cities',
    name: 'Major Cities',
    visible: true,
    opacity: 100,
    type: 'circle',
    source: 'cities-source',
    groupId: 'overlays',
    metadata: {
      description: 'World major cities population > 1M',
      source: 'Natural Earth Data',
    }
  },
  {
    id: 'earthquakes',
    name: 'Recent Earthquakes (7 days)',
    visible: false,
    opacity: 90,
    type: 'circle',
    source: 'earthquakes-source',
    groupId: 'real-time',
    metadata: {
      description: 'Earthquakes M2.5+ from past 7 days',
      source: 'USGS Earthquake Hazards Program',
      attribution: 'USGS',
    }
  },
]);

const groups = ref<LayerGroup[]>([
  {
    id: 'basemaps',
    name: 'Base Maps',
    expanded: true,
    groupToggle: false,
    layers: layers.value.filter(l => l.groupId === 'basemaps'),
  },
  {
    id: 'overlays',
    name: 'Overlays',
    expanded: true,
    groupToggle: true,
    layers: layers.value.filter(l => l.groupId === 'overlays'),
  },
  {
    id: 'real-time',
    name: 'Real-Time Data',
    expanded: true,
    groupToggle: false,
    layers: layers.value.filter(l => l.groupId === 'real-time'),
  },
]);

onMounted(() => {
  if (!mapContainer.value) return;

  // Initialize map with OpenStreetMap
  map.value = new Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {},
      layers: [],
    },
    center: [10.0, 51.0], // Center of Germany
    zoom: 5,
  });

  map.value.addControl(new NavigationControl(), 'top-left');

  map.value.on('load', () => {
    if (!map.value) return;

    // ==========================================
    // ADD BASEMAP SOURCES
    // ==========================================
    
    // OpenStreetMap
    map.value.addSource('osm-source', {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    });

    map.value.addLayer({
      id: 'osm-base',
      type: 'raster',
      source: 'osm-source',
      layout: {
        visibility: 'visible',
      },
    });

    // ESRI Satellite Imagery
    map.value.addSource('satellite-source', {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '© ESRI',
    });

    map.value.addLayer({
      id: 'satellite-base',
      type: 'raster',
      source: 'satellite-source',
      layout: {
        visibility: 'none',
      },
    });

    // OpenTopoMap (Terrain)
    map.value.addSource('terrain-source', {
      type: 'raster',
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenTopoMap',
    });

    map.value.addLayer({
      id: 'terrain-base',
      type: 'raster',
      source: 'terrain-source',
      layout: {
        visibility: 'none',
      },
    });

    // ==========================================
    // ADD OVERLAY LAYERS
    // ==========================================

    // Country Borders (from Natural Earth via geojson.xyz)
    map.value.addSource('borders-source', {
      type: 'geojson',
      data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
    });

    map.value.addLayer({
      id: 'country-borders',
      type: 'line',
      source: 'borders-source',
      paint: {
        'line-color': '#ff0000',
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

    // Major Cities (from Natural Earth)
    map.value.addSource('cities-source', {
      type: 'geojson',
      data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_populated_places_simple.geojson',
    });

    map.value.addLayer({
      id: 'cities',
      type: 'circle',
      source: 'cities-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'pop_max'],
          0, 3,
          1000000, 6,
          10000000, 10,
        ],
        'circle-color': '#0066cc',
        'circle-opacity': 1,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });

    // ==========================================
    // REAL-TIME DATA: USGS Earthquakes
    // ==========================================
    
    // USGS Earthquake feed (past 7 days, M2.5+)
    map.value.addSource('earthquakes-source', {
      type: 'geojson',
      data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
    });

    map.value.addLayer({
      id: 'earthquakes',
      type: 'circle',
      source: 'earthquakes-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['exponential', 2],
          ['get', 'mag'],
          2.5, 5,
          4.0, 10,
          5.0, 15,
          6.0, 25,
          8.0, 40,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'mag'],
          2.5, '#ffff00',
          4.0, '#ff9900',
          5.0, '#ff6600',
          6.0, '#ff0000',
          8.0, '#cc0000',
        ],
        'circle-opacity': 0.7,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
      layout: {
        visibility: 'none',
      },
    });

    // Add click handler for earthquakes
    map.value.on('click', 'earthquakes', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const props = e.features[0].properties;
      const mag = props?.mag || 'Unknown';
      const place = props?.place || 'Unknown location';
      const time = props?.time ? new Date(props.time).toLocaleString() : 'Unknown time';
      
      alert(`Earthquake Details:
Magnitude: ${mag}
Location: ${place}
Time: ${time}`);
    });

    // Change cursor on hover
    map.value.on('mouseenter', 'earthquakes', () => {
      if (map.value) map.value.getCanvas().style.cursor = 'pointer';
    });
    
    map.value.on('mouseleave', 'earthquakes', () => {
      if (map.value) map.value.getCanvas().style.cursor = '';
    });

    console.log('✅ All layers loaded from real APIs');
  });
});

const handleLayerInfo = (layerId: string) => {
  const layer = layers.value.find(l => l.id === layerId);
  if (!layer) return;

  let message = `Layer: ${layer.name}\n\n`;
  
  if (layer.metadata?.description) {
    message += `Description: ${layer.metadata.description}\n`;
  }
  
  if (layer.metadata?.source) {
    message += `Source: ${layer.metadata.source}\n`;
  }

  // Special info for real-time layers
  if (layerId === 'earthquakes') {
    message += `\n📊 Data Updates: Every minute\n`;
    message += `🌍 Coverage: Global\n`;
    message += `⚡ Real-time from USGS\n`;
    message += `\nClick on earthquake markers for details!`;
  }

  alert(message);
};

// Basemap switching logic
const handleBasemapChange = (layerId: string, visible: boolean) => {
  if (!visible || !['osm-base', 'satellite-base', 'terrain-base'].includes(layerId)) {
    return;
  }

  // When a basemap is turned on, turn off other basemaps
  const basemapIds = ['osm-base', 'satellite-base', 'terrain-base'];
  
  layers.value.forEach(layer => {
    if (basemapIds.includes(layer.id) && layer.id !== layerId) {
      layer.visible = false;
      if (map.value?.getLayer(layer.id)) {
        map.value.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  });
};

const handleLayerVisibilityChange = (layerId: string, visible: boolean) => {
  handleBasemapChange(layerId, visible);
};
</script>

<template>
  <div class="simple-demo">
    <!-- Header -->
    <header class="simple-demo__header">
      <div class="simple-demo__title">
        <h1>🗺️ MapLibre Layer Control</h1>
        <p>Production-Ready Integration with Real APIs</p>
      </div>
    </header>

    <!-- Info Banner -->
    <div class="info-banner">
      <div class="info-banner__content">
        <h3>📡 Connected to Real Data Sources:</h3>
        <ul>
          <li><strong>OpenStreetMap</strong> - Street map tiles</li>
          <li><strong>ESRI World Imagery</strong> - Satellite imagery</li>
          <li><strong>OpenTopoMap</strong> - Terrain with hillshading</li>
          <li><strong>Natural Earth</strong> - Country borders & cities</li>
          <li><strong>USGS</strong> - Real-time earthquake data (updated every minute)</li>
        </ul>
      </div>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Layer Control -->
    <LayerControl
      v-if="map"
      :map="map"
      :layers="layers"
      :groups="groups"
      :searchable="true"
      :show-opacity="true"
      :show-info="true"
      :show-zoom-to="false"
      position="top-right"
      @layer-info="handleLayerInfo"
      @layer-visibility-change="handleLayerVisibilityChange"
    />

    <!-- Instructions -->
    <div class="instructions">
      <h4>🎯 Try These Features:</h4>
      <ul>
        <li>✅ <strong>Switch basemaps</strong> - Toggle between Street, Satellite, Terrain</li>
        <li>🌍 <strong>Show borders</strong> - See country boundaries</li>
        <li>🏙️ <strong>View cities</strong> - Major population centers</li>
        <li>⚡ <strong>Enable earthquakes</strong> - Real USGS data (click markers for details!)</li>
        <li>🎚️ <strong>Adjust opacity</strong> - Make layers transparent</li>
      </ul>
      <div class="instructions__note">
        <strong>💡 Note:</strong> All data is loaded from real public APIs - no mock data!
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.simple-demo {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.simple-demo__header {
  background: linear-gradient(135deg, #000000 0%, #3f3e3f 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  h1 {
    font-size: 24px;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
  }
}

.simple-demo__badge {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  &--success {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  
  &--info {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
}

.info-banner {
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  padding: 16px 30px;

  &__content {
    max-width: 1200px;

    h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 4px;

      li {
        font-size: 13px;
        color: #666;
        line-height: 1.6;

        strong {
          color: #333;
        }
      }
    }
  }
}

.map-container {
  flex: 1;
  position: relative;
}

.instructions {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
  }

  ul {
    margin: 0 0 12px 0;
    padding-left: 20px;

    li {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
      line-height: 1.5;

      strong {
        color: #333;
      }
    }
  }

  &__note {
    padding: 12px;
    background: #e3f2fd;
    border-left: 3px solid #2196f3;
    border-radius: 4px;
    font-size: 12px;
    color: #1565c0;

    strong {
      color: #0d47a1;
    }
  }
}

@media (max-width: 768px) {
  .simple-demo__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .info-banner__content ul {
    grid-template-columns: 1fr;
  }

  .instructions {
    display: none;
  }
}
</style>