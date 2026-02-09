import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ruler, FileText, Building2, Home, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}: DesignProjectHeaderProps) => {
  const navigate = useNavigate();

  const handleMeasureSpace = () => {
    sessionStorage.setItem('return_to_interior_design', 'true');
    navigate('/property-measurement');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-fuchsia-400" />
          <h3 className="text-lg font-semibold text-white">Project Details</h3>
          {hasMeasurementData && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Measurements Imported
            </Badge>
          )}
        </div>

        <div className="grid gap-6">
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
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Room/Area Name */}
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-zinc-300">
              Room / Area Name
            </Label>
            <Select value={roomName} onValueChange={onRoomNameChange}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {roomTypes.map((room) => (
                  <SelectItem key={room} value={room} className="text-white hover:bg-zinc-800">
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Property Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
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
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMeasureSpace}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
