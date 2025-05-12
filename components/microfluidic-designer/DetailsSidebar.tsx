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

  return (
    <aside className="h-full min-w-[220px] max-w-[260px] w-full flex flex-col bg-gradient-to-b from-[#F5F7FA] to-[#E1E4E8] border-l border-zinc-200">
      <div className="flex flex-col flex-1 overflow-y-auto px-4 pt-6 pb-2">
        <h2 className="text-xl font-bold text-[#003C7E] tracking-tight mb-1">Properties</h2>
        <p className="text-xs text-zinc-500 mb-4">Details of the selected component.</p>
        <Separator className="mb-4" />
        {selectedItem ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1 text-[#003C7E]">{selectedItem.name}</h3>
              <p className="text-xs text-muted-foreground">ID: {selectedItem.id}</p>
              <p className="text-sm"><span className="font-medium">Type:</span> {selectedItem.chipType}</p>
              {selectedItem.material && <p className="text-sm"><span className="font-medium">Material:</span> {selectedItem.material}</p>}
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2">Physical Properties</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Calc. Resistance:</span> {displayedResistance.toExponential(2)} Pa·s/m³
                </p>
                {(selectedItem.chipType === 'straight' || selectedItem.chipType === 'meander') && onItemPropertyChange && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="channelWidth" className="text-xs font-medium">Channel Width (µm)</Label>
                      <Input
                        id="channelWidth"
                        type="number"
                        value={selectedItem.currentChannelWidthMicrons}
                        onChange={(e) => handleInputChange('currentChannelWidthMicrons', e.target.value)}
                        className="h-8 text-sm w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="channelDepth" className="text-xs font-medium">Channel Depth (µm)</Label>
                      <Input
                        id="channelDepth"
                        type="number"
                        value={selectedItem.currentChannelDepthMicrons}
                        onChange={(e) => handleInputChange('currentChannelDepthMicrons', e.target.value)}
                        className="h-8 text-sm w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="channelLength" className="text-xs font-medium">Channel Length (mm)</Label>
                      <Input
                        id="channelLength"
                        type="number"
                        value={selectedItem.currentChannelLengthMm}
                        onChange={(e) => handleInputChange('currentChannelLengthMm', e.target.value)}
                        className="h-8 text-sm w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <Separator />
            {selectedItem.chipType === 'pump' && selectedItem.portPressures && (
              <div>
                <h4 className="font-medium text-sm mb-2">Port Pressures (Pa)</h4>
                {Object.entries(selectedItem.portPressures).map(([portId, pressure]) => (
                  <p key={portId} className="text-xs pl-2">{portId.replace(selectedItem.id + '_', '')}: {pressure.toFixed(0)}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No component selected. Click a component on the canvas to see its details.</p>
        )}
      </div>
    </aside>
  );
} 