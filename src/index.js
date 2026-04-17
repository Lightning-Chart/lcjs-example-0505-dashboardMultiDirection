/*
 * LightningChartJS example that showcases series/axes progressing to all kinds of directions inside a dashboard.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, AxisScrollStrategies, Themes } = lcjs

// Import data-generators from 'xydata'-library.
const { createProgressiveTraceGenerator, createTraceGenerator } = xydata

// Create a 3x3 dashboard.
// NOTE: Using `Dashboard` is no longer recommended for new applications. Find latest recommendations here: https://lightningchart.com/js-charts/docs/more-guides/grouping-charts/
const grid = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        }).Dashboard({
    theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    const smallView = window.devicePixelRatio >= 2
    if (!window.__lcjsDebugOverlay) {
        window.__lcjsDebugOverlay = document.createElement('div')
        window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:0;left:0;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
        if (document.body) document.body.appendChild(window.__lcjsDebugOverlay)
        setInterval(() => {
            if (!window.__lcjsDebugOverlay.parentNode && document.body) document.body.appendChild(window.__lcjsDebugOverlay)
            window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + (window.devicePixelRatio >= 2)
        }, 500)
    }
    return t && smallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.devicePixelRatio >= 2 ? lcjs.htmlTextRenderer : undefined,
    numberOfRows: 3,
    numberOfColumns: 3,
})

// Add charts to dashboard.
const cells = [
    { row: 1, col: 0 },
    { row: 2, col: 1 },
    { row: 1, col: 2 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
]
const chooseRandom = (options) => options[Math.round(Math.random() * (options.length - 1))]
const createCell = (cell) => {
    const chart = grid.createChartXY({
        columnIndex: cell.col,
        rowIndex: cell.row,
        columnSpan: 1,
        rowSpan: 1,
        legend: { visible: false },
    })
    // Add a random omni-directional series.
    const type = chooseRandom(['PointSeries', 'LineSeries'])
    // Setup data-generation for series.
    if (cell.row == cell.col) {
        const series = chart['add' + type]({})
        // Random trace
        createTraceGenerator()
            .setNumberOfPoints(100000)
            .generate()
            .setStreamInterval(50)
            .setStreamBatchSize(10)
            .setStreamRepeat(true)
            .toStream()
            .forEach((point) => series.appendSample(point))
    } else {
        // Random progressive trace with mapped direction.
        const flipPlane = cell.col == 1
        const mul = { x: cell.col == 0 ? -1 : 1, y: cell.row == 0 ? 1 : -1 }
        // Configure axes.
        let axisX = chart.getDefaultAxisX(),
            axisY = chart.getDefaultAxisY()
        if (cell.row == cells.reduce((prev, cell) => Math.max(prev, cell.row), 0)) {
            axisX.dispose()
            axisX = chart.addAxisX(true)
        }
        if (cell.col == 0) {
            axisY.dispose()
            axisY = chart.addAxisY(true)
        }
        if (mul.x < 0) {
            axisX
                .setInterval({ start: -100, end: 0, stopAxisAfter: false })
                .setScrollStrategy(flipPlane ? AxisScrollStrategies.fitting : AxisScrollStrategies.regressive)
        } else
            axisX
                .setInterval({ start: 0, end: 100, stopAxisAfter: false })
                .setScrollStrategy(flipPlane ? AxisScrollStrategies.fitting : AxisScrollStrategies.scrolling)

        if (mul.y < 0) {
            axisY
                .setInterval({ start: -100, end: 0, stopAxisAfter: false })
                .setScrollStrategy(flipPlane ? AxisScrollStrategies.regressive : AxisScrollStrategies.fitting)
        } else
            axisY
                .setInterval({ start: 0, end: 100, stopAxisAfter: false })
                .setScrollStrategy(flipPlane ? AxisScrollStrategies.scrolling : AxisScrollStrategies.fitting)

        const series = chart['add' + type](axisX, axisY)
        createProgressiveTraceGenerator()
            .setNumberOfPoints(100000)
            .generate()
            .setStreamInterval(50)
            .setStreamBatchSize(2)
            .setStreamRepeat(true)
            .toStream()
            .forEach((point) =>
                series.appendSample({ x: (flipPlane ? point.y : point.x) * mul.x, y: (flipPlane ? point.x : point.y) * mul.y }),
            )
    }
    return chart.setTitle(type)
}
cells.map(createCell)
