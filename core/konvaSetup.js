// === SECTION: Canvas & Stage Initialization ===
// Get the container dimensions from CSS
const containerElement = document.getElementById('konva-stage');
const initialStageWidth = containerElement ? containerElement.offsetWidth : 600; // Fallback size
const initialStageHeight = containerElement ? containerElement.offsetHeight : 400; // Fallback size

// 1. Create the Konva Stage
const stage = new Konva.Stage({
    container: 'konva-stage', // ID of the container div
    width: initialStageWidth,
    height: initialStageHeight,
});

// 2. Create a Layer
const layer = new Konva.Layer();

// 3. Add the layer to the stage
stage.add(layer);

// Expose globally for other scripts (touchPlacement etc.)
window.stage = stage;
window.layer = layer;

// 4. Initial Draw (optional, stage might resize later)
layer.draw();
console.log('Konva stage and layer initialized.'); 