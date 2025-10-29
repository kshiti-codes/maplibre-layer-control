<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LayerConfig } from '../types';

interface Props {
  layer: LayerConfig;
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
  'visibility-change': [layer: LayerConfig, visible: boolean];
  'opacity-change': [layer: LayerConfig, opacity: number];
  'zoom': [layer: LayerConfig];
  'info': [layer: LayerConfig];
}>();

const localVisible = ref(props.layer.visible);
const localOpacity = ref(props.layer.opacity);
const showingOpacity = ref(false);

const toggleVisibility = () => {
  localVisible.value = !localVisible.value;
  emit('visibility-change', props.layer, localVisible.value);
};

const updateOpacity = (event: Event) => {
  const target = event.target as HTMLInputElement;
  localOpacity.value = parseInt(target.value);
  emit('opacity-change', props.layer, localOpacity.value);
};

const handleZoom = () => {
  emit('zoom', props.layer);
};

const handleInfo = () => {
  emit('info', props.layer);
};

const toggleOpacitySlider = () => {
  showingOpacity.value = !showingOpacity.value;
};

// Get icon based on layer type
const layerIcon = computed(() => {
  const icons: Record<string, string> = {
    'raster': '🗺️',
    'vector': '📍',
    'fill': '⬜',
    'line': '〰️',
    'circle': '⚫',
    'symbol': '📌',
    'heatmap': '🔥',
  };
  return icons[props.layer.type] || '📄';
});
</script>

<template>
  <div 
    class="layer-item"
    :class="{ 'layer-item--inactive': !localVisible }"
  >
    <div class="layer-item__main">
      <!-- Visibility Checkbox -->
      <label class="layer-item__checkbox">
        <input
          type="checkbox"
          :checked="localVisible"
          @change="toggleVisibility"
          :disabled="layer.toggleable === false"
        />
        <span class="layer-item__checkbox-custom"></span>
      </label>

      <!-- Layer Name -->
      <span class="layer-item__name">
        {{ layer.name }}
      </span>

      <!-- Actions -->
      <div class="layer-item__actions">
        <!-- Opacity Button -->
        <button
          v-if="showOpacity && layer.opacityControl !== false"
          class="layer-item__action"
          @click="toggleOpacitySlider"
          :title="`Opacity: ${localOpacity}%`"
          :aria-label="'Adjust opacity'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 2v12M4 8h8" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <!-- Zoom Button -->
        <button
          v-if="showZoomTo"
          class="layer-item__action"
          @click="handleZoom"
          title="Zoom to layer"
          aria-label="Zoom to layer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M11 11l4 4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <!-- Info Button -->
        <button
          v-if="showInfo && layer.metadata"
          class="layer-item__action"
          @click="handleInfo"
          title="Layer information"
          aria-label="Show layer information"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M8 7v4M8 4v1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Opacity Slider (expandable) -->
    <div 
      v-if="showOpacity && layer.opacityControl !== false" 
      v-show="showingOpacity"
      class="layer-item__opacity"
    >
      <input
        type="range"
        min="0"
        max="100"
        :value="localOpacity"
        @input="updateOpacity"
        class="layer-item__opacity-slider"
        aria-label="Layer opacity"
      />
      <span class="layer-item__opacity-value">
        {{ localOpacity }}%
      </span>
    </div>

    <!-- Metadata (if available) -->
    <div 
      v-if="layer.metadata?.description"
      class="layer-item__description"
    >
      {{ layer.metadata.description }}
    </div>
  </div>
</template>
<style lang="scss" scoped>
.layer-item {
  border: 1px solid $color-border;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  background: $color-background;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-primary;
    box-shadow: $shadow-sm;
  }

  &--inactive {
    opacity: 0.6;
  }

  // Main row
  &__main {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
  }

  // Checkbox
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

      &:checked + .layer-item__checkbox-custom {
        background: $color-primary;
        border-color: $color-primary;

        &::after {
          opacity: 1;
        }
      }

      &:disabled + .layer-item__checkbox-custom {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:focus-visible + .layer-item__checkbox-custom {
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

  // Icon
  &__icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  // Name
  &__name {
    flex: 1;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Actions
  &__actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__action {
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    transition: all $transition-fast;
    flex-shrink: 0;

    &:hover {
      background: $color-background-hover;
      color: $color-text;
    }

    &:focus-visible {
      outline: 2px solid $color-border-focus;
      outline-offset: 2px;
    }
  }

  // Opacity Slider
  &__opacity {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-sm $spacing-md;
    padding-top: 0;
    animation: slideDown $transition-normal;
  }

  &__opacity-slider {
    flex: 1;
    height: 4px;
    appearance: none;
    background: $color-background-secondary;
    border-radius: $radius-sm;
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: $color-primary;
      border-radius: 50%;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $color-primary-hover;
        transform: scale(1.1);
      }
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: $color-primary;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $color-primary-hover;
        transform: scale(1.1);
      }
    }

    &:focus-visible {
      &::-webkit-slider-thumb {
        outline: 2px solid $color-border-focus;
        outline-offset: 2px;
      }

      &::-moz-range-thumb {
        outline: 2px solid $color-border-focus;
        outline-offset: 2px;
      }
    }
  }

  &__opacity-value {
    font-size: 12px;
    color: $color-text-secondary;
    min-width: 35px;
    text-align: right;
  }

  // Description
  &__description {
    padding: 0 $spacing-md $spacing-md;
    font-size: 12px;
    color: $color-text-secondary;
    line-height: 1.4;
  }

  // Touch Table
  @media (min-width: $breakpoint-touch-table) {
    &__main {
      padding: $spacing-lg;
      min-height: $touch-target-large;
    }

    &__checkbox-custom {
      width: 24px;
      height: 24px;
    }

    &__icon {
      font-size: 20px;
    }

    &__name {
      font-size: 18px;
    }

    &__action {
      padding: $spacing-md;
      
      svg {
        width: 20px;
        height: 20px;
      }
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