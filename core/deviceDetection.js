(function () {
  function updateDeviceFlags() {
    // A device supports touch if it exposes the touch events API or reports touch points
    window.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Consider anything narrower than 768px viewport width a "small screen" (mobile / tablet portrait)
    window.isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
  }

  // Initial evaluation
  updateDeviceFlags();

  // Re-evaluate whenever the viewport size changes (device rotation, split-screen, etc.)
  window.addEventListener('resize', updateDeviceFlags);
})(); 