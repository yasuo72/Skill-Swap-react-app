import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";
import FeedbackModal from "@/components/ui/feedback-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeftRight, Check, X, Clock, CheckCircle, MessageSquare, Star } from "lucide-react";

export default function Swaps() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSwapForFeedback, setSelectedSwapForFeedback] = useState<any>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: swapRequests, isLoading: swapsLoading, error } = useQuery({
    queryKey: ["/api/swap-requests"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const updateSwapStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/swap-requests/${data.id}/status`, { status: data.status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update swap request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptSwap = (swapId: number) => {
    updateSwapStatusMutation.mutate({ id: swapId, status: "accepted" });
  };

  const handleRejectSwap = (swapId: number) => {
    updateSwapStatusMutation.mutate({ id: swapId, status: "rejected" });
  };

  const handleCompleteSwap = (swapId: number) => {
    updateSwapStatusMutation.mutate({ id: swapId, status: "completed" });
  };

  const handleLeaveFeedback = (swap: any) => {
    setSelectedSwapForFeedback(swap);
    setIsFeedbackModalOpen(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const pendingRequests = swapRequests?.filter((req: any) => req.status === 'pending') || [];
  const acceptedSwaps = swapRequests?.filter((req: any) => req.status === 'accepted') || [];
  const completedSwaps = swapRequests?.filter((req: any) => req.status === 'completed') || [];
  const rejectedSwaps = swapRequests?.filter((req: any) => req.status === 'rejected') || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOtherUser = (swap: any) => {
    return swap.requesterId === user.id ? swap.receiver : swap.requester;
  };

  const isCurrentUserRequester = (swap: any) => {
    return swap.requesterId === user.id;
  };

  const SwapCard = ({ swap, showActions = true }: { swap: any; showActions?: boolean }) => {
    const otherUser = getOtherUser(swap);
    const isRequester = isCurrentUserRequester(swap);
    const otherUserName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Unknown User';
    const otherUserImage = otherUser.profileImageUrl || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=3b82f6&color=fff`;

    const getStatusBadge = () => {
      switch (swap.status) {
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
        case 'accepted':
          return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
        case 'completed':
          return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
        case 'rejected':
          return <Badge variant="secondary" className="bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
        default:
          return <Badge variant="secondary">{swap.status}</Badge>;
      }
    };

    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <img 
                src={otherUserImage}
                alt={`${otherUserName} profile`}
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-gray-100"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{otherUserName}</h3>
                <p className="text-gray-600">
                  {isRequester ? "You requested a swap" : "Wants to swap with you"}
                </p>
                <div className="flex items-center mt-1 space-x-2">
                  {getStatusBadge()}
                  <span className="text-gray-500 text-sm">{formatDate(swap.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 lg:mx-8 mb-4 lg:mb-0">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">
                      {isRequester ? "You offer:" : "They offer:"}
                    </p>
                    <Badge className="gradient-primary text-white">
                      {swap.offeredSkill.name}
                    </Badge>
                  </div>
                  <div className="mx-4">
                    <ArrowLeftRight className="text-gray-400 h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">
                      {isRequester ? "You want:" : "They want:"}
                    </p>
                    <Badge className="bg-emerald-500 text-white">
                      {swap.requestedSkill.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex space-x-3">
                {swap.status === 'pending' && !isRequester && (
                  <>
                    <Button 
                      onClick={() => handleAcceptSwap(swap.id)}
                      disabled={updateSwapStatusMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleRejectSwap(swap.id)}
                      disabled={updateSwapStatusMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                {swap.status === 'accepted' && (
                  <>
                    <Button 
                      onClick={() => handleCompleteSwap(swap.id)}
                      disabled={updateSwapStatusMutation.isPending}
                      className="gradient-primary text-white border-0"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  </>
                )}
                {swap.status === 'completed' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleLeaveFeedback(swap)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Leave Feedback
                  </Button>
                )}
              </div>
            )}
          </div>

          {swap.message && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-700">
                <MessageSquare className="inline h-4 w-4 mr-2 text-blue-600" />
                "{swap.message}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">My Swaps Dashboard</h1>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="pending" className="relative">
                Pending Requests
                {pendingRequests.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white px-2 py-1 text-xs">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted" className="relative">
                Active Swaps
                {acceptedSwaps.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-600 text-white px-2 py-1 text-xs">
                    {acceptedSwaps.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Completed
                {completedSwaps.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white px-2 py-1 text-xs">
                    {completedSwaps.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              {swapsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6 animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((swap: any) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending requests</h3>
                    <p className="text-gray-600">
                      When others send you swap requests, they'll appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-6">
              {acceptedSwaps.length > 0 ? (
                acceptedSwaps.map((swap: any) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No active swaps</h3>
                    <p className="text-gray-600">
                      Once you accept swap requests, they'll show up here as active swaps.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              {completedSwaps.length > 0 ? (
                completedSwaps.map((swap: any) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed swaps</h3>
                    <p className="text-gray-600">
                      Your successfully completed skill swaps will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-6">
              {rejectedSwaps.length > 0 ? (
                rejectedSwaps.map((swap: any) => (
                  <SwapCard key={swap.id} swap={swap} showActions={false} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <X className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No rejected swaps</h3>
                    <p className="text-gray-600">
                      Declined or rejected swap requests will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        swapRequest={selectedSwapForFeedback}
        currentUserId={user?.id}
      />
    </div>
  );
}
