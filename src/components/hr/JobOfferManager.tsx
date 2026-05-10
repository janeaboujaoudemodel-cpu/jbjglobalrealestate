import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHRJobOffers, DEPARTMENTS, JobOffer } from '@/hooks/useHRJobOffers';
import { 
  Plus, Upload, FileText, Trash2, Edit2, Eye, 
  Briefcase, DollarSign, CheckCircle2 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const JobOfferManager = () => {
  const { 
    jobOffers, 
    isLoading, 
    createJobOffer, 
    updateJobOffer, 
    deleteJobOffer,
    uploadJobOfferDocument,
    getOffersByDepartment 
  } = useHRJobOffers();

  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEPARTMENTS[0]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [formData, setFormData] = useState({
    department: '',
    position_title: '',
    description: '',
    salary_range_min: '',
    salary_range_max: '',
    commission_structure: '',
    benefits: ''
  });
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({
      department: '',
      position_title: '',
      description: '',
      salary_range_min: '',
      salary_range_max: '',
      commission_structure: '',
      benefits: ''
    });
    setUploadingFile(null);
    setEditingOffer(null);
  };

  const handleSubmit = async () => {
    let documentData = null;
    
    if (uploadingFile) {
      documentData = await uploadJobOfferDocument(uploadingFile, formData.department || selectedDepartment);
    }

    const offerData = {
      department: formData.department || selectedDepartment,
      position_title: formData.position_title,
      description: formData.description || null,
      salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
      salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
      commission_structure: formData.commission_structure || null,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()) : null,
      document_url: documentData?.url || editingOffer?.document_url || null,
      document_name: documentData?.name || editingOffer?.document_name || null,
    };

    if (editingOffer) {
      await updateJobOffer(editingOffer.id, offerData);
    } else {
      await createJobOffer(offerData);
    }

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = (offer: JobOffer) => {
    setEditingOffer(offer);
    setFormData({
      department: offer.department,
      position_title: offer.position_title,
      description: offer.description || '',
      salary_range_min: offer.salary_range_min?.toString() || '',
      salary_range_max: offer.salary_range_max?.toString() || '',
      commission_structure: offer.commission_structure || '',
      benefits: offer.benefits?.join(', ') || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this job offer?')) {
      await deleteJobOffer(id);
    }
  };

  const departmentOffers = getOffersByDepartment(selectedDepartment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Job Offer Templates</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage job offer templates by department for quick applicant onboarding
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Job Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingOffer ? 'Edit Job Offer' : 'Create Job Offer Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select 
                    value={formData.department || selectedDepartment}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position Title</Label>
                  <Input 
                    value={formData.position_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, position_title: e.target.value }))}
                    placeholder="e.g., Senior Sales Agent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px]"
                  placeholder="Job description and requirements..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary Range (Min)</Label>
                  <Input 
                    type="number"
                    value={formData.salary_range_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_range_min: e.target.value }))}
                    placeholder="e.g., 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Range (Max)</Label>
                  <Input 
                    type="number"
                    value={formData.salary_range_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_range_max: e.target.value }))}
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Structure</Label>
                <Input 
                  value={formData.commission_structure}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_structure: e.target.value }))}
                  placeholder="e.g., 30% of commission earned"
                />
              </div>

              <div className="space-y-2">
                <Label>Benefits (comma-separated)</Label>
                <Input 
                  value={formData.benefits}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="e.g., Health Insurance, Visa Sponsorship, Training"
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Job Offer Document (PDF/DOCX)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                  />
                  {(uploadingFile || editingOffer?.document_name) && (
                    <Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">
                      <FileText className="w-3 h-3 mr-1" />
                      {uploadingFile?.name || editingOffer?.document_name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={!formData.position_title}
                >
                  {editingOffer ? 'Update' : 'Create'} Job Offer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Tabs */}
      <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
        <ScrollArea className="w-full">
          <TabsList className="bg-card border-2 border-[#B89555]/20 p-1 inline-flex w-max">
            {DEPARTMENTS.map(dept => (
              <TabsTrigger 
                key={dept} 
                value={dept}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40 text-muted-foreground text-xs px-3 py-1.5 whitespace-nowrap"
              >
                {dept}
                {getOffersByDepartment(dept).length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-[#EFE6D6]/20 rounded-full px-1.5">
                    {getOffersByDepartment(dept).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {DEPARTMENTS.map(dept => (
          <TabsContent key={dept} value={dept} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" />
              </div>
            ) : getOffersByDepartment(dept).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No job offers for {dept}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first job offer template for this department
                  </p>
                  <Button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, department: dept }));
                      setIsCreateDialogOpen(true);
                    }}
                    variant="primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Job Offer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getOffersByDepartment(dept).map(offer => (
                  <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-foreground text-lg">{offer.position_title}</CardTitle>
                          <p className="text-[#1A1A1A] text-sm mt-1">{offer.department}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(offer)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 hover:text-red-500"
                            onClick={() => handleDelete(offer.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {offer.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{offer.description}</p>
                      )}
                      
                      {(offer.salary_range_min || offer.salary_range_max) && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span className="text-foreground">
                            AED {offer.salary_range_min?.toLocaleString() || '?'} - {offer.salary_range_max?.toLocaleString() || '?'}
                          </span>
                        </div>
                      )}

                      {offer.commission_structure && (
                        <div className="text-sm text-muted-foreground">
                          <span className="text-[#1A1A1A]">Commission:</span> {offer.commission_structure}
                        </div>
                      )}

                      {offer.benefits && offer.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {offer.benefits.slice(0, 3).map((benefit, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-[#B89555]/30 text-foreground">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                              {benefit}
                            </Badge>
                          ))}
                          {offer.benefits.length > 3 && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              +{offer.benefits.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {offer.document_url && (
                        <a 
                          href={offer.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#1A1A1A] mt-2"
                        >
                          <FileText className="w-4 h-4" />
                          View Document
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default JobOfferManager;
