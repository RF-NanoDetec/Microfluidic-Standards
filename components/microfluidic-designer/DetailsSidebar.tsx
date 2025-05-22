import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CanvasItemData } from "@/lib/microfluidic-designer/types";
import { calculateRectangularChannelResistance } from "@/lib/microfluidic-designer/resistanceUtils";
import { FLUID_VISCOSITY_PAS } from "@/lib/microfluidic-designer/constants";

interface DetailsSidebarProps {
  selectedItem: CanvasItemData | undefined | null;
  onItemPropertyChange?: (itemId: string, propertyName: keyof CanvasItemData, value: any) => void;
}

export default function DetailsSidebar({ selectedItem, onItemPropertyChange }: DetailsSidebarProps) {
  const handleInputChange = (propertyName: keyof CanvasItemData, value: string) => {
    if (!selectedItem || !onItemPropertyChange) return;
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onItemPropertyChange(selectedItem.id, propertyName, numericValue);
    }
  };

  const handlePortPressureChange = (portIdToUpdate: string, newPressureString: string) => {
    if (!selectedItem || !onItemPropertyChange || selectedItem.chipType !== 'pump' || !selectedItem.portPressures) return;
    const newPressure = parseFloat(newPressureString);
    if (isNaN(newPressure)) return; // Or handle error

    const updatedPortPressures = {
      ...selectedItem.portPressures,
      [portIdToUpdate]: newPressure,
    };
    onItemPropertyChange(selectedItem.id, 'portPressures', updatedPortPressures);
  };

  let displayedResistance = 0;
  if (selectedItem && (selectedItem.chipType === 'straight' || selectedItem.chipType === 'meander')) {
    displayedResistance = calculateRectangularChannelResistance(
      selectedItem.currentChannelLengthMm * 1e-3,
      selectedItem.currentChannelWidthMicrons * 1e-6,
      selectedItem.currentChannelDepthMicrons * 1e-6,
      FLUID_VISCOSITY_PAS
    );
  } else if (selectedItem) {
    displayedResistance = selectedItem.resistance;
  }

  // Apply font styles based on the style guide
  // Main headings: Roboto Condensed Bold
  // Sub-headings: Roboto Condensed Semibold
  // Body text: Inter

  return (
    <aside className="h-full w-full flex flex-col font-inter">
      {!selectedItem && (
        <h3 className="font-roboto-condensed text-lg font-semibold text-primary tracking-tight mb-2">
          Selected Component
        </h3>
      )}
      
      {selectedItem ? (
        <>
          <div className="space-y-3 text-xs pt-1">
            <div>
              <p className="text-sm font-medium text-foreground/90">
                {selectedItem.name}
              </p>
            </div>

            {/* Display Calculated Resistance for ALL chip types if a selectedItem exists */}
            {selectedItem && (
              <div className="space-y-1 pt-1">
                <p className="text-xs text-muted-foreground">
                  Calc. Resistance: {displayedResistance.toExponential(2)} Pa·s/m³
                  {selectedItem.chipType === 't-type' && (
                    <span className="italic text-muted-foreground/80"> (composite of 3 sections)</span>
                  )}
                  {selectedItem.chipType === 'x-type' && (
                    <span className="italic text-muted-foreground/80"> (composite of 4 sections)</span>
                  )}
                </p>
              </div>
            )}

            {/* Editable properties for Straight/Meander Channels */}
            {(selectedItem.chipType === 'straight' || selectedItem.chipType === 'meander') && onItemPropertyChange && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-foreground/80 mb-1">Editable Properties:</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="channelWidth" className="text-xs font-medium">Channel Width (µm)</Label>
                    <Input
                      id="channelWidth"
                      type="number"
                      value={selectedItem.currentChannelWidthMicrons}
                      onChange={(e) => handleInputChange('currentChannelWidthMicrons', e.target.value)}
                      className="h-9 text-sm rounded-lg w-full border-border focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="channelDepth" className="text-xs font-medium">Channel Depth (µm)</Label>
                    <Input
                      id="channelDepth"
                      type="number"
                      value={selectedItem.currentChannelDepthMicrons}
                      onChange={(e) => handleInputChange('currentChannelDepthMicrons', e.target.value)}
                      className="h-9 text-sm rounded-lg w-full border-border focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="channelLength" className="text-xs font-medium">Channel Length (mm)</Label>
                    <Input
                      id="channelLength"
                      type="number"
                      value={selectedItem.currentChannelLengthMm}
                      onChange={(e) => handleInputChange('currentChannelLengthMm', e.target.value)}
                      className="h-9 text-sm rounded-lg w-full border-border focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          {selectedItem.chipType === 'pump' && selectedItem.portPressures && onItemPropertyChange && (
            <>
              <Separator className="my-2" />
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-foreground/80 mb-1">Port Pressures (mbar):</p>
                {Object.entries(selectedItem.portPressures).map(([portId, pressureInPa]) => {
                  const displayPortId = portId; 
                  const pressureInMbar = pressureInPa / 100;

                  return (
                    <div key={displayPortId} className="space-y-1.5 mb-2">
                      <Label htmlFor={`pressure-${displayPortId}`} className="text-xs font-medium">
                        {selectedItem.ports.find(p => p.id.endsWith(displayPortId))?.name || `Port ${displayPortId}`}
                      </Label>
                      <Input
                        id={`pressure-${displayPortId}`}
                        type="number"
                        value={pressureInMbar} // Display in mbar
                        onChange={(e) => {
                          const pressureMbar = parseFloat(e.target.value);
                          if (!isNaN(pressureMbar)) {
                            handlePortPressureChange(displayPortId, (pressureMbar * 100).toString()); // Convert back to Pa string for handler
                          } else {
                             // Handle case where input is not a valid number, maybe clear or set to 0 Pa
                             handlePortPressureChange(displayPortId, "0");
                          }
                        }}
                        className="h-9 text-sm rounded-lg w-full border-border focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Separator className="my-2" />
          <div>
            <p className="text-xs text-muted-foreground">ID: {selectedItem.id}</p>
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="font-inter text-xs text-muted-foreground text-center">
                Select a component on the canvas to see its details and edit properties.
            </p>
        </div>
      )}
    </aside>
  );
} 