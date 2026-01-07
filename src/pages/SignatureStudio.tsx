import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, PenTool, Sparkles, Download, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SignatureDesigner from "@/components/referral/SignatureDesigner";
import SignaturePad from "@/components/referral/SignaturePad";
import MainLayout from "@/components/MainLayout";
import { toast } from "sonner";

export default function SignatureStudio() {
  const navigate = useNavigate();
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);

  const handleSaveDesignedSignature = (signatureUrl: string) => {
    setSavedSignature(signatureUrl);
    // Save to localStorage for future use
    localStorage.setItem('jj_user_signature', signatureUrl);
    toast.success("Signature saved!");
  };

  const handleDownload = (signatureUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = signatureUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Signature downloaded!");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Signature Studio
              </h1>
              <p className="text-muted-foreground">
                Create and manage your digital signatures
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="flex items-start gap-4 p-4">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Personal Use Only
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  These AI-designed signatures are for your personal documents only. 
                  For official JJ Global Capital contracts, your signature must match your ID/passport.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="designer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="designer" className="py-3 gap-2">
                <Sparkles className="w-4 h-4" />
                AI Designer
              </TabsTrigger>
              <TabsTrigger value="draw" className="py-3 gap-2">
                <PenTool className="w-4 h-4" />
                Draw Signature
              </TabsTrigger>
            </TabsList>

            {/* AI Designer Tab */}
            <TabsContent value="designer">
              <Card>
                <CardContent className="p-6">
                  <SignatureDesigner
                    onSelectSignature={(sig) => setSavedSignature(sig)}
                    onSaveSignature={handleSaveDesignedSignature}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Draw Tab */}
            <TabsContent value="draw">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-gold" />
                    Draw Your Signature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignaturePad
                    onSignatureChange={setDrawnSignature}
                    requiredIdMatch={false}
                  />
                  
                  {drawnSignature && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4"
                    >
                      <div className="p-4 bg-muted rounded-xl">
                        <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                        <img 
                          src={drawnSignature} 
                          alt="Your signature" 
                          className="h-20 bg-white rounded-lg p-2"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            localStorage.setItem('jj_user_signature', drawnSignature);
                            toast.success("Signature saved for future use!");
                          }}
                          className="flex-1 bg-gold hover:bg-gold/90 text-black"
                        >
                          Save for Future Use
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(drawnSignature, 'my-signature.png')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Saved Signature */}
          {savedSignature && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Saved Signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <img 
                      src={savedSignature} 
                      alt="Saved signature" 
                      className="h-16 bg-white rounded-lg p-2"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(savedSignature, 'saved-signature.png')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
