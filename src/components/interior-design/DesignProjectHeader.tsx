import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from '@/components/ui/select';
import { Ruler, FileText, Building2, Home, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DesignMode } from './DesignModeSelector';

interface DesignProjectHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  roomName: string;
  onRoomNameChange: (name: string) => void;
  propertyType: string;
  onPropertyTypeChange: (type: string) => void;
  propertySize: string;
  onPropertySizeChange: (size: string) => void;
  hasMeasurementData: boolean;
  selectedMode?: DesignMode;
}

const propertyTypes = [
  { id: 'apartment', label: 'Apartment', icon: Building2 },
  { id: 'villa', label: 'Villa / Townhouse', icon: Home },
  { id: 'penthouse', label: 'Penthouse', icon: Building2 },
  { id: 'office', label: 'Office Space', icon: Building2 },
  { id: 'retail', label: 'Retail / Commercial', icon: Building2 },
];

const roomTypes = [
  'Living Room',
  'Bedroom',
  'Master Bedroom',
  'Kitchen',
  'Dining Room',
  'Bathroom',
  'Home Office',
  'Kids Room',
  'Guest Room',
  'Balcony',
  'Outdoor Area',
  'Lobby',
  'Reception',
  'Conference Room',
  'Entire Property',
  'Other',
];

// Mode-specific colors
const getModeColors = (mode?: DesignMode) => {
  switch (mode) {
    case 'concept':
      return {
        border: 'border-fuchsia-500/30',
        selectedBorder: 'border-fuchsia-500/50',
        selectedBg: 'bg-fuchsia-500/20',
        selectedText: 'text-fuchsia-300',
        icon: 'text-fuchsia-400',
      };
    case 'redesign':
      return {
        border: 'border-blue-500/30',
        selectedBorder: 'border-blue-500/50',
        selectedBg: 'bg-blue-500/20',
        selectedText: 'text-blue-300',
        icon: 'text-blue-400',
      };
    case 'staging':
      return {
        border: 'border-emerald-500/30',
        selectedBorder: 'border-emerald-500/50',
        selectedBg: 'bg-emerald-500/20',
        selectedText: 'text-emerald-300',
        icon: 'text-emerald-400',
      };
    case 'chat':
      return {
        border: 'border-orange-500/30',
        selectedBorder: 'border-orange-500/50',
        selectedBg: 'bg-orange-500/20',
        selectedText: 'text-orange-300',
        icon: 'text-orange-400',
      };
    default:
      return {
        border: 'border-fuchsia-500/30',
        selectedBorder: 'border-fuchsia-500/50',
        selectedBg: 'bg-fuchsia-500/20',
        selectedText: 'text-fuchsia-300',
        icon: 'text-fuchsia-400',
      };
  }
};

const DesignProjectHeader = ({
  projectName,
  onProjectNameChange,
  roomName,
  onRoomNameChange,
  propertyType,
  onPropertyTypeChange,
  propertySize,
  onPropertySizeChange,
  hasMeasurementData,
  selectedMode,
}: DesignProjectHeaderProps) => {
  const navigate = useNavigate();
  const colors = getModeColors(selectedMode);

  const handleMeasureSpace = () => {
    sessionStorage.setItem('return_to_interior_design', 'true');
    navigate('/property-measurement');
  };

  return (
    <div className="w-full">
      <div className={`bg-zinc-900/60 border ${colors.border} rounded-2xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <FileText className={`w-5 h-5 ${colors.icon}`} />
          <h3 className="text-lg font-semibold text-white">Project Details</h3>
          {hasMeasurementData && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Measurements Imported
            </Badge>
          )}
        </div>

        <div className="grid gap-5">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-zinc-300">
              Project Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="e.g., Downtown Apartment Redesign"
              className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-zinc-400"
            />
          </div>

          {/* Room/Area Name */}
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-zinc-300">
              Room / Area Name
            </Label>
            <Select value={roomName} onValueChange={onRoomNameChange}>
              <SelectTriggerDark>
                <SelectValue placeholder="Select room type" />
              </SelectTriggerDark>
              <SelectContentDark>
                {roomTypes.map((room) => (
                  <SelectItemDark key={room} value={room}>{room}</SelectItemDark>
                ))}
              </SelectContentDark>
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Property Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {propertyTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = propertyType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onPropertyTypeChange(type.id)}
                    className={`
                      flex items-center gap-2 p-3 rounded-xl border transition-all
                      ${isSelected
                        ? `${colors.selectedBg} ${colors.selectedBorder} ${colors.selectedText}`
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property Size with Measure Button */}
          <div className="space-y-2">
            <Label htmlFor="property-size" className="text-zinc-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Property Size (sqft)
            </Label>
            <div className="flex gap-3">
              <Input
                id="property-size"
                value={propertySize}
                onChange={(e) => onPropertySizeChange(e.target.value)}
                placeholder="e.g., 1500"
                className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-zinc-400 flex-1"
              />
              <Button
                type="button"
                variant="dark-outline"
                onClick={handleMeasureSpace}
              >
                <Ruler className="w-4 h-4 mr-2" />
                Measure
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Use our AI Measurement tool to calculate your space dimensions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignProjectHeader;
