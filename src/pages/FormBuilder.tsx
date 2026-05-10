import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Trash2, GripVertical, Type, AlignLeft, CheckSquare, 
  Circle, List, Calendar, Star, Mail, Phone, Hash, Copy,
  Eye, Download, Settings, FileText
} from "lucide-react";
import { toast } from "sonner";

type FieldType = "text" | "textarea" | "email" | "phone" | "number" | "date" | "select" | "checkbox" | "radio" | "rating";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormResponse {
  id: string;
  submittedAt: string;
  data: Record<string, string | boolean | number>;
}

const FormBuilder = () => {
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("Form description");
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [view, setView] = useState<"edit" | "preview" | "responses">("edit");
  const [previewData, setPreviewData] = useState<Record<string, string | boolean | number>>({});

  const fieldTypes: { type: FieldType; icon: any; label: string }[] = [
    { type: "text", icon: Type, label: "Short Text" },
    { type: "textarea", icon: AlignLeft, label: "Long Text" },
    { type: "email", icon: Mail, label: "Email" },
    { type: "phone", icon: Phone, label: "Phone" },
    { type: "number", icon: Hash, label: "Number" },
    { type: "date", icon: Calendar, label: "Date" },
    { type: "select", icon: List, label: "Dropdown" },
    { type: "checkbox", icon: CheckSquare, label: "Checkbox" },
    { type: "radio", icon: Circle, label: "Multiple Choice" },
    { type: "rating", icon: Star, label: "Rating" },
  ];

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `${fieldTypes.find(f => f.type === type)?.label || "Field"}`,
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" ? ["Option 1", "Option 2"] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const duplicateField = (field: FormField) => {
    const newField = { ...field, id: Date.now().toString() };
    const index = fields.findIndex(f => f.id === field.id);
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    setFields(newFields);
  };

  const handlePreviewSubmit = () => {
    const newResponse: FormResponse = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      data: { ...previewData }
    };
    setResponses([...responses, newResponse]);
    setPreviewData({});
    toast.success("Response submitted!");
    setView("responses");
  };

  const exportResponses = () => {
    const csv = [
      ["Submitted At", ...fields.map(f => f.label)].join(","),
      ...responses.map(r => [
        new Date(r.submittedAt).toLocaleString(),
        ...fields.map(f => String(r.data[f.id] || ""))
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formTitle}-responses.csv`;
    a.click();
    toast.success("Responses exported!");
  };

  const renderFieldInput = (field: FormField, value: any, onChange: (val: any) => void) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt, i) => (
                <SelectItem key={i} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Switch checked={!!value} onCheckedChange={onChange} />
            <span className="text-sm text-white/70">Yes</span>
          </div>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className={`text-2xl ${value >= star ? "text-yellow-400" : "text-[#1A1A1A]/70"}`}
              >
                ★
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-white">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText className="w-6 h-6 text-emerald-500" />
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="bg-transparent border-none text-2xl font-bold w-64 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "edit" ? "default" : "outline"}
            onClick={() => setView("edit")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={view === "preview" ? "default" : "outline"}
            onClick={() => setView("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={view === "responses" ? "default" : "outline"}
            onClick={() => setView("responses")}
          >
            <List className="w-4 h-4 mr-2" />
            Responses ({responses.length})
          </Button>
        </div>
      </div>

      <div className="flex">
        {view === "edit" && (
          <>
            {/* Field Types Sidebar */}
            <div className="w-64 border-r border-[#1A1A1A] p-4">
              <h3 className="text-sm font-semibold text-white/70 mb-4">Add Field</h3>
              <div className="space-y-2">
                {fieldTypes.map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => addField(type)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Form Editor */}
            <div className="flex-1 p-8 max-w-3xl mx-auto">
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-6">
                <CardContent className="pt-6">
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-none mb-2 focus-visible:ring-0"
                    placeholder="Form Title"
                  />
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-transparent border-none resize-none focus-visible:ring-0"
                    placeholder="Form description"
                  />
                </CardContent>
              </Card>

              {fields.length === 0 ? (
                <div className="text-center py-16 text-white/90">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Add fields from the sidebar to build your form</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <Card key={field.id} className="bg-[#FDFBF7] border-[#1A1A1A]">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <GripVertical className="w-5 h-5 text-[#1A1A1A]/70 cursor-grab mt-2" />
                          <div className="flex-1 space-y-4">
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              className="font-medium bg-transparent border-none p-0 text-lg focus-visible:ring-0"
                              placeholder="Question"
                            />
                            
                            {renderFieldInput(field, "", () => {})}

                            {(field.type === "select" || field.type === "radio") && (
                              <div className="space-y-2">
                                {field.options?.map((opt, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...(field.options || [])];
                                        newOptions[i] = e.target.value;
                                        updateField(field.id, { options: newOptions });
                                      }}
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newOptions = field.options?.filter((_, idx) => idx !== i);
                                        updateField(field.id, { options: newOptions });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    updateField(field.id, { 
                                      options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] 
                                    });
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                />
                                <Label className="text-sm text-white/70">Required</Label>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => duplicateField(field)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteField(field.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "preview" && (
          <div className="flex-1 p-8 max-w-2xl mx-auto">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-2xl">{formTitle}</CardTitle>
                <p className="text-white/70">{formDescription}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field) => (
                  <div key={field.id}>
                    <Label className="mb-2 block">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderFieldInput(
                      field, 
                      previewData[field.id], 
                      (val) => setPreviewData({ ...previewData, [field.id]: val })
                    )}
                  </div>
                ))}
                <Button onClick={handlePreviewSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "responses" && (
          <div className="flex-1 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{responses.length} Responses</h2>
              {responses.length > 0 && (
                <Button onClick={exportResponses} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>

            {responses.length === 0 ? (
              <div className="text-center py-16 text-white/90">
                <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No responses yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      <th className="text-left p-3 text-sm text-white/70">Submitted</th>
                      {fields.map((f) => (
                        <th key={f.id} className="text-left p-3 text-sm text-white/70">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} className="border-b border-[#1A1A1A]">
                        <td className="p-3 text-sm">{new Date(response.submittedAt).toLocaleString()}</td>
                        {fields.map((f) => (
                          <td key={f.id} className="p-3 text-sm">{String(response.data[f.id] || "-")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
