import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { AIBroker } from "./types";

interface AIBrokerEditDialogProps {
  broker: AIBroker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (broker: Partial<AIBroker>) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const AVAILABLE_LANGUAGES = [
  "English",
  "Arabic",
  "Hindi",
  "Russian",
  "French",
  "German",
  "Chinese",
  "Spanish",
];

const AVAILABLE_SPECIALIZATIONS = [
  "Off-plan",
  "Secondary",
  "Luxury",
  "Investment",
  "Commercial",
  "Residential",
  "GCC Clients",
  "International",
];

export function AIBrokerEditDialog({
  broker,
  open,
  onOpenChange,
  onSave,
}: AIBrokerEditDialogProps) {
  const [formData, setFormData] = useState<Partial<AIBroker>>({});
  const [newLanguage, setNewLanguage] = useState("");
  const [newSpec, setNewSpec] = useState("");

  useEffect(() => {
    if (broker) {
      setFormData({
        name: broker.name,
        email: broker.email,
        phone: broker.phone,
        bio: broker.bio,
        avatar_url: broker.avatar_url,
        personality_prompt: broker.personality_prompt,
        specialization: broker.specialization || [],
        languages: broker.languages || [],
        daily_interaction_limit: broker.daily_interaction_limit || 150,
        response_delay_min_seconds: broker.response_delay_min_seconds || 3,
        response_delay_max_seconds: broker.response_delay_max_seconds || 10,
        working_hours_start: broker.working_hours_start || "09:00",
        working_hours_end: broker.working_hours_end || "18:00",
        working_days: broker.working_days || [1, 2, 3, 4, 5],
      });
    }
  }, [broker]);

  const handleSave = () => {
    if (broker) {
      onSave({ id: broker.id, ...formData });
    }
    onOpenChange(false);
  };

  const toggleWorkingDay = (day: number) => {
    const currentDays = formData.working_days || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        working_days: currentDays.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        working_days: [...currentDays, day].sort(),
      });
    }
  };

  const addLanguage = (lang: string) => {
    if (lang && !formData.languages?.includes(lang)) {
      setFormData({
        ...formData,
        languages: [...(formData.languages || []), lang],
      });
    }
    setNewLanguage("");
  };

  const removeLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter((l) => l !== lang) || [],
    });
  };

  const addSpecialization = (spec: string) => {
    if (spec && !formData.specialization?.includes(spec)) {
      setFormData({
        ...formData,
        specialization: [...(formData.specialization || []), spec],
      });
    }
    setNewSpec("");
  };

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specialization: formData.specialization?.filter((s) => s !== spec) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Edit AI Broker: {broker?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="bg-[#1A1A1A] border-[#1A1A1A]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]/70">Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]/70">Email</Label>
                <Input
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]/70">Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]/70">Avatar URL</Label>
                <Input
                  value={formData.avatar_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#1A1A1A]/70">Bio</Label>
              <Textarea
                value={formData.bio || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1 min-h-[80px]"
                placeholder="Professional bio for the AI broker..."
              />
            </div>

            <div>
              <Label className="text-[#1A1A1A]/70 mb-2 block">Languages</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages?.map((lang) => (
                  <Badge
                    key={lang}
                    className="bg-[#1A1A1A] text-white flex items-center gap-1"
                  >
                    {lang}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => removeLanguage(lang)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_LANGUAGES.filter(
                  (l) => !formData.languages?.includes(l)
                ).map((lang) => (
                  <Button
                    key={lang}
                    variant="outline"
                    size="sm"
                    onClick={() => addLanguage(lang)}
                    className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[#1A1A1A]/70 mb-2 block">Specializations</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specialization?.map((spec) => (
                  <Badge
                    key={spec}
                    className="bg-[#EFE6D6]/20 text-[#1A1A1A] flex items-center gap-1"
                  >
                    {spec}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => removeSpecialization(spec)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_SPECIALIZATIONS.filter(
                  (s) => !formData.specialization?.includes(s)
                ).map((spec) => (
                  <Button
                    key={spec}
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecialization(spec)}
                    className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {spec}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div>
              <Label className="text-[#1A1A1A]/70">Daily Interaction Limit</Label>
              <Input
                type="number"
                value={formData.daily_interaction_limit || 150}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daily_interaction_limit: parseInt(e.target.value) || 150,
                  })
                }
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
              <p className="text-[#1A1A1A]/70 text-sm mt-1">
                Maximum leads this broker can handle per day
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]/70">Min Response Delay (seconds)</Label>
                <Input
                  type="number"
                  value={formData.response_delay_min_seconds || 3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      response_delay_min_seconds: parseInt(e.target.value) || 3,
                    })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]/70">Max Response Delay (seconds)</Label>
                <Input
                  type="number"
                  value={formData.response_delay_max_seconds || 10}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      response_delay_max_seconds: parseInt(e.target.value) || 10,
                    })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
            </div>
            <p className="text-[#1A1A1A]/70 text-sm">
              Randomized delay to simulate human-like response times
            </p>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]/70">Working Hours Start</Label>
                <Input
                  type="time"
                  value={formData.working_hours_start || "09:00"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours_start: e.target.value,
                    })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]/70">Working Hours End</Label>
                <Input
                  type="time"
                  value={formData.working_hours_end || "18:00"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours_end: e.target.value,
                    })
                  }
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#1A1A1A]/70 mb-3 block">Working Days</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      formData.working_days?.includes(day.value)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleWorkingDay(day.value)}
                    className={
                      formData.working_days?.includes(day.value)
                        ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
                        : "border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
                    }
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-4 mt-4">
            <div>
              <Label className="text-[#1A1A1A]/70">Personality Prompt</Label>
              <Textarea
                value={formData.personality_prompt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personality_prompt: e.target.value,
                  })
                }
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1 min-h-[200px] font-mono text-sm"
                placeholder="System prompt that defines the AI broker's personality, tone, and behavior..."
              />
              <p className="text-[#1A1A1A]/70 text-sm mt-2">
                This prompt defines how the AI broker communicates. Include tone,
                style, and any specific behaviors or restrictions.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1A1A1A]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#1A1A1A] text-[#1A1A1A]/70"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
