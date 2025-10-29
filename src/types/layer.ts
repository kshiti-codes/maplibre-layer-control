import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Layer types supported by MapLibre
 */
export type LayerType = 
  | 'raster' 
  | 'vector' 
  | 'geojson' 
  | 'fill'
  | 'line'
  | 'symbol'
  | 'circle'
  | 'heatmap'
  | 'fill-extrusion'
  | 'hillshade';

/**
 * Configuration for a single map layer
 */
export interface LayerConfig {
  /** Unique identifier for the layer */
  id: string;
  
  /** Display name shown in the UI */
  name: string;
  
  /** Whether the layer is currently visible */
  visible: boolean;
  
  /** Opacity value (0-100) */
  opacity: number;
  
  /** Type of layer */
  type: LayerType;
  
  /** MapLibre source ID */
  source?: string;
  
  /** Optional metadata */
  metadata?: LayerMetadata;
  
  /** Optional group this layer belongs to */
  groupId?: string;
  
  /** Whether this layer can be toggled */
  toggleable?: boolean;
  
  /** Whether opacity can be adjusted */
  opacityControl?: boolean;
  
  /** Minimum zoom level */
  minZoom?: number;
  
  /** Maximum zoom level */
  maxZoom?: number;
}

/**
 * Metadata about a layer
 */
export interface LayerMetadata {
  /** Description of the layer */
  description?: string;
  
  /** Data source attribution */
  source?: string;
  
  /** Attribution text */
  attribution?: string;
  
  /** Legend configuration */
  legend?: LegendConfig;
  
  /** Temporal information */
  temporal?: {
    startDate?: string;
    endDate?: string;
    currentDate?: string;
  };
  
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Legend configuration
 */
export interface LegendConfig {
  type: 'categorical' | 'gradient' | 'proportional';
  items?: LegendItem[];
  gradient?: {
    min: number;
    max: number;
    unit?: string;
    colors: string[];
  };
}

/**
 * Individual legend item
 */
export interface LegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'line';
}

/**
 * Group of layers
 */
export interface LayerGroup {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Whether the group is expanded */
  expanded: boolean;
  
  /** Layers in this group */
  layers: LayerConfig[];
  
  /** Optional icon */
  icon?: string;
  
  /** Whether all layers in group can be toggled together */
  groupToggle?: boolean;
}

/**
 * Props for LayerControl component
 */
export interface LayerControlProps {
  /** MapLibre map instance */
  map: MapLibreMap;
  
  /** Array of layer configurations */
  layers: LayerConfig[];
  
  /** Optional layer groups */
  groups?: LayerGroup[];
  
  /** Enable search functionality */
  searchable?: boolean;
  
  /** Enable drag-and-drop reordering */
  reorderable?: boolean;
  
  /** Show opacity sliders */
  showOpacity?: boolean;
  
  /** Show layer metadata/info */
  showInfo?: boolean;
  
  /** Show zoom to layer button */
  showZoomTo?: boolean;
  
  /** Collapsed by default */
  collapsed?: boolean;
  
  /** Position of the control */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Events emitted by LayerControl component
 */
export interface LayerControlEmits {
  (e: 'layer-visibility-change', layerId: string, visible: boolean): void;
  (e: 'layer-opacity-change', layerId: string, opacity: number): void;
  (e: 'layer-reorder', layers: LayerConfig[]): void;
  (e: 'layer-zoom', layerId: string): void;
  (e: 'layer-info', layerId: string): void;
}