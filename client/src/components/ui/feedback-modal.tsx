import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Send, X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapRequest?: {
    id: number;
    requester: { id: string; firstName?: string; lastName?: string };
    receiver: { id: string; firstName?: string; lastName?: string };
  };
  currentUserId?: string;
}

export default function FeedbackModal({ isOpen, onClose, swapRequest, currentUserId }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: {
      swapRequestId: number;
      revieweeId: string;
      rating: number;
      comment?: string;
    }) => {
      await apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feedback submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!swapRequest || !currentUserId || rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating.",
        variant: "destructive",
      });
      return;
    }

    const revieweeId = currentUserId === swapRequest.requester.id 
      ? swapRequest.receiver.id 
      : swapRequest.requester.id;

    createFeedbackMutation.mutate({
      swapRequestId: swapRequest.id,
      revieweeId,
      rating,
      comment,
    });
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    onClose();
  };

  const handleSkip = () => {
    toast({
      title: "Skipped",
      description: "You can leave feedback later from your completed swaps.",
    });
    handleClose();
  };

  if (!swapRequest || !currentUserId) return null;

  const otherUser = currentUserId === swapRequest.requester.id 
    ? swapRequest.receiver 
    : swapRequest.requester;
  
  const otherUserName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Unknown User';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Rate Your Experience
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center mb-6">
          <p className="text-gray-600">
            How was your skill swap with <span className="font-semibold">{otherUserName}</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <Label className="text-sm font-semibold text-gray-700 mb-4 block">
              Rating (1-5 stars): *
            </Label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-colors"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="text-sm font-semibold text-gray-700">
              Comment (optional):
            </Label>
            <Textarea
              id="comment"
              rows={4}
              placeholder="Share your experience with this skill swap..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={createFeedbackMutation.isPending || rating === 0}
              className="flex-1 gradient-primary text-white border-0 hover:shadow-lg transition-all duration-300"
            >
              <Send className="mr-2 h-4 w-4" />
              {createFeedbackMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="px-6"
            >
              Skip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
