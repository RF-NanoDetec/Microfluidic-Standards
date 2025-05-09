import type { CanvasItemData } from "@/lib/microfluidic-designer/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailsSidebarProps {
  selectedItem: CanvasItemData | undefined | null;
}

export default function DetailsSidebar({ selectedItem }: DetailsSidebarProps) {
  return (
    <aside className="w-80 flex-shrink-0">
      <Card className="sticky top-20 group overflow-hidden">
        <CardHeader className="transition-all duration-200 ease-in-out group-hover:shadow-md">
          <CardTitle>Properties</CardTitle>
          <CardDescription>Details of the selected component.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 transition-all duration-200 ease-in-out">
          {selectedItem ? (
            <div className="transition-all duration-200 ease-in-out hover:shadow-xl hover:bg-slate-50 hover:scale-[1.02] p-3 rounded-md">
              <h3 className="font-semibold text-lg mb-2">{selectedItem.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {selectedItem.id}</p>
              <p className="text-sm"><span className="font-medium">Product ID:</span> {selectedItem.productId}</p>
              <p className="text-sm"><span className="font-medium">Type:</span> {selectedItem.chipType}</p>
              <p className="text-sm"><span className="font-medium">Position:</span> X: {selectedItem.x.toFixed(0)}, Y: {selectedItem.y.toFixed(0)}</p>
              <p className="text-sm"><span className="font-medium">Dimensions:</span> W: {selectedItem.width.toFixed(0)}, H: {selectedItem.height.toFixed(0)}</p>
              {selectedItem.material && <p className="text-sm"><span className="font-medium">Material:</span> {selectedItem.material}</p>}
              <p className="text-sm">
                <span className="font-medium">Resistance:</span> {selectedItem.resistance.toExponential(2)} Pa·s/m³
              </p>
              
              {(selectedItem.chipType !== 'pump' && selectedItem.chipType !== 'outlet') && (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Channel Width:</span> {selectedItem.currentChannelWidthMicrons} µm
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Channel Depth:</span> {selectedItem.currentChannelDepthMicrons} µm
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Channel Length:</span> {selectedItem.currentChannelLengthMm} mm
                  </p>
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