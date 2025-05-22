import type { CanvasItemData, Port } from '@/lib/microfluidic-designer/types';

// Tuning parameters for better path visualization
const DEFAULT_CONNECTION_STUB_LENGTH = 3; // Reduced from 25 to 12 for shorter stubs
const MIN_CONTROL_POINT_EXTENSION = 5; // Reduced from 30 to 20 to match shorter stubs
const DYNAMIC_CONTROL_POINT_FACTOR = 0.3; // How much to scale control points based on distance

/**
 * Calculates the SVG path data for a temporary connection during dragging operations
 * This is a simplified version that only shows one stub from the source and curves to mouse position
 *
 * @param sourceItem Source item with a port where connection starts
 * @param sourcePort Source port from which connection originates
 * @param mousePosition Current mouse position to draw connection toward
 * @returns SVG path data string for the temporary connection
 */
export function calculateTemporaryConnectionPath(
  sourceItem: CanvasItemData,
  sourcePort: Port,
  mousePosition: { x: number, y: number }
): string {
  if (!sourcePort.orientation || sourcePort.orientation === 'none') {
    // Fallback for missing orientation
    const p1 = { x: sourceItem.x + sourcePort.x, y: sourceItem.y + sourcePort.y };
    return `M ${p1.x} ${p1.y} L ${mousePosition.x} ${mousePosition.y}`;
  }

  // Absolute position of source port
  const portPos = { 
    x: sourceItem.x + sourcePort.x, 
    y: sourceItem.y + sourcePort.y 
  };

  // Calculate stub end point based on port orientation
  const stubEnd = { ...portPos };
  let stubVector = { x: 0, y: 0 }; // Direction vector of the stub
  
  // Calculate stub end position and direction vector based on orientation
  switch (sourcePort.orientation) {
    case 'left':
      stubEnd.x -= DEFAULT_CONNECTION_STUB_LENGTH;
      stubVector = { x: -1, y: 0 };
      break;
    case 'right':
      stubEnd.x += DEFAULT_CONNECTION_STUB_LENGTH;
      stubVector = { x: 1, y: 0 };
      break;
    case 'top':
      stubEnd.y -= DEFAULT_CONNECTION_STUB_LENGTH;
      stubVector = { x: 0, y: -1 };
      break;
    case 'bottom':
      stubEnd.y += DEFAULT_CONNECTION_STUB_LENGTH;
      stubVector = { x: 0, y: 1 };
      break;
  }

  // Calculate distance between stub end and mouse position for curve scaling
  const dx = mousePosition.x - stubEnd.x;
  const dy = mousePosition.y - stubEnd.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for smooth curve
  const controlPointDistance = Math.max(distance * DYNAMIC_CONTROL_POINT_FACTOR, MIN_CONTROL_POINT_EXTENSION);
  
  // First control point extends from stub end in the same direction as the stub
  const cp1 = {
    x: stubEnd.x + stubVector.x * controlPointDistance,
    y: stubEnd.y + stubVector.y * controlPointDistance
  };
  
  // Second control point comes from mouse position, pulling in the opposite direction
  // This creates smoother curves without backward bends
  const cp2 = {
    x: mousePosition.x - dx * 0.3, // Pull slightly toward stub end
    y: mousePosition.y - dy * 0.3
  };
  
  // Return SVG path from port to mouse position with smooth curve
  return `M ${portPos.x} ${portPos.y} L ${stubEnd.x} ${stubEnd.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${mousePosition.x} ${mousePosition.y}`;
}

/**
 * Calculates the SVG path data for a curved tube connection between two ports.
 * Uses Bezier curves for smooth transitions with better control point calculations
 * to prevent unnatural bends.
 *
 * @param sourceItem The source canvas item
 * @param sourcePort The source port on the source item
 * @param targetItem The target canvas item
 * @param targetPort The target port on the target item
 * @returns SVG path data string for a natural-looking tube connection
 */
export function calculateTubePathData(
  sourceItem: CanvasItemData,
  sourcePort: Port,
  targetItem: CanvasItemData,
  targetPort: Port
): string {
  // Handle missing orientations with a simple straight line
  if (!sourcePort.orientation || sourcePort.orientation === 'none' || 
      !targetPort.orientation || targetPort.orientation === 'none') {
    const p1 = { x: sourceItem.x + sourcePort.x, y: sourceItem.y + sourcePort.y };
    const p2 = { x: targetItem.x + targetPort.x, y: targetItem.y + targetPort.y };
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  // Absolute positions of ports
  const p1 = { x: sourceItem.x + sourcePort.x, y: sourceItem.y + sourcePort.y };
  const p2 = { x: targetItem.x + targetPort.x, y: targetItem.y + targetPort.y };

  // Get port orientations
  const orient1 = sourcePort.orientation;
  const orient2 = targetPort.orientation;

  // Initialize direction vectors for each port
  let dir1 = { x: 0, y: 0 };
  let dir2 = { x: 0, y: 0 };

  // Calculate direction vectors based on port orientations
  switch (orient1) {
    case 'left': dir1 = { x: -1, y: 0 }; break;
    case 'right': dir1 = { x: 1, y: 0 }; break;
    case 'top': dir1 = { x: 0, y: -1 }; break;
    case 'bottom': dir1 = { x: 0, y: 1 }; break;
  }

  switch (orient2) {
    case 'left': dir2 = { x: -1, y: 0 }; break;
    case 'right': dir2 = { x: 1, y: 0 }; break;
    case 'top': dir2 = { x: 0, y: -1 }; break;
    case 'bottom': dir2 = { x: 0, y: 1 }; break;
  }

  // Calculate stub endpoints
  const stub1End = {
    x: p1.x + dir1.x * DEFAULT_CONNECTION_STUB_LENGTH,
    y: p1.y + dir1.y * DEFAULT_CONNECTION_STUB_LENGTH
  };

  const stub2End = {
    x: p2.x + dir2.x * DEFAULT_CONNECTION_STUB_LENGTH,
    y: p2.y + dir2.y * DEFAULT_CONNECTION_STUB_LENGTH
  };

  // Calculate distance between stub endpoints to scale control points
  const dx = stub2End.x - stub1End.x;
  const dy = stub2End.y - stub1End.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Determine if ports face in opposing directions (for S-curves)
  const isOpposing = (
    (orient1 === 'left' && orient2 === 'right') ||
    (orient1 === 'right' && orient2 === 'left') ||
    (orient1 === 'top' && orient2 === 'bottom') ||
    (orient1 === 'bottom' && orient2 === 'top')
  );
  
  // Calculate control point distances
  let controlDist = Math.max(distance * DYNAMIC_CONTROL_POINT_FACTOR, MIN_CONTROL_POINT_EXTENSION);
  if (isOpposing) {
    // For opposing ports, increase control extension to smooth S-curves
    controlDist *= 1.5;
  }
  
  // Calculate control points that continue in the direction of the stubs
  const cp1 = {
    x: stub1End.x + dir1.x * controlDist,
    y: stub1End.y + dir1.y * controlDist
  };
  
  const cp2 = {
    x: stub2End.x + dir2.x * controlDist,
    y: stub2End.y + dir2.y * controlDist
  };
  
  // Build the complete path
  return `M ${p1.x} ${p1.y} L ${stub1End.x} ${stub1End.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${stub2End.x} ${stub2End.y} L ${p2.x} ${p2.y}`;
} 