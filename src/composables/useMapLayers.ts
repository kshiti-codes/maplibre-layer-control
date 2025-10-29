import { ref } from 'vue';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerConfig } from '../types';

export function useMapLayers(map: MapLibreMap) {
  const mapReady = ref(false);

  // Check if map is loaded
  if (map.loaded()) {
    mapReady.value = true;
    console.log('✅ Map already loaded');
  } else {
    map.once('load', () => {
      mapReady.value = true;
      console.log('✅ Map loaded');
    });
  }

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = (layer: LayerConfig, visible: boolean) => {
    console.log(`🔄 Toggle visibility: ${layer.id} → ${visible}`);
    
    if (!mapReady.value) {
      console.warn('⚠️ Map not ready yet');
      return;
    }

    if (!map.getLayer(layer.id)) {
      console.error(`❌ Layer "${layer.id}" not found on map`);
      console.log('Available layers:', map.getStyle().layers.map(l => l.id));
      return;
    }

    try {
      map.setLayoutProperty(
        layer.id,
        'visibility',
        visible ? 'visible' : 'none'
      );
      console.log(`✅ Visibility changed: ${layer.id} → ${visible ? 'visible' : 'none'}`);
    } catch (error) {
      console.error(`❌ Error toggling visibility for ${layer.id}:`, error);
    }
  };

  /**
   * Update layer opacity
   */
  const updateLayerOpacity = (layer: LayerConfig, opacity: number) => {
    console.log(`🔄 Update opacity: ${layer.id} → ${opacity}%`);
    
    if (!mapReady.value) {
      console.warn('⚠️ Map not ready yet');
      return;
    }

    if (!map.getLayer(layer.id)) {
      console.error(`❌ Layer "${layer.id}" not found on map`);
      return;
    }

    const opacityValue = opacity / 100;
    const opacityProperty = getOpacityProperty(layer.type);
    
    if (!opacityProperty) {
      console.warn(`⚠️ No opacity property for layer type: ${layer.type}`);
      return;
    }

    try {
      map.setPaintProperty(layer.id, opacityProperty, opacityValue);
      console.log(`✅ Opacity changed: ${layer.id} → ${opacity}%`);
    } catch (error) {
      console.error(`❌ Error updating opacity for ${layer.id}:`, error);
    }
  };

  /**
   * Get the correct opacity property for a layer type
   */
  const getOpacityProperty = (type: string): string | null => {
    const opacityMap: Record<string, string> = {
      'raster': 'raster-opacity',
      'fill': 'fill-opacity',
      'line': 'line-opacity',
      'circle': 'circle-opacity',
      'symbol': 'icon-opacity',
      'fill-extrusion': 'fill-extrusion-opacity',
      'heatmap': 'heatmap-opacity',
      'hillshade': 'hillshade-illumination-anchor',
    };

    return opacityMap[type] || null;
  };

  /**
   * Zoom to layer bounds
   */
  const zoomToLayer = (layer: LayerConfig) => {
    console.log(`🔍 Zoom to layer: ${layer.id}`);
    
    if (!mapReady.value || !map.getLayer(layer.id)) {
      console.warn(`⚠️ Cannot zoom to layer ${layer.id}`);
      return;
    }

    // For demo purposes, just zoom to current center
    // In production, you'd calculate actual bounds from features
    const center = map.getCenter();
    map.flyTo({
      center: [center.lng, center.lat],
      zoom: map.getZoom() + 1,
      duration: 1000,
    });
    
    console.log(`✅ Zoomed to layer: ${layer.id}`);
  };

  /**
   * Update layer order in the map
   */
  const updateLayerOrder = (layers: LayerConfig[]) => {
    if (!mapReady.value) return;

    const reversedLayers = [...layers].reverse();
    
    reversedLayers.forEach((layer, index) => {
      if (map.getLayer(layer.id)) {
        if (index === 0) {
          map.moveLayer(layer.id);
        } else {
          const previousLayer = reversedLayers[index - 1];
          if (previousLayer && map.getLayer(previousLayer.id)) {
            map.moveLayer(layer.id, previousLayer.id);
          }
        }
      }
    });
  };

  return {
    mapReady,
    toggleLayerVisibility,
    updateLayerOpacity,
    zoomToLayer,
    updateLayerOrder,
  };
}