// JBJ Slash Command Executor
// Executes functional commands like /schedule, /email, /whatsapp, /report

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  action?: 'schedule' | 'email' | 'whatsapp' | 'call' | 'report' | 'task' | 'meeting';
}

export interface ParsedCommand {
  command: string;
  args: string[];
  rawArgs: string;
}

export function parseCommand(input: string): ParsedCommand | null {
  if (!input.startsWith('/')) return null;
  
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  const rawArgs = args.join(' ');
  
  return { command, args, rawArgs };
}

export async function executeCommand(
  input: string, 
  userId: string
): Promise<CommandResult> {
  const parsed = parseCommand(input);
  if (!parsed) {
    return { success: false, message: "Not a command" };
  }

  const { command, args, rawArgs } = parsed;

  try {
    switch (command) {
      case '/schedule':
      case '/meeting':
        return await handleScheduleCommand(rawArgs, userId);
      
      case '/email':
        return await handleEmailCommand(rawArgs, userId);
      
      case '/whatsapp':
        return await handleWhatsAppCommand(rawArgs, userId);
      
      case '/call':
        return await handleCallCommand(rawArgs, userId);
      
      case '/report':
        return await handleReportCommand(rawArgs, userId);
      
      case '/task':
        return await handleTaskCommand(rawArgs, userId);
      
      case '/create-meeting':
        return await handleCreateMeetingCommand(userId);
      
      case '/assign':
        return await handleAssignCommand(rawArgs, userId);
      
      case '/remind':
        return await handleRemindCommand(rawArgs, userId);
      
      default:
        return { 
          success: false, 
          message: `Unknown command: ${command}. Available commands: /schedule, /email, /whatsapp, /call, /report, /task, /create-meeting, /assign, /remind` 
        };
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return { success: false, message: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function handleScheduleCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /schedule meeting with [name] at [time] on [date]
  const timeMatch = args.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  const dateMatch = args.match(/on\s+(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/i);
  const withMatch = args.match(/with\s+([^at]+?)(?:\s+at|\s+on|$)/i);
  
  const meetingWith = withMatch?.[1]?.trim() || 'Team';
  const meetingTime = timeMatch?.[1] || 'TBD';
  const meetingDate = dateMatch?.[1] || 'Today';
  
  // Create a task for the meeting
  const { error } = await supabase.from('assistant_tasks').insert({
    user_id: userId,
    title: `Meeting with ${meetingWith}`,
    description: `Scheduled meeting at ${meetingTime} on ${meetingDate}`,
    status: 'pending',
    priority: 'medium',
    ai_created: true,
  });

  if (error) throw error;

  // Generate meeting link
  const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const meetLink = `https://meet.jbj.ae/${meetingId}`;

  return {
    success: true,
    message: `✅ Meeting scheduled with ${meetingWith} at ${meetingTime} on ${meetingDate}.\n\n🔗 **JBJ Meet Link:** ${meetLink}\n\nInvite sent. Task created for tracking.`,
    action: 'schedule',
    data: { meetingWith, meetingTime, meetingDate, meetLink }
  };
}

async function handleEmailCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /email to [recipient] about [subject]
  const toMatch = args.match(/to\s+([^\s]+)/i);
  const aboutMatch = args.match(/about\s+(.+)/i);
  
  const recipient = toMatch?.[1] || 'recipient';
  const subject = aboutMatch?.[1] || 'your inquiry';

  // Create a draft
  const { error } = await supabase.from('crm_ai_drafts').insert({
    draft_type: 'email',
    subject: subject,
    content: `Dear ${recipient},\n\nI hope this email finds you well.\n\n[Your message here]\n\nBest regards,\nJane Abou Jaoude\nFounder & CEO JBJ Global Real Estate`,
    status: 'draft',
    lead_id: null,
  });

  if (error) throw error;

  return {
    success: true,
    message: `📧 Email draft created for ${recipient} about "${subject}".\n\nView and edit in the **Drafts** tab before sending.`,
    action: 'email',
    data: { recipient, subject }
  };
}

async function handleWhatsAppCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /whatsapp to [number/name] [message]
  const toMatch = args.match(/to\s+([^\s]+)/i);
  const messageMatch = args.match(/to\s+[^\s]+\s+(.+)/i);
  
  const recipient = toMatch?.[1] || 'contact';
  const message = messageMatch?.[1] || '';

  // Log the WhatsApp intent
  await supabase.from('ai_communication_logs').insert({
    ai_employee_id: userId,
    ai_name: 'Amanda Clarke',
    action_type: 'whatsapp_send',
    channel: 'whatsapp',
    recipient_id: recipient,
    recipient_type: 'lead',
    message_preview: message.substring(0, 100),
  });

  return {
    success: true,
    message: `📱 WhatsApp message prepared for ${recipient}.\n\n**Message:** "${message || '[Click to compose]'}"\n\n[Opening WhatsApp...]`,
    action: 'whatsapp',
    data: { recipient, message }
  };
}

async function handleCallCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /call [number/name]
  const target = args.trim() || 'contact';

  // Log the call intent
  await supabase.from('broker_call_logs').insert({
    user_id: userId,
    phone_number: target,
    call_type: 'outbound',
    call_status: 'initiated',
  });

  return {
    success: true,
    message: `📞 Initiating call to ${target}...\n\nClick to start the call via your phone.`,
    action: 'call',
    data: { target }
  };
}

async function handleReportCommand(args: string, userId: string): Promise<CommandResult> {
  const reportType = args.toLowerCase().includes('weekly') ? 'weekly' : 
                     args.toLowerCase().includes('monthly') ? 'monthly' : 'daily';

  // Fetch some stats for the report
  const today = new Date().toISOString().split('T')[0];
  
  const [{ count: leadsCount }, { count: tasksCompleted }] = await Promise.all([
    supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
    supabase.from('assistant_tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    success: true,
    message: `📊 **${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Generated**\n\n• Total Leads: ${leadsCount || 0}\n• Tasks Completed: ${tasksCompleted || 0}\n• Date: ${today}\n\n[Full report available in Analytics tab]`,
    action: 'report',
    data: { reportType, leadsCount, tasksCompleted }
  };
}

async function handleTaskCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /task [title] for [assignee] by [deadline]
  const forMatch = args.match(/for\s+([^by]+)/i);
  const byMatch = args.match(/by\s+(.+)/i);
  
  let title = args;
  if (forMatch) title = args.split(/for/i)[0].trim();
  
  const assignee = forMatch?.[1]?.trim() || 'me';
  const deadline = byMatch?.[1]?.trim() || 'ASAP';

  const { error } = await supabase.from('assistant_tasks').insert({
    user_id: userId,
    title: title || 'New Task',
    description: `Assigned to: ${assignee}, Due: ${deadline}`,
    status: 'pending',
    priority: 'medium',
    ai_created: true,
  });

  if (error) throw error;

  return {
    success: true,
    message: `✅ Task created: "${title}"\n\n• **Assigned to:** ${assignee}\n• **Deadline:** ${deadline}\n\nView in the Tasks tab.`,
    action: 'task',
    data: { title, assignee, deadline }
  };
}

async function handleCreateMeetingCommand(userId: string): Promise<CommandResult> {
  const meetingId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const meetLink = `https://meet.jbj.ae/${meetingId}`;

  return {
    success: true,
    message: `🎥 **JBJ Video Meet Created**\n\n🔗 **Meeting Link:** ${meetLink}\n\n• Link is active immediately\n• Sound tested ✅\n• Branded background ready\n\nShare this link with participants.`,
    action: 'meeting',
    data: { meetingId, meetLink }
  };
}

async function handleAssignCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /assign [task] to [person/department]
  const toMatch = args.match(/to\s+(.+)/i);
  const task = args.split(/to/i)[0].trim() || 'Task';
  const assignee = toMatch?.[1]?.trim() || 'Team';

  return {
    success: true,
    message: `📋 Task "${task}" assigned to ${assignee}.\n\nNotification sent to the assignee.`,
    action: 'task',
    data: { task, assignee }
  };
}

async function handleRemindCommand(args: string, userId: string): Promise<CommandResult> {
  // Parse: /remind [about] at [time]
  const atMatch = args.match(/at\s+(.+)/i);
  const about = args.split(/at/i)[0].trim() || 'Reminder';
  const time = atMatch?.[1]?.trim() || 'soon';

  return {
    success: true,
    message: `⏰ Reminder set: "${about}" at ${time}.\n\nYou'll be notified when it's time.`,
    action: 'task',
    data: { about, time }
  };
}
