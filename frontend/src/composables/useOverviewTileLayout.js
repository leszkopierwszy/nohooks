import { ref } from 'vue'
import {
  DEFAULT_TILE_LAYOUT,
  applyDefaultColumnLayout,
  normalizeTileLayout,
} from '../constants/overviewGrid'

export function useOverviewTileLayout() {
  const layout = ref(
    normalizeTileLayout(
      applyDefaultColumnLayout(structuredClone(DEFAULT_TILE_LAYOUT)),
    ),
  )

  return { layout }
}
