/**
 * Standardized AI Tool Client Helper
 * 
 * Single entry point for all AI tool edge function calls.
 * Handles:
 * - Auth token injection when logged in
 * - Error normalization (401/403/429/500)
 * - Consistent response format
 * - Rate limit handling
 */

import { supabase } from "@/integrations/supabase/client";

export type AIToolErrorType = 'auth' | 'broker' | 'rate_limit' | 'server' | 'validation' | 'unknown';

export interface AIToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: AIToolErrorType;
  job_id?: string;
}

export interface AIToolOptions {
  /** If true, requires broker access (will return errorType: 'broker' if not) */
  requireBroker?: boolean;
  /** Custom timeout in milliseconds (default: 60000) */
  timeout?: number;
}

/**
 * Invoke an AI tool edge function with standardized error handling
 * 
 * @param functionName - The edge function name (e.g., "ai-price-predictor")
 * @param payload - The request payload
 * @param options - Optional configuration
 * @returns Standardized result object
 */
export async function invokeAITool<T = any>(
  functionName: string,
  payload: Record<string, unknown>,
  options: AIToolOptions = {}
): Promise<AIToolResult<T>> {
  try {
    // Get current session for auth token injection
    const { data: { session } } = await supabase.auth.getSession();
    
    // For broker-only tools, check auth first
    if (options.requireBroker && !session) {
      return {
        success: false,
        error: "Please log in to use this tool",
        errorType: 'auth',
      };
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    // Handle Supabase function errors
    if (error) {
      return normalizeError(error);
    }

    // Handle application-level errors in response
    if (data?.error) {
      // Check for specific error types from the edge function
      if (data.error.includes("401") || data.error.includes("Unauthorized") || data.error.includes("not authenticated")) {
        return {
          success: false,
          error: "Please log in to use this tool",
          errorType: 'auth',
        };
      }
      if (data.error.includes("403") || data.error.includes("Broker") || data.error.includes("Access denied")) {
        return {
          success: false,
          error: "Broker subscription required to access this tool",
          errorType: 'broker',
        };
      }
      if (data.error.includes("429") || data.error.includes("Rate limit")) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again in a moment.",
          errorType: 'rate_limit',
        };
      }
      return {
        success: false,
        error: data.error,
        errorType: 'server',
      };
    }

    // Success case
    return {
      success: true,
      data: data as T,
      job_id: data?.job_id,
    };

  } catch (err: any) {
    return normalizeError(err);
  }
}

/**
 * Normalize various error types into a consistent format
 */
function normalizeError(error: any): AIToolResult {
  const message = error?.message || error?.toString() || "An unexpected error occurred";
  
  // Check for HTTP status codes in error
  if (message.includes("401") || message.includes("Unauthorized")) {
    return {
      success: false,
      error: "Please log in to use this tool",
      errorType: 'auth',
    };
  }
  
  if (message.includes("403") || message.includes("Forbidden") || message.includes("Access denied")) {
    return {
      success: false,
      error: "Broker subscription required to access this tool",
      errorType: 'broker',
    };
  }
  
  if (message.includes("429") || message.includes("Rate limit") || message.includes("Too many requests")) {
    return {
      success: false,
      error: "Rate limit exceeded. Please try again in a moment.",
      errorType: 'rate_limit',
    };
  }
  
  if (message.includes("402") || message.includes("Payment")) {
    return {
      success: false,
      error: "AI credits exhausted. Please add credits to continue.",
      errorType: 'rate_limit',
    };
  }
  
  if (message.includes("500") || message.includes("Internal") || message.includes("Server error")) {
    return {
      success: false,
      error: "Service temporarily unavailable. Please try again.",
      errorType: 'server',
    };
  }
  
  if (message.includes("validation") || message.includes("required") || message.includes("invalid")) {
    return {
      success: false,
      error: message,
      errorType: 'validation',
    };
  }
  
  return {
    success: false,
    error: message,
    errorType: 'unknown',
  };
}

/**
 * Check if user has broker access
 * Used for UI-level checks before making API calls
 */
export async function checkBrokerAccess(): Promise<{ hasBrokerAccess: boolean; isOwner: boolean; userId: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { hasBrokerAccess: false, isOwner: false, userId: null };
    }

    const userId = session.user.id;
    const userEmail = session.user.email?.toLowerCase();
    
    // Check if owner
    const ownerEmail = import.meta.env.VITE_OWNER_EMAIL?.toLowerCase();
    if (ownerEmail && userEmail === ownerEmail) {
      return { hasBrokerAccess: true, isOwner: true, userId };
    }

    // Check broker subscription
    const { data: subscription } = await supabase
      .from('broker_subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    return {
      hasBrokerAccess: !!subscription,
      isOwner: false,
      userId,
    };
  } catch {
    return { hasBrokerAccess: false, isOwner: false, userId: null };
  }
}

/**
 * Format error message for display
 * Returns user-friendly message and optional action
 */
export function formatErrorForDisplay(result: AIToolResult): {
  message: string;
  action?: 'login' | 'subscribe' | 'retry' | 'contact';
  actionLabel?: string;
  actionLink?: string;
} {
  if (result.success) {
    return { message: '' };
  }

  switch (result.errorType) {
    case 'auth':
      return {
        message: result.error || "Please log in to continue",
        action: 'login',
        actionLabel: 'Log In',
        actionLink: '/auth',
      };
    case 'broker':
      return {
        message: result.error || "Broker subscription required",
        action: 'subscribe',
        actionLabel: 'Join as Broker',
        actionLink: '/join',
      };
    case 'rate_limit':
      return {
        message: result.error || "Rate limit exceeded",
        action: 'retry',
        actionLabel: 'Try Again',
      };
    case 'server':
      return {
        message: result.error || "Service temporarily unavailable",
        action: 'retry',
        actionLabel: 'Try Again',
      };
    case 'validation':
      return {
        message: result.error || "Please check your input",
      };
    default:
      return {
        message: result.error || "An unexpected error occurred",
        action: 'contact',
        actionLabel: 'Contact Support',
        actionLink: '/contact',
      };
  }
}
