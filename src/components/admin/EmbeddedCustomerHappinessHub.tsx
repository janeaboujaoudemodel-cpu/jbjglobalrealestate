import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import TicketSurveysTab from "./TicketSurveysTab";
import {
  Star,
  MessageSquareHeart,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ClipboardCheck,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { EmbeddedSupportTickets } from "./EmbeddedSupportTickets";

interface Review {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  service_type: string;
  review_text: string;
  improve_text: string | null;
  feature_key: string;
  would_recommend: string;
  status: string;
  loyalty_points_awarded: number;
  admin_notes: string | null;
  is_anonymous: boolean;
  publish_requested: boolean;
  user_id: string | null;
  created_at: string;
}

interface IssueReport {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  tool_name: string;
  issue_description: string;
  issue_category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface IdeaSubmission {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  idea: string;
  idea_title: string | null;
  idea_category: string | null;
  expected_benefit: string | null;
  enter_draw: boolean | null;
  status: string;
  is_anonymous: boolean;
  draw_ticket_number: string | null;
  admin_notes: string | null;
  points_awarded: number | null;
  user_id: string | null;
  created_at: string;
}

export const EmbeddedCustomerHappinessHub = () => {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<IdeaSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<string>("all");

  // Fetch reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["customer-reviews-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  // Fetch issue reports
  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: ["issue-reports-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jbj_issue_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as IssueReport[];
    },
  });

  // Fetch ideas
  const { data: ideas, isLoading: ideasLoading } = useQuery({
    queryKey: ["ideas-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("best_idea_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as IdeaSubmission[];
    },
  });

  // Approve/Reject review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: "approve" | "reject"; notes: string }) => {
      const { error } = await supabase
        .from("customer_reviews")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          published_at: action === "approve" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      // Points are handled automatically by the DB trigger (handle_customer_review_status_change)
    },
    onSuccess: (_, { action }) => {
      toast.success(`Review ${action === "approve" ? "approved (+2 pts)" : "rejected (points deducted)"}`);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews-admin"] });
      setSelectedReview(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update review");
    },
  });

  // Bulk review mutation
  const bulkReviewMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "approve" | "reject" | "pending_approval" }) => {
      const updateData: any = {
        status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending_approval",
        admin_notes: action === "approve" ? "Bulk approved" : action === "reject" ? "Bulk rejected" : null,
        reviewed_at: new Date().toISOString(),
        published_at: action === "approve" ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from("customer_reviews")
        .update(updateData)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { action, ids }) => {
      toast.success(`${ids.length} review(s) ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "set to pending"}`);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews-admin"] });
      setSelectedReviewIds(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to bulk update reviews");
    },
  });

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    if (reviewFilter === "all") return reviews;
    return reviews.filter(r => r.status === reviewFilter);
  }, [reviews, reviewFilter]);

  const toggleReviewSelect = (id: string) => {
    setSelectedReviewIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedReviewIds(new Set(filteredReviews.map(r => r.id)));
  };

  // Approve/Reject idea mutation with points
  const ideaMutation = useMutation({
    mutationFn: async ({ id, action, notes, userId }: { id: string; action: "approve" | "reject"; notes: string; userId: string | null }) => {
      // Update the idea status
      const { error: updateError } = await supabase
        .from("best_idea_submissions")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          points_awarded: action === "approve" ? 100 : 0,
          points_awarded_at: action === "approve" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      
      if (updateError) throw updateError;

      // If approved and user_id exists, add points to ledger
      if (action === "approve" && userId) {
        const { error: pointsError } = await supabase
          .from("points_ledger")
          .insert({
            user_id: userId,
            event_type: "idea_approved",
            event_description: "Idea submission approved",
            points_delta: 100,
            points_balance_after: 0, // This will be recalculated by trigger
            category: "activity",
            source_name: "Customer Happiness",
            notes: `Idea approved: ${notes || "No notes"}`,
          });
        
        if (pointsError) {
          console.error("Points ledger error:", pointsError);
          // Don't throw - idea was still approved
        }
      }
    },
    onSuccess: (_, { action }) => {
      toast.success(`Idea ${action === "approve" ? "approved (100 points awarded)" : "rejected"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["ideas-admin"] });
      setSelectedIdea(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update idea");
    },
  });
  const pendingReviews = reviews?.filter((r) => r.status === "pending_approval").length || 0;
  const approvedReviews = reviews?.filter((r) => r.status === "approved").length || 0;
  const openIssues = issues?.filter((i) => i.status === "open" || i.status === "new").length || 0;
  const pendingIdeas = ideas?.filter((i) => i.status === "pending" || i.status === "submitted").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
      case "pending":
      case "submitted":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/40"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/40"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/40"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "open":
      case "new":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/40"><AlertCircle className="w-3 h-3 mr-1" />Open</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/40"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-600 border-zinc-500/40">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-gold text-gold" : "text-zinc-400"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview - Color-Coded + Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="bg-white border-2 border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer active:scale-95"
          onClick={() => {}}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Support Tickets</p>
                <p className="text-xl font-bold text-black">View Tab</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-pink-500/60 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 cursor-pointer active:scale-95"
          onClick={() => {}}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 border-2 border-pink-500/40 flex items-center justify-center">
                <MessageSquareHeart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Pending Reviews</p>
                <p className="text-xl font-bold text-black">{pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-red-500/60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 cursor-pointer active:scale-95"
          onClick={() => {}}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Open Issues</p>
                <p className="text-xl font-bold text-black">{openIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer active:scale-95"
          onClick={() => {}}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Pending Ideas</p>
                <p className="text-xl font-bold text-black">{pendingIdeas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="bg-white/80 border-2 border-gold/30 p-1">
          <TabsTrigger value="tickets" className="tab-trigger-champagne text-black">
            <Ticket className="w-4 h-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="surveys" className="tab-trigger-champagne text-black">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Surveys
          </TabsTrigger>
          <TabsTrigger value="reviews" className="tab-trigger-champagne text-black">
            <MessageSquareHeart className="w-4 h-4 mr-2" />
            Reviews ({pendingReviews})
          </TabsTrigger>
          <TabsTrigger value="issues" className="tab-trigger-champagne text-black">
            <AlertCircle className="w-4 h-4 mr-2" />
            Issues ({openIssues})
          </TabsTrigger>
          <TabsTrigger value="ideas" className="tab-trigger-champagne text-black">
            <Lightbulb className="w-4 h-4 mr-2" />
            Ideas ({pendingIdeas})
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab - Reuse existing component */}
        <TabsContent value="tickets">
          <EmbeddedSupportTickets />
        </TabsContent>

        {/* Surveys Tab */}
        <TabsContent value="surveys">
          <TicketSurveysTab />
        </TabsContent>

        {/* Reviews Tab - With Bulk Actions */}
        <TabsContent value="reviews">
          <Card className="bg-white border-2 border-gold/30">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-black flex items-center gap-2">
                  <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                  Customer Reviews ({filteredReviews.length})
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter */}
                  {["all", "pending_approval", "approved", "rejected"].map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={reviewFilter === f ? "default" : "outline"}
                      className={reviewFilter === f ? "bg-gold text-black" : "border-gold/30"}
                      onClick={() => { setReviewFilter(f); setSelectedReviewIds(new Set()); }}
                    >
                      {f === "all" ? "All" : f === "pending_approval" ? "Pending" : f === "approved" ? "Approved" : "Rejected"}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Bulk Action Bar */}
              {selectedReviewIds.size > 0 && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-gold/10 rounded-lg border border-gold/30">
                  <span className="text-sm font-semibold text-black">{selectedReviewIds.size} selected</span>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => bulkReviewMutation.mutate({ ids: Array.from(selectedReviewIds), action: "approve" })} disabled={bulkReviewMutation.isPending}>
                    <ThumbsUp className="w-3 h-3 mr-1" /> Approve All
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => bulkReviewMutation.mutate({ ids: Array.from(selectedReviewIds), action: "reject" })} disabled={bulkReviewMutation.isPending}>
                    <ThumbsDown className="w-3 h-3 mr-1" /> Reject All
                  </Button>
                  <Button size="sm" variant="outline" className="border-gold/30" onClick={() => bulkReviewMutation.mutate({ ids: Array.from(selectedReviewIds), action: "pending_approval" })} disabled={bulkReviewMutation.isPending}>
                    <Clock className="w-3 h-3 mr-1" /> Set Pending
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedReviewIds(new Set())}>Clear</Button>
                </div>
              )}
              {filteredReviews.length > 0 && selectedReviewIds.size === 0 && (
                <Button size="sm" variant="outline" className="mt-2 border-gold/30" onClick={selectAllFiltered}>
                  Select All ({filteredReviews.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredReviews.map((review) => (
                      <div
                        key={review.id}
                        className={`p-4 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border transition-all ${
                          selectedReviewIds.has(review.id) ? "border-gold ring-2 ring-gold/30" : "border-gold/20 hover:border-gold/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedReviewIds.has(review.id)}
                            onChange={() => toggleReviewSelect(review.id)}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 text-gold focus:ring-gold"
                          />
                          {/* Content */}
                          <div className="flex-1 cursor-pointer" onClick={() => setSelectedReview(review)}>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <span className="font-semibold text-black">{review.full_name}</span>
                              {renderStars(review.rating)}
                              {getStatusBadge(review.status)}
                              {review.is_anonymous && <Badge className="bg-zinc-100 text-zinc-600 border-zinc-300 text-xs">Anonymous</Badge>}
                              {review.feature_key && <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs">{review.feature_key}</Badge>}
                            </div>
                            <p className="text-sm text-zinc-600 line-clamp-2">{review.review_text}</p>
                            {review.improve_text && (
                              <p className="text-xs text-zinc-500 mt-1 italic">💡 {review.improve_text}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <span>{review.service_type}</span>
                              <span>•</span>
                              <span>{new Date(review.created_at).toLocaleDateString()}</span>
                              {review.publish_requested && <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">Wants publishing</Badge>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gold hover:text-black" onClick={() => setSelectedReview(review)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredReviews.length === 0 && (
                      <p className="text-center text-zinc-500 py-8">No reviews match this filter</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <Card className="bg-white border-2 border-gold/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Issue Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {issuesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {issues?.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-black">{issue.user_name}</span>
                              <Badge className="bg-zinc-100 text-zinc-700 border-zinc-300">{issue.issue_category}</Badge>
                              {getStatusBadge(issue.status)}
                            </div>
                            <p className="text-sm text-zinc-600 line-clamp-2">{issue.issue_description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <span>{issue.tool_name}</span>
                              <span>•</span>
                              <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!issues || issues.length === 0) && (
                      <p className="text-center text-zinc-500 py-8">No issue reports yet</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas">
          <Card className="bg-white border-2 border-gold/30">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-500" />
                Idea Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ideasLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {ideas?.map((idea) => (
                      <div
                        key={idea.id}
                        className="p-4 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all cursor-pointer"
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-black">
                                {idea.is_anonymous ? "Anonymous" : idea.full_name}
                              </span>
                              {idea.idea_category && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                  {idea.idea_category}
                                </Badge>
                              )}
                              {idea.draw_ticket_number && (
                                <Badge className="bg-gold/20 text-gold border-gold/40">
                                  #{idea.draw_ticket_number}
                                </Badge>
                              )}
                              {getStatusBadge(idea.status)}
                              {idea.points_awarded && idea.points_awarded > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                  +{idea.points_awarded} pts
                                </Badge>
                              )}
                            </div>
                            {idea.idea_title && (
                              <p className="font-medium text-black mb-1">{idea.idea_title}</p>
                            )}
                            <p className="text-sm text-zinc-600 line-clamp-2">{idea.idea}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                              {idea.email && <span>{idea.email}</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gold hover:text-black">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!ideas || ideas.length === 0) && (
                      <p className="text-center text-zinc-500 py-8">No ideas submitted yet</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Details Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg bg-white border-2 border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-black">Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-black">{selectedReview.full_name}</p>
                  <p className="text-sm text-zinc-500">{selectedReview.email}</p>
                  {selectedReview.is_anonymous && <Badge className="mt-1 bg-zinc-100 text-zinc-600 border-zinc-300 text-xs">Anonymous</Badge>}
                </div>
                <div className="text-right">
                  {renderStars(selectedReview.rating)}
                  <p className="text-xs text-zinc-500 mt-1">{selectedReview.service_type}</p>
                  {selectedReview.feature_key && (
                    <Badge className="mt-1 bg-blue-50 text-blue-600 border-blue-200 text-xs">{selectedReview.feature_key}</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-black">{selectedReview.review_text}</p>
              </div>

              {selectedReview.improve_text && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-zinc-500 mb-1">💡 Improvement suggestion</p>
                  <p className="text-sm text-black">{selectedReview.improve_text}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-zinc-600">Would recommend:</span>
                <Badge className="bg-gold/20 text-gold border-gold/40">{selectedReview.would_recommend}</Badge>
                {selectedReview.publish_requested && <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">Wants publishing</Badge>}
              </div>

              {getStatusBadge(selectedReview.status)}

              {/* Action buttons for any non-approved status */}
              <div>
                <label className="text-sm text-zinc-600 mb-2 block">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this review..."
                  className="bg-white border-gold/30"
                />
              </div>
              <div className="flex gap-3">
                {selectedReview.status !== "approved" && (
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => reviewMutation.mutate({ id: selectedReview.id, action: "approve", notes: adminNotes })}
                    disabled={reviewMutation.isPending}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve (+2 pts)
                  </Button>
                )}
                {selectedReview.status !== "rejected" && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => reviewMutation.mutate({ id: selectedReview.id, action: "reject", notes: adminNotes })}
                    disabled={reviewMutation.isPending}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject (deduct pts)
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Idea Details Dialog */}
      <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
        <DialogContent className="max-w-lg bg-white border-2 border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              Idea Details
            </DialogTitle>
          </DialogHeader>
          {selectedIdea && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-black">{selectedIdea.is_anonymous ? "Anonymous" : selectedIdea.full_name}</p>
                {selectedIdea.email && <p className="text-sm text-zinc-500">{selectedIdea.email}</p>}
                {selectedIdea.idea_category && (
                  <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-300">{selectedIdea.idea_category}</Badge>
                )}
              </div>
              
              {selectedIdea.idea_title && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Title</p>
                  <p className="font-medium text-black">{selectedIdea.idea_title}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-zinc-500 mb-1">Idea</p>
                <p className="text-black bg-zinc-50 p-3 rounded-lg">{selectedIdea.idea}</p>
              </div>
              
              {selectedIdea.expected_benefit && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Expected Benefit</p>
                  <p className="text-black bg-zinc-50 p-3 rounded-lg">{selectedIdea.expected_benefit}</p>
                </div>
              )}

              {selectedIdea.status === "pending" && (
                <>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Admin Notes</p>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this idea..."
                      className="bg-zinc-50 border-gold/30 text-black"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => ideaMutation.mutate({ id: selectedIdea.id, action: "approve", notes: adminNotes, userId: selectedIdea.user_id })}
                      disabled={ideaMutation.isPending}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve (+100 pts)
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => ideaMutation.mutate({ id: selectedIdea.id, action: "reject", notes: adminNotes, userId: selectedIdea.user_id })}
                      disabled={ideaMutation.isPending}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmbeddedCustomerHappinessHub;
