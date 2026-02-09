import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// File validation configuration
const FILE_CONFIG = {
  profile_picture: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    bucket: 'profile-pictures',
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    bucket: 'documents',
  },
};

// Input validation schema
const RequestSchema = z.object({
  fileType: z.enum(['profile_picture', 'document']),
  fileName: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, "Invalid file name characters"),
  fileSize: z.number().min(1),
  mimeType: z.string().min(1).max(100),
  fileData: z.string().min(1), // Base64 encoded file
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileType, fileName, fileSize, mimeType, fileData } = parseResult.data;
    const config = FILE_CONFIG[fileType];

    // Validate file size
    if (fileSize > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size for ${fileType} is ${maxSizeMB}MB`,
          maxSize: config.maxSize,
          providedSize: fileSize
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    if (!config.allowedTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid file type. Allowed types for ${fileType}: ${config.allowedTypes.join(', ')}`,
          allowedTypes: config.allowedTypes,
          providedType: mimeType
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file extension matches MIME type
    const extension = fileName.split('.').pop()?.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
    };

    if (!extension || !validExtensions[mimeType]?.includes(extension)) {
      return new Response(
        JSON.stringify({ error: 'File extension does not match MIME type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 file data
    let fileBuffer: Uint8Array;
    try {
      // Remove data URL prefix if present
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const binaryString = atob(base64Data);
      fileBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBuffer[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid file data encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify actual file size matches declared size (within 10% tolerance for base64 overhead)
    if (Math.abs(fileBuffer.length - fileSize) > fileSize * 0.1) {
      return new Response(
        JSON.stringify({ error: 'File size mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file magic bytes (file signature)
    const magicBytes: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    };

    const validMagicBytes = magicBytes[mimeType];
    if (validMagicBytes) {
      const isValidSignature = validMagicBytes.some(signature => 
        signature.every((byte, index) => fileBuffer[index] === byte)
      );
      
      if (!isValidSignature) {
        console.log('Invalid file signature detected');
        return new Response(
          JSON.stringify({ error: 'File content does not match declared type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate secure file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath);

    console.log(`File uploaded successfully: ${filePath} by user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        filePath,
        publicUrl,
        fileType,
        mimeType,
        size: fileBuffer.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('File upload error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
