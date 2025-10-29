<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LayerGroup, LayerConfig } from '../types';
import LayerItem from './LayerItem.vue';

interface Props {
  group: LayerGroup;
  showOpacity?: boolean;
  showInfo?: boolean;
  showZoomTo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showOpacity: true,
  showInfo: true,
  showZoomTo: true,
});

const emit = defineEmits<{
  'toggle-group': [groupId: string];
  'toggle-group-layers': [group: LayerGroup, visible: boolean];
  'layer-visibility-change': [layer: LayerConfig, visible: boolean];
  'layer-opacity-change': [layer: LayerConfig, opacity: number];
  'layer-zoom': [layer: LayerConfig];
  'layer-info': [layer: LayerConfig];
}>();

const allLayersVisible = computed(() => {
  return props.group.layers.every(layer => layer.visible);
});

const someLayersVisible = computed(() => {
  return props.group.layers.some(layer => layer.visible) && !allLayersVisible.value;
});

const visibleCount = computed(() => {
  return props.group.layers.filter(layer => layer.visible).length;
});

const toggleGroup = () => {
  emit('toggle-group', props.group.id);
};

const toggleAllLayers = () => {
  const newVisibility = !allLayersVisible.value;
  emit('toggle-group-layers', props.group, newVisibility);
};

const handleLayerVisibilityChange = (layer: LayerConfig, visible: boolean) => {
  emit('layer-visibility-change', layer, visible);
};

const handleLayerOpacityChange = (layer: LayerConfig, opacity: number) => {
  emit('layer-opacity-change', layer, opacity);
};

const handleLayerZoom = (layer: LayerConfig) => {
  emit('layer-zoom', layer);
};

const handleLayerInfo = (layer: LayerConfig) => {
  emit('layer-info', layer);
};
</script>

<template>
  <div class="layer-group">
    <!-- Group Header -->
    <div class="layer-group__header">
      <button
        class="layer-group__toggle"
        @click="toggleGroup"
        :aria-expanded="group.expanded"
        :aria-label="`${group.expanded ? 'Collapse' : 'Expand'} ${group.name} group`"
      >
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
          :style="{ transform: group.expanded ? 'rotate(90deg)' : 'rotate(0deg)' }"
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </button>

      <!-- Group Name -->
      <span class="layer-group__name">
        {{ group.name }}
      </span>

      <!-- Layer Count -->
      <span class="layer-group__count">
        {{ visibleCount }} / {{ group.layers.length }}
      </span>

      <!-- Group Checkbox (if group toggle enabled) -->
      <label 
        v-if="group.groupToggle"
        class="layer-group__checkbox"
        @click.stop
      >
        <input
          type="checkbox"
          :checked="allLayersVisible"
          :indeterminate="someLayersVisible"
          @change="toggleAllLayers"
        />
        <span class="layer-group__checkbox-custom"></span>
      </label>
    </div>

    <!-- Group Layers -->
    <div 
      v-show="group.expanded"
      class="layer-group__layers"
    >
      <LayerItem
        v-for="layer in group.layers"
        :key="layer.id"
        :layer="layer"
        :show-opacity="showOpacity"
        :show-info="showInfo"
        :show-zoom-to="showZoomTo"
        @visibility-change="handleLayerVisibilityChange"
        @opacity-change="handleLayerOpacityChange"
        @zoom="handleLayerZoom"
        @info="handleLayerInfo"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.layer-group {
  margin-bottom: $spacing-md;

  // Header
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: $color-background-secondary;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;
    user-select: none;

    &:hover {
      background: $color-background-hover;
    }
  }

  &__toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: $color-text;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      transition: transform $transition-normal;
    }
  }

  &__name {
    flex: 1;
    font-weight: 600;
    font-size: 14px;
  }

  &__count {
    font-size: 12px;
    color: $color-text-secondary;
    padding: 2px 6px;
    background: $color-background;
    border-radius: $radius-sm;
  }

  &__checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;

    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .layer-group__checkbox-custom {
        background: $color-primary;
        border-color: $color-primary;

        &::after {
          opacity: 1;
        }
      }

      &:indeterminate + .layer-group__checkbox-custom {
        background: $color-primary;
        border-color: $color-primary;

        &::after {
          content: '';
          width: 10px;
          height: 2px;
          background: white;
          border: none;
          transform: none;
          top: 50%;
          left: 50%;
          margin-left: -5px;
          margin-top: -1px;
          opacity: 1;
        }
      }

      &:focus-visible + .layer-group__checkbox-custom {
        outline: 2px solid $color-border-focus;
        outline-offset: 2px;
      }
    }
  }

  &__checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    position: relative;
    transition: all $transition-fast;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 5px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity $transition-fast;
    }
  }

  // Layers
  &__layers {
    padding-left: $spacing-lg;
    margin-top: $spacing-sm;
    animation: slideDown $transition-normal;
  }

  // Touch Table
  @media (min-width: $breakpoint-touch-table) {
    &__header {
      padding: $spacing-lg;
      min-height: $touch-target-large;
    }

    &__name {
      font-size: 18px;
    }

    &__checkbox-custom {
      width: 24px;
      height: 24px;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>