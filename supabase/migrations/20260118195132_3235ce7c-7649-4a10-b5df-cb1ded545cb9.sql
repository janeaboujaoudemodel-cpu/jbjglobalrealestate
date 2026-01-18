-- Design Studio Projects Table
CREATE TABLE public.design_studio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_type TEXT,
  template_size TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  thumbnail_url TEXT,
  final_design_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Color Palettes Table
CREATE TABLE public.design_color_palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project-Palette Association
CREATE TABLE public.design_project_palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.design_studio_projects(id) ON DELETE CASCADE,
  palette_id UUID NOT NULL REFERENCES public.design_color_palettes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, palette_id)
);

-- Design Assets (uploaded logos, images, etc.)
CREATE TABLE public.design_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.design_studio_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Design History (version control)
CREATE TABLE public.design_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.design_studio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  design_url TEXT NOT NULL,
  prompt_used TEXT,
  changes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Design Templates (saved user templates)
CREATE TABLE public.design_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  preview_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Website Integration Requests (for pushing designs to website)
CREATE TABLE public.design_website_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.design_studio_projects(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  target_section TEXT,
  target_page TEXT,
  design_url TEXT NOT NULL,
  ai_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_project_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_website_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_studio_projects
CREATE POLICY "Users can view their own projects" ON public.design_studio_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.design_studio_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.design_studio_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.design_studio_projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for design_color_palettes
CREATE POLICY "Users can view their own palettes and public ones" ON public.design_color_palettes FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create their own palettes" ON public.design_color_palettes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own palettes" ON public.design_color_palettes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own palettes" ON public.design_color_palettes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for design_project_palettes
CREATE POLICY "Users can view their project palettes" ON public.design_project_palettes FOR SELECT USING (EXISTS (SELECT 1 FROM public.design_studio_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can manage their project palettes" ON public.design_project_palettes FOR ALL USING (EXISTS (SELECT 1 FROM public.design_studio_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

-- RLS Policies for design_assets
CREATE POLICY "Users can view their own assets" ON public.design_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assets" ON public.design_assets FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for design_history
CREATE POLICY "Users can view their project history" ON public.design_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.design_studio_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can add to their project history" ON public.design_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for design_templates
CREATE POLICY "Users can view their own and public templates" ON public.design_templates FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can manage their own templates" ON public.design_templates FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for design_website_requests
CREATE POLICY "Users can view their own requests" ON public.design_website_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own requests" ON public.design_website_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update requests" ON public.design_website_requests FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_design_projects_user ON public.design_studio_projects(user_id);
CREATE INDEX idx_design_palettes_user ON public.design_color_palettes(user_id);
CREATE INDEX idx_design_assets_user ON public.design_assets(user_id);
CREATE INDEX idx_design_history_project ON public.design_history(project_id);
CREATE INDEX idx_design_templates_category ON public.design_templates(category);
CREATE INDEX idx_design_website_requests_status ON public.design_website_requests(status);

-- Triggers for updated_at
CREATE TRIGGER update_design_studio_projects_updated_at BEFORE UPDATE ON public.design_studio_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_design_color_palettes_updated_at BEFORE UPDATE ON public.design_color_palettes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_design_templates_updated_at BEFORE UPDATE ON public.design_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_design_website_requests_updated_at BEFORE UPDATE ON public.design_website_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();