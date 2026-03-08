import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, FileText, MapPin, Layers, Home, CreditCard } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import ProjectLocationMap from "@/components/project-detail/ProjectLocationMap";
import { useCurrency } from "@/hooks/useCurrency";

interface ProjectDetailTabsProps {
  project: Project;
}

export function ProjectDetailTabs({ project }: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { formatPrice } = useCurrency();

  // Filter documents by type - support both document_type (DB) and type (pending preview)
  const getDocType = (d: any) => (d.document_type || d.type || '').toLowerCase();
  const brochures = project.documents?.filter(d => getDocType(d).includes('brochure')) || [];
  const floorPlans = project.documents?.filter(d => getDocType(d).includes('floor_plan') || getDocType(d) === 'floorplan') || [];
  const paymentPlans = project.documents?.filter(d => getDocType(d).includes('payment_plan') || getDocType(d) === 'paymentplan') || [];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent border-b border-zinc-200 rounded-none p-0">
        <TabsTrigger 
          value="details" 
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <Home className="w-4 h-4" />
          Details
        </TabsTrigger>
        <TabsTrigger 
          value="gallery"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <ImageIcon className="w-4 h-4" />
          Gallery
        </TabsTrigger>
        <TabsTrigger 
          value="floor-plans"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <Layers className="w-4 h-4" />
          Floor Plans
        </TabsTrigger>
        <TabsTrigger 
          value="amenities"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <Home className="w-4 h-4" />
          Amenities
        </TabsTrigger>
        <TabsTrigger 
          value="location"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <MapPin className="w-4 h-4" />
          Location
        </TabsTrigger>
        <TabsTrigger 
          value="payment-plan"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <CreditCard className="w-4 h-4" />
          Payment Plan
        </TabsTrigger>
        <TabsTrigger 
          value="brochure"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-zinc-600 data-[state=active]:text-primary"
        >
          <FileText className="w-4 h-4" />
          Brochure
        </TabsTrigger>
      </TabsList>

      {/* Details Tab */}
      <TabsContent value="details" className="mt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">About {project.name}</h3>
            {project.description && (
              <p className="text-zinc-600 leading-relaxed">{project.description}</p>
            )}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.price_from && (
              <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <p className="text-zinc-500 text-sm">Starting Price</p>
                <p className="text-lg font-semibold text-primary">{formatPrice(project.price_from)}</p>
              </div>
            )}
            {project.handover_date && (
              <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <p className="text-zinc-500 text-sm">Handover</p>
                <p className="text-lg font-semibold text-black">{project.handover_date}</p>
              </div>
            )}
            {project.payment_plan && (
              <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <p className="text-zinc-500 text-sm">Payment Plan</p>
                <p className="text-lg font-semibold text-black">{project.payment_plan}</p>
              </div>
            )}
            {project.bedrooms_min && (
              <div className="bg-white p-4 rounded-lg border border-zinc-200">
                <p className="text-zinc-500 text-sm">Bedrooms</p>
                <p className="text-lg font-semibold text-black">
                  {project.bedrooms_min === project.bedrooms_max 
                    ? `${project.bedrooms_min} BR` 
                    : `${project.bedrooms_min}-${project.bedrooms_max} BR`}
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Gallery Tab */}
      <TabsContent value="gallery" className="mt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-black">All Images</h3>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
              <Download className="w-4 h-4 mr-2" />
              Download 4K Images
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.images?.map((image, idx) => (
              <div key={image.id} className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src={image.image_url} 
                  alt={image.alt_text || `${project.name} - Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Floor Plans Tab */}
      <TabsContent value="floor-plans" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-black">Floor Plans</h3>
          {floorPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {floorPlans.map((doc, idx) => (
                <div key={doc.id} className="bg-white p-4 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-black">{doc.file_name || `Floor Plan ${idx + 1}`}</span>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                  {doc.file_url.endsWith('.pdf') ? (
                    <div className="aspect-[4/3] bg-zinc-100 rounded flex items-center justify-center">
                      <FileText className="w-12 h-12 text-zinc-400" />
                    </div>
                  ) : (
                    <img 
                      src={doc.file_url} 
                      alt={doc.file_name || 'Floor Plan'}
                      className="w-full aspect-[4/3] object-contain bg-zinc-50 rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">Floor plans coming soon.</p>
          )}
        </div>
      </TabsContent>

      {/* Amenities Tab */}
      <TabsContent value="amenities" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-black">{project.name} Unique Selling Points</h3>
          {project.amenities && project.amenities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {project.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-zinc-200">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Home className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-zinc-700 text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">Amenities information coming soon.</p>
          )}
        </div>
      </TabsContent>

      {/* Location Tab */}
      <TabsContent value="location" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-black">Location</h3>
          {project.location && (
            <p className="text-zinc-600">{project.location}, Dubai, UAE</p>
          )}
          <div className="rounded-xl overflow-hidden border border-zinc-200">
            <ProjectLocationMap
              projectName={project.name}
              location={project.location}
              latitude={null}
              longitude={null}
            />
          </div>
        </div>
      </TabsContent>

      {/* Payment Plan Tab */}
      <TabsContent value="payment-plan" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-black">Payment Plan</h3>
          {project.payment_plan && (
            <div className="bg-white p-6 rounded-lg border border-zinc-200">
              <p className="text-2xl font-bold text-primary mb-2">{project.payment_plan}</p>
              <p className="text-zinc-600">Flexible payment options available. Contact us for details.</p>
            </div>
          )}
          {paymentPlans.length > 0 && (
            <div className="space-y-3">
              {paymentPlans.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium text-black">{doc.file_name || 'Payment Plan Document'}</span>
                  </div>
                  <Download className="w-5 h-5 text-zinc-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Brochure Tab */}
      <TabsContent value="brochure" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-black">{brochures.length > 0 ? "Download Brochure" : "Request Brochure"}</h3>
          {brochures.length > 0 ? (
            <div className="space-y-3">
              {brochures.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium text-black">{doc.file_name || `${project.name} Brochure`}</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-zinc-200 text-center">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500">Brochure coming soon. Contact us for more information.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default ProjectDetailTabs;
