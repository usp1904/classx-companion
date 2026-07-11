---
name: viz-generator
description: Generates clean, production-ready JSON config schemas to render interactive coordinate graphs, geometric shapes, and ray tracking modules.
triggers: ["visualize", "draw", "graph", "geometry proof", "ray diagram", "chemical bond", "molecular structure"]
---
# Visual Graphing & Schema Generation Contract

When a student requests to see, draw, or visualize a concept, do not provide basic text descriptions or ASCII art. You must deliver a highly comprehensive text breakdown followed by a clean, production-ready JSON code block that your application's front-end charting components can instantly parse and render.

## 1. Mandatory Schema Contract
```json
{
  "rendererType": "COORDINATE_GRAPH" | "GEOMETRY_2D_PROOF" | "PHYSICS_OPTICS_RAY" | "CHEM_MOLECULAR_BOND",
  "syllabusSource": "NCERT_2026_27" | "RD_SHARMA" | "RS_AGGARWAL",
  "visualizationProperties": {}
}
```

## 2. Core Rendering Specifications

### A. Coordinate Functions & Curve Visualizer (`COORDINATE_GRAPH`)
- Use this to map paths, parabolas, and linear intersections:
```json
{
  "rendererType": "COORDINATE_GRAPH",
  "syllabusSource": "RD_SHARMA",
  "visualizationProperties": {
    "functionString": "2x^2 - 5x + 3",
    "curveColor": "#FF5733",
    "turningPointVertex": [1.25, -0.125],
    "xAxisIntersections": [1.0, 1.5],
    "yAxisIntersection": [0.0, 3.0],
    "gridRange": {"xMin": -2, "xMax": 4, "yMin": -2, "yMax": 6}
  }
}
```

### B. Geometry & Triangle Elements (`GEOMETRY_2D_PROOF`)
- Use this to map out lines, parallel systems, and triangle points from theorems:
```json
{
  "rendererType": "GEOMETRY_2D_PROOF",
  "syllabusSource": "RS_AGGARWAL",
  "visualizationProperties": {
    "geometricShape": "RIGHT_TRIANGLE",
    "coordinates": {"A": [0, 4], "B": [0, 0], "C": [3, 0]},
    "sideLengths": {"AB": 4, "BC": 3, "CA": 5},
    "angleMeasurements": {"B": 90, "A": 36.87, "C": 53.13},
    "dynamicLabels": {"A": "A (Height)", "B": "B (Base Corner)", "C": "C"}
  }
}
```

### C. Optics Ray Vectors (`PHYSICS_OPTICS_RAY`)
- Use this to track light pathways, mirror orientations, and focus zones:
```json
{
  "rendererType": "PHYSICS_OPTICS_RAY",
  "syllabusSource": "NCERT_2026_27",
  "visualizationProperties": {
    "mirrorLensDevice": "CONCAVE_MIRROR",
    "focalLengthCm": -15,
    "objectPositionCm": -30,
    "calculatedImagePositionCm": -30,
    "magnificationFactor": -1,
    "lightVectorPaths": [
      {"from": [-30, 10], "type": "PARALLEL_TO_AXIS", "reflectsThrough": "FOCUS"},
      {"from": [-30, 10], "type": "THROUGH_CENTER_OF_CURVATURE", "reflectsThrough": "RETRAIL_PATH"}
    ]
  }
}
```
