import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Play, Download, 
  Image, Type, Square, Circle, Presentation, Layout, Palette,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline
} from "lucide-react";
import { toast } from "sonner";

interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  layout: "title" | "content" | "two-column" | "image";
  imageUrl?: string;
}

const Presentations = () => {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      title: "Welcome to Your Presentation",
      content: "Click to add content",
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      layout: "title"
    }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("Untitled Presentation");

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: "New Slide",
      content: "Add your content here",
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      layout: "content"
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) {
      toast.error("Cannot delete the last slide");
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
  };

  const updateSlide = (field: keyof Slide, value: string) => {
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], [field]: value };
    setSlides(newSlides);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const startPresentation = () => {
    setIsPresenting(true);
    document.documentElement.requestFullscreen?.();
  };

  const exitPresentation = () => {
    setIsPresenting(false);
    document.exitFullscreen?.();
  };

  const exportPresentation = () => {
    const data = JSON.stringify({ title: presentationTitle, slides }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentationTitle}.json`;
    a.click();
    toast.success("Presentation exported!");
  };

  const colorOptions = [
    "#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483",
    "#1b4332", "#2d6a4f", "#ffffff", "#f8f9fa", "#212529"
  ];

  if (isPresenting) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center cursor-pointer z-50"
        style={{ backgroundColor: slides[currentSlide].backgroundColor }}
        onClick={(e) => {
          if (e.clientX > window.innerWidth / 2) {
            nextSlide();
          } else {
            prevSlide();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") exitPresentation();
          if (e.key === "ArrowRight") nextSlide();
          if (e.key === "ArrowLeft") prevSlide();
        }}
        tabIndex={0}
      >
        <div className="text-center max-w-4xl mx-auto px-8" style={{ color: slides[currentSlide].textColor }}>
          <h1 className="text-6xl font-bold mb-8">{slides[currentSlide].title}</h1>
          <p className="text-3xl whitespace-pre-wrap">{slides[currentSlide].content}</p>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/60">
          <span>{currentSlide + 1} / {slides.length}</span>
          <Button variant="ghost" size="sm" onClick={exitPresentation}>
            Press ESC to exit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Presentation className="w-6 h-6 text-orange-500" />
          <Input
            value={presentationTitle}
            onChange={(e) => setPresentationTitle(e.target.value)}
            className="bg-transparent border-none text-xl font-semibold w-64 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportPresentation}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={startPresentation} className="bg-orange-600 hover:bg-orange-700">
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Slide Thumbnails */}
        <div className="w-48 border-r border-zinc-800 p-4 overflow-y-auto">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`relative mb-3 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                index === currentSlide ? "border-orange-500" : "border-zinc-700 hover:border-zinc-600"
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div 
                className="aspect-video p-2 text-xs"
                style={{ backgroundColor: slide.backgroundColor, color: slide.textColor }}
              >
                <p className="font-semibold truncate">{slide.title}</p>
              </div>
              <span className="absolute bottom-1 left-1 text-xs text-zinc-400">{index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 hover:opacity-100 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={addSlide}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slide
          </Button>
        </div>

        {/* Main Editing Area */}
        <div className="flex-1 p-8 flex flex-col">
          {/* Slide Preview */}
          <div 
            className="flex-1 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-12"
            style={{ backgroundColor: slides[currentSlide].backgroundColor }}
          >
            <Input
              value={slides[currentSlide].title}
              onChange={(e) => updateSlide("title", e.target.value)}
              className="bg-transparent border-none text-4xl font-bold text-center mb-8 focus-visible:ring-0"
              style={{ color: slides[currentSlide].textColor }}
              placeholder="Slide Title"
            />
            <Textarea
              value={slides[currentSlide].content}
              onChange={(e) => updateSlide("content", e.target.value)}
              className="bg-transparent border-none text-xl text-center resize-none min-h-[200px] focus-visible:ring-0"
              style={{ color: slides[currentSlide].textColor }}
              placeholder="Slide Content"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-zinc-400">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <Button variant="outline" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 border-l border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">Slide Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Background Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 ${
                      slides[currentSlide].backgroundColor === color ? "border-orange-500" : "border-zinc-600"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateSlide("backgroundColor", color)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Text Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 ${
                      slides[currentSlide].textColor === color ? "border-orange-500" : "border-zinc-600"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateSlide("textColor", color)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {(["title", "content", "two-column", "image"] as const).map((layout) => (
                  <Button
                    key={layout}
                    variant={slides[currentSlide].layout === layout ? "default" : "outline"}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => updateSlide("layout", layout)}
                  >
                    {layout}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentations;
