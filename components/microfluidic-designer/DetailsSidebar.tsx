import type { CanvasItemData } from "@/lib/microfluidic-designer/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateRectangularChannelResistance } from "@/lib/microfluidic-designer/resistanceUtils";
import { FLUID_VISCOSITY_PAS } from "@/lib/microfluidic-designer/constants";

interface DetailsSidebarProps {
  selectedItem: CanvasItemData | undefined | null;
  onItemPropertyChange?: (itemId: string, propertyName: keyof CanvasItemData, value: any) => void;
}

export default function DetailsSidebar({ selectedItem, onItemPropertyChange }: DetailsSidebarProps) {
  
  const handleInputChange = (propertyName: keyof CanvasItemData, value: string) => {
    if (selectedItem && onItemPropertyChange) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        onItemPropertyChange(selectedItem.id, propertyName, numericValue);
      }
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
    <aside className="w-80 flex-shrink-0">
      <Card className="sticky top-20 group overflow-hidden">
        <CardHeader className="transition-all duration-200 ease-in-out group-hover:shadow-md">
          <CardTitle>Properties</CardTitle>
          <CardDescription>Details of the selected component.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 transition-all duration-200 ease-in-out">
          {selectedItem ? (
            <div className="transition-all duration-200 ease-in-out hover:shadow-xl hover:bg-slate-50 hover:scale-[1.02] p-3 rounded-md space-y-2">
              <h3 className="font-semibold text-lg mb-1">{selectedItem.name}</h3>
              <p className="text-xs text-muted-foreground">ID: {selectedItem.id}</p>
              <p className="text-sm"><span className="font-medium">Type:</span> {selectedItem.chipType}</p>
              {selectedItem.material && <p className="text-sm"><span className="font-medium">Material:</span> {selectedItem.material}</p>}
              
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
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="channelDepth" className="text-xs font-medium">Channel Depth (µm)</Label>
                    <Input 
                      id="channelDepth"
                      type="number" 
                      value={selectedItem.currentChannelDepthMicrons} 
                      onChange={(e) => handleInputChange('currentChannelDepthMicrons', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="channelLength" className="text-xs font-medium">Channel Length (mm)</Label>
                    <Input 
                      id="channelLength"
                      type="number" 
                      value={selectedItem.currentChannelLengthMm} 
                      onChange={(e) => handleInputChange('currentChannelLengthMm', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}

              {selectedItem.chipType === 'pump' && selectedItem.portPressures && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Port Pressures (Pa):</h4>
                  {Object.entries(selectedItem.portPressures).map(([portId, pressure]) => (
                    <p key={portId} className="text-xs pl-2">{portId.replace(selectedItem.id + '_', '')}: {pressure.toFixed(0)}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No component selected. Click a component on the canvas to see its details.</p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
} 