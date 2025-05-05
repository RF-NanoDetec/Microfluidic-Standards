// === SECTION: Touch Placement for Mobile Devices ===
// This module enables a tap-then-place workflow on touch devices where
// native HTML5 drag-and-drop is either unavailable or inconvenient.
// It is loaded early (see index.html) after deviceDetection.js.

(function () {
  if (!window.isTouch) return; // Only run on touch devices

  console.log('[Touch] Initialising tap-to-place workflow');

  // --------------------------
  // 1. State & helpers
  // --------------------------
  let currentTool = null;      // e.g. 'pump', 'straight' …
  let floatingPreview = null;  // Konva.Group that follows the finger

  // Cache references to global Konva stage/layer (initialised in konvaSetup.js)
  // We need to wait until they exist because this script loads before them.
  function getStage() {
    return window.stage; // declared globally in konvaSetup.js
  }
  function getLayer() {
    return window.layer;
  }

  // Helper to convert a client (page) coordinate to stage space
  function clientToStagePos(touch) {
    const stage = getStage();
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.container().getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  // --------------------------
  // 2. Palette tap: start placement mode
  // --------------------------
  document.querySelectorAll('[id$="-konva"]').forEach((div) => {
    // Prevent the desktop drag behaviour on touch
    div.addEventListener('touchstart', (e) => {
      const type = div.getAttribute('data-chip-type');
      if (!type) return;

      // Single-finger only to avoid conflict with scrolling
      if (e.touches.length !== 1) return;

      e.preventDefault(); // stop page scroll

      currentTool = type;
      const touch = e.touches[0];

      // Create preview if not present yet
      createFloatingPreview(type);
      updateFloatingPreviewPos(touch);
    });
  });

  // --------------------------
  // 3. Track finger movement
  // --------------------------
  window.addEventListener('touchmove', (e) => {
    if (!currentTool || !floatingPreview) return;
    const touch = e.touches[0];
    updateFloatingPreviewPos(touch);
    e.preventDefault(); // stop page scroll while dragging preview
  }, { passive: false });

  // --------------------------
  // 4. Finger up ⇒ place component
  // --------------------------
  window.addEventListener('touchend', (e) => {
    if (!currentTool || !floatingPreview) return;

    const stage = getStage();
    const layer = getLayer();
    if (!stage || !layer) { resetPlacementState(); return; }

    // Use the last known preview position (centre of preview)
    const pos = floatingPreview.position();

    placeComponent(currentTool, pos.x, pos.y);

    // After placement: clean up
    resetPlacementState();
  });

  // --------------------------
  // 5. Cancel via two-finger tap or ESC-like gesture (double tap same palette item)
  // --------------------------
  window.addEventListener('touchstart', (e) => {
    // If two fingers touch while in placement mode, cancel
    if (currentTool && e.touches.length === 2) {
      resetPlacementState();
    }
  }, { passive: true });

  // --------------------------
  // 6. Implementation details
  // --------------------------

  function createFloatingPreview(chipType) {
    const layer = getLayer();
    if (!layer) return;

    // Destroy previous preview if any
    if (floatingPreview) { floatingPreview.destroy(); }

    // Re-use preview creators used in paletteSetup
    let preview;
    try {
      switch (chipType) {
        case 'straight': preview = createStraightChipPreview(0, 0); break;
        case 'x-type':   preview = createXChipPreview(0, 0); break;
        case 't-type':   preview = createTChipPreview(0, 0); break;
        case 'meander':  preview = createMeanderChipPreview(0, 0); break;
        case 'pump':     preview = createPumpPreview(0, 0); break;
        case 'outlet':   preview = createOutletPreview(0, 0); break;
        default: console.warn('[Touch] Unknown chip type', chipType); return;
      }
    } catch (err) {
      console.error('[Touch] Preview creation failed', err);
      return;
    }

    preview.opacity(0.6);
    preview.listening(false); // non-interactive
    floatingPreview = preview;
    layer.add(preview);
    layer.batchDraw();
  }

  function updateFloatingPreviewPos(touch) {
    const stagePos = clientToStagePos(touch);
    if (floatingPreview) {
      floatingPreview.position({
        x: stagePos.x - floatingPreview.width() / 2,
        y: stagePos.y - floatingPreview.height() / 2
      });
      const layer = getLayer();
      if (layer) layer.batchDraw();
    }
  }

  function resetPlacementState() {
    currentTool = null;
    if (floatingPreview) { floatingPreview.destroy(); floatingPreview = null; }
    const layer = getLayer();
    if (layer) layer.batchDraw();
  }

  // --------------------------
  // 7. Shared creation util (desktop drop uses same logic)
  // --------------------------
  function placeComponent(chipType, x, y) {
    const layer = getLayer();
    if (!layer) return;

    let newItem = null;
    switch (chipType) {
      case 'pump':    newItem = createPump(x - itemWidth/2,  y - itemHeight/2); break;
      case 'outlet':  newItem = createOutlet(x - outletWidth/2, y - outletHeight/2); break;
      case 'straight': newItem = createStraightChip(x - chipWidth/2, y - chipHeight/2); break;
      case 'x-type':   newItem = createXChip(x - chipWidth/2, y - chipHeight/2); break;
      case 't-type':   newItem = createTChip(x - chipWidth/2, y - chipHeight/2); break;
      case 'meander':  newItem = createMeanderChip(x - chipWidth/2, y - chipHeight/2); break;
      default: console.warn('[Touch] Unsupported tool', chipType);
    }

    if (newItem) {
      layer.add(newItem);
      // Hide getting-started overlay
      const overlay = document.getElementById('getting-started-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
      }

      if (typeof updateComponentList === 'function') updateComponentList();
      if (typeof calculateAndDisplayTubing === 'function') calculateAndDisplayTubing();
      if (typeof findFlowPathAndHighlight === 'function') findFlowPathAndHighlight();

      layer.draw();
    }
  }
})(); 