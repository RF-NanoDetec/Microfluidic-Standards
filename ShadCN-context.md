# ShadCN UI Components Used in This Project

This file tracks the ShadCN UI components that have been implemented or are planned for use.

## Components Added
- **Button** (`@/components/ui/button`): Used for hero CTA "Start Designing" button and library table actions.
- **ToggleGroup, ToggleGroupItem** (`@/components/ui/toggle-group`): Used for inspection mode toggles on canvas page.
- **Input** (`@/components/ui/input`): Used for palette search on canvas page and library table search.
- **Badge** (`@/components/ui/badge`): Used for product attributes and status indicators in library table.
- **Checkbox** (`@/components/ui/checkbox`): Used for row selection in library table.
- **Label** (`@/components/ui/label`): Used for form labels and table controls.
- **AlertDialog** (`@/components/ui/alert-dialog`): Used for delete confirmations and other modal dialogs.
- **DropdownMenu** (`@/components/ui/dropdown-menu`): Used for action menus and column visibility controls.
- **Popover** (`@/components/ui/popover`): Used for filter controls in library table.
- **Select** (`@/components/ui/select`): Used for sorting and pagination controls.
- **Table** (`@/components/ui/table`): Used for the main product library interface.
- **Pagination** (`@/components/ui/pagination`): Used for table pagination controls.

## External Dependencies Added
- **@tanstack/react-table**: For advanced table functionality with sorting, filtering, and pagination.
- **@radix-ui/react-alert-dialog**: For confirmation dialogs.
- **@radix-ui/react-dropdown-menu**: For dropdown menus.

## Icons Used (lucide-react)
- **ChevronLeft, ChevronRight, SquareDashedMousePointer, Hand, ArrowRight, MousePointer2, Layers, Zap, Trash2, PlayCircle, RotateCcw, Search**: Used in `website/app/canvas/page.tsx` for various UI elements including the WelcomeOverlay, side panel toggles, and action buttons.
- **ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, CircleX, Columns3, Ellipsis, Filter, ListFilter, Plus, Trash, ShoppingCart, FileText, Thermometer, Droplets, Zap, Shield, FlaskConical, Gauge, Ruler, Layers, Mountain**: Used in the library table for sorting, filtering, pagination, and attribute icons.