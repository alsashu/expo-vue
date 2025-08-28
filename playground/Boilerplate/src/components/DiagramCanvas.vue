<template>
  <div class="diagram-canvas">
    <div ref="diagramDiv" style="width: 100%; height: 500px; background: #f8f9fa;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as go from 'gojs'
import { useDiagramStore } from '@/stores/diagram'

const diagramStore = useDiagramStore()
const diagramDiv = ref<HTMLDivElement | null>(null)
let diagram: go.Diagram | null = null

onMounted(async () => {
  await diagramStore.load()
  initDiagram()
})

onUnmounted(() => {
  if (diagram) {
    diagram.div = null
  }
})

const initDiagram = () => {
  if (!diagramDiv.value) return

  diagram = go.GraphObject.make(go.Diagram, diagramDiv.value, {
    'undoManager.isEnabled': true,
    layout: go.GraphObject.make(go.ForceDirectedLayout),
    model: go.GraphObject.make(go.GraphLinksModel)
  })

  // Define node template
  diagram.nodeTemplate = go.GraphObject.make(
    go.Node,
    'Auto',
    {
      locationSpot: go.Spot.Center,
      locationObjectName: 'SHAPE',
      selectionObjectName: 'SHAPE'
    },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    go.GraphObject.make(
      go.Shape,
      'RoundedRectangle',
      {
        name: 'SHAPE',
        fill: 'lightblue',
        stroke: 'darkblue',
        strokeWidth: 2,
        portId: '',
        cursor: 'pointer'
      },
      new go.Binding('fill', 'category', (cat) => {
        switch (cat) {
          case 'Supplier': return '#ffeb3b'
          case 'Item': return '#4caf50'
          case 'Consumer': return '#f44336'
          default: return 'lightblue'
        }
      })
    ),
    go.GraphObject.make(
      go.TextBlock,
      {
        margin: 8,
        editable: true,
        font: 'bold 14px sans-serif'
      },
      new go.Binding('text').makeTwoWay()
    )
  )

  // Define link template
  diagram.linkTemplate = go.GraphObject.make(
    go.Link,
    {
      routing: go.Link.AvoidsNodes,
      corner: 5,
      curve: go.Link.JumpOver
    },
    go.GraphObject.make(
      go.Shape,
      { stroke: '#424242', strokeWidth: 2 }
    ),
    go.GraphObject.make(
      go.Shape,
      { toArrow: 'Standard', fill: '#424242', stroke: null }
    )
  )

  // Load initial data
  if (diagramStore.diagram) {
    diagram.model = go.Model.fromJson(JSON.stringify({
      class: 'go.GraphLinksModel',
      nodeDataArray: diagramStore.diagram.nodes,
      linkDataArray: diagramStore.diagram.links
    }))
  } else {
    // Create default diagram with properly typed data
    const defaultData = {
      nodes: [
        { key: 'supplier1', text: 'Supplier A', category: 'Supplier' as const, loc: '0 0' },
        { key: 'item1', text: 'Product X', category: 'Item' as const, loc: '150 0' },
        { key: 'consumer1', text: 'Customer B', category: 'Consumer' as const, loc: '300 0' }
      ],
      links: [
        { from: 'supplier1', to: 'item1' },
        { from: 'item1', to: 'consumer1' }
      ]
    }

    diagram.model = go.Model.fromJson(JSON.stringify({
      class: 'go.GraphLinksModel',
      nodeDataArray: defaultData.nodes,
      linkDataArray: defaultData.links
    }))

    // Save the default diagram
    diagramStore.save(defaultData)
  }

  // Listen for model changes and auto-save
  diagram.addModelChangedListener((evt) => {
    if (!evt.isTransactionFinished) return

    const model = diagram?.model as go.GraphLinksModel
    if (model) {
      const diagramData = {
        nodes: model.nodeDataArray.map(node => ({
          key: node.key as string,
          text: (node as any).text || '',
          category: (node as any).category as 'Supplier' | 'Item' | 'Consumer' | undefined,
          loc: (node as any).loc
        })),
        links: model.linkDataArray.map(link => ({
          from: link.from as string,
          to: link.to as string
        }))
      }

      diagramStore.save(diagramData)
    }
  })
}
</script>

<style scoped>
.diagram-canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}
</style>