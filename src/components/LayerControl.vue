<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { LayerConfig, LayerGroup, LayerControlProps } from '../types';
import { useMapLayers } from '../composables/useMapLayers';
import LayerItem from './LayerItem.vue';
import LayerGroupItem from './LayerGroupItem.vue';

// Props with defaults
const props = withDefaults(defineProps<LayerControlProps>(), {
  searchable: true,
  reorderable: false,
  showOpacity: true,
  showInfo: true,
  showZoomTo: true,
  collapsed: false,
  position: 'top-right',
});

// Emits
const emit = defineEmits<{
  'layer-visibility-change': [layerId: string, visible: boolean];
  'layer-opacity-change': [layerId: string, opacity: number];
  'layer-reorder': [layers: LayerConfig[]];
  'layer-zoom': [layerId: string];
  'layer-info': [layerId: string];
}>();

// Composable for map operations
const { 
  mapReady, 
  toggleLayerVisibility, 
  updateLayerOpacity, 
  zoomToLayer,
  updateLayerOrder 
} = useMapLayers(props.map);

// Local state
const searchQuery = ref('');
const isCollapsed = ref(props.collapsed);
const localLayers = ref<LayerConfig[]>([...props.layers]);
const localGroups = ref<LayerGroup[]>(props.groups ? [...props.groups] : []);

// Watch for external layer changes
watch(() => props.layers, (newLayers) => {
  localLayers.value = [...newLayers];
}, { deep: true });

// Computed: Filtered layers based on search
const filteredLayers = computed(() => {
  if (!searchQuery.value.trim()) {
    return localLayers.value;
  }

  const query = searchQuery.value.toLowerCase();
  return localLayers.value.filter(layer => 
    layer.name.toLowerCase().includes(query) ||
    layer.metadata?.description?.toLowerCase().includes(query) ||
    layer.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
  );
});

// Computed: Filtered groups based on search
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return localGroups.value;
  }

  const query = searchQuery.value.toLowerCase();
  return localGroups.value.map(group => ({
    ...group,
    layers: group.layers.filter(layer =>
      layer.name.toLowerCase().includes(query) ||
      layer.metadata?.description?.toLowerCase().includes(query)
    )
  })).filter(group => group.layers.length > 0);
});

// Computed: Ungrouped layers
const ungroupedLayers = computed(() => {
  if (!props.groups || props.groups.length === 0) {
    return filteredLayers.value;
  }

  const groupedLayerIds = new Set(
    props.groups.flatMap(group => group.layers.map(layer => layer.id))
  );

  return filteredLayers.value.filter(layer => !groupedLayerIds.has(layer.id));
});

// Toggle control collapsed state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// Handle layer visibility change
const handleLayerVisibilityChange = (layer: LayerConfig, visible: boolean) => {
  layer.visible = visible;
  toggleLayerVisibility(layer, visible);
  emit('layer-visibility-change', layer.id, visible);
};

// Handle layer opacity change
const handleLayerOpacityChange = (layer: LayerConfig, opacity: number) => {
  layer.opacity = opacity;
  updateLayerOpacity(layer, opacity);
  emit('layer-opacity-change', layer.id, opacity);
};

// Handle zoom to layer
const handleZoomToLayer = (layer: LayerConfig) => {
  zoomToLayer(layer);
  emit('layer-zoom', layer.id);
};

// Handle layer info request
const handleLayerInfo = (layer: LayerConfig) => {
  emit('layer-info', layer.id);
};

// Toggle all layers in a group
const toggleGroupLayers = (group: LayerGroup, visible: boolean) => {
  group.layers.forEach(layer => {
    if (layer.toggleable !== false) {
      handleLayerVisibilityChange(layer, visible);
    }
  });
};

// Toggle group expanded state
const toggleGroupExpanded = (groupId: string) => {
  const group = localGroups.value.find(g => g.id === groupId);
  if (group) {
    group.expanded = !group.expanded;
  }
};

// Get all visible layers count
const visibleLayersCount = computed(() => {
  return localLayers.value.filter(layer => layer.visible).length;
});

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
};
</script>
<template>
  <div 
    class="layer-control"
    :class="[
      `layer-control--${position}`,
      { 'layer-control--collapsed': isCollapsed }
    ]"
  >
    <!-- Header -->
    <div class="layer-control__header">
      <div class="layer-control__title">
        <h3>Layers</h3>
        <span class="layer-control__count">
          {{ visibleLayersCount }} / {{ localLayers.length }}
        </span>
      </div>
      <button 
        class="layer-control__toggle"
        @click="toggleCollapse"
        :aria-label="isCollapsed ? 'Expand layers' : 'Collapse layers'"
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
          :style="{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }"
        >
          <path d="M8 11L3 6h10z" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Content (hidden when collapsed) -->
    <div v-show="!isCollapsed" class="layer-control__content">
      <!-- Search Bar -->
      <div v-if="searchable" class="layer-control__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search layers..."
          class="layer-control__search-input"
          aria-label="Search layers"
        />
        <button
          v-if="searchQuery"
          class="layer-control__search-clear"
          @click="clearSearch"
          aria-label="Clear search"
        >
          ×
        </button>
      </div>

      <!-- No Results -->
      <div 
        v-if="searchQuery && filteredLayers.length === 0 && filteredGroups.length === 0"
        class="layer-control__no-results"
      >
        No layers found matching "{{ searchQuery }}"
      </div>

      <!-- Layers List -->
      <div class="layer-control__list">
        <!-- Groups -->
        <LayerGroupItem
          v-for="group in filteredGroups"
          :key="group.id"
          :group="group"
          :show-opacity="showOpacity"
          :show-info="showInfo"
          :show-zoom-to="showZoomTo"
          @toggle-group="toggleGroupExpanded"
          @toggle-group-layers="toggleGroupLayers"
          @layer-visibility-change="handleLayerVisibilityChange"
          @layer-opacity-change="handleLayerOpacityChange"
          @layer-zoom="handleZoomToLayer"
          @layer-info="handleLayerInfo"
        />

        <!-- Ungrouped Layers -->
        <LayerItem
          v-for="layer in ungroupedLayers"
          :key="layer.id"
          :layer="layer"
          :show-opacity="showOpacity"
          :show-info="showInfo"
          :show-zoom-to="showZoomTo"
          @visibility-change="handleLayerVisibilityChange"
          @opacity-change="handleLayerOpacityChange"
          @zoom="handleZoomToLayer"
          @info="handleLayerInfo"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.layer-control {
  width: 100%;
  max-width: 320px;
  background: $color-background;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  color: $color-text;
  overflow: hidden;

  // Position variations
  &--top-right {
    position: absolute;
    top: $spacing-lg;
    right: $spacing-lg;
    max-height: calc(100vh - #{$spacing-xl * 2});
  }

  &--top-left {
    position: absolute;
    top: $spacing-lg;
    left: $spacing-lg;
    max-height: calc(100vh - #{$spacing-xl * 2});
  }

  &--bottom-right {
    position: absolute;
    bottom: $spacing-lg;
    right: $spacing-lg;
    max-height: calc(100vh - #{$spacing-xl * 2});
  }

  &--bottom-left {
    position: absolute;
    bottom: $spacing-lg;
    left: $spacing-lg;
    max-height: calc(100vh - #{$spacing-xl * 2});
  }

  // Collapsed state
  &--collapsed {
    max-height: 48px;
  }

  // Header
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $color-border;
    background: $color-background-secondary;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  &__count {
    font-size: 12px;
    color: $color-text-secondary;
    padding: 2px 6px;
    background: $color-background;
    border-radius: $radius-sm;
  }

  &__toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    color: $color-text;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    transition: all $transition-fast;

    &:hover {
      background: $color-background-hover;
    }

    &:focus-visible {
      outline: 2px solid $color-border-focus;
      outline-offset: 2px;
    }

    svg {
      transition: transform $transition-normal;
    }
  }

  // Content
  &__content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  // Search
  &__search {
    position: relative;
    padding: $spacing-md;
    border-bottom: 1px solid $color-border;
  }

  &__search-input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    padding-right: $spacing-xl;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    font-size: 14px;
    transition: border-color $transition-fast;

    &:focus {
      outline: none;
      border-color: $color-border-focus;
    }

    &::placeholder {
      color: $color-text-disabled;
    }
  }

  &__search-clear {
    position: absolute;
    right: $spacing-lg;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 20px;
    color: $color-text-secondary;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    &:hover {
      background: $color-background-hover;
      color: $color-text;
    }
  }

  // No results
  &__no-results {
    padding: $spacing-xl;
    text-align: center;
    color: $color-text-secondary;
    font-size: 13px;
  }

  // List
  &__list {
    overflow-y: auto;
    max-height: 500px;
    padding: $spacing-sm;

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: $color-background-secondary;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-border;
      border-radius: $radius-sm;

      &:hover {
        background: $color-text-secondary;
      }
    }
  }

  // Responsive: Mobile
  @media (max-width: $breakpoint-tablet) {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    max-width: 100%;
    border-radius: $radius-lg $radius-lg 0 0;
    max-height: 70vh;

    &__list {
      max-height: calc(70vh - 120px);
    }
  }

  // Touch Table
  @media (min-width: $breakpoint-touch-table) {
    max-width: 400px;
    font-size: 16px;

    &__header {
      padding: $spacing-lg $spacing-xl;

      h3 {
        font-size: 20px;
      }
    }

    &__list {
      max-height: 600px;
    }
  }
}
</style>