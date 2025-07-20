import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, X } from "lucide-react";

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    skillsWanted?: Array<{ skill: { id: number; name: string } }>;
  };
}

export default function SwapRequestModal({ isOpen, onClose, targetUser }: SwapRequestModalProps) {
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string>("");
  const [selectedRequestedSkill, setSelectedRequestedSkill] = useState<string>("");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mySkillsOffered } = useQuery({
    queryKey: ["/api/user/skills/offered"],
    enabled: isOpen,
  });

  const createSwapRequestMutation = useMutation({
    mutationFn: async (data: {
      receiverId: string;
      offeredSkillId: number;
      requestedSkillId: number;
      message?: string;
      preferredTime?: string;
    }) => {
      await apiRequest("POST", "/api/swap-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swap request sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/swap-requests"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send swap request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetUser || !selectedOfferedSkill || !selectedRequestedSkill) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSwapRequestMutation.mutate({
      receiverId: targetUser.id,
      offeredSkillId: parseInt(selectedOfferedSkill),
      requestedSkillId: parseInt(selectedRequestedSkill),
      message,
      preferredTime,
    });
  };

  const handleClose = () => {
    setSelectedOfferedSkill("");
    setSelectedRequestedSkill("");
    setMessage("");
    setPreferredTime("");
    onClose();
  };

  if (!targetUser) return null;

  const targetUserName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'Unknown User';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Request Skill Swap with {targetUserName}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skill you're offering */}
          <div>
            <Label htmlFor="offered-skill" className="text-sm font-semibold text-gray-700">
              Skill you're offering: *
            </Label>
            <Select value={selectedOfferedSkill} onValueChange={setSelectedOfferedSkill}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a skill you can teach..." />
              </SelectTrigger>
              <SelectContent>
                {mySkillsOffered?.map((userSkill: any) => (
                  <SelectItem key={userSkill.skillId} value={userSkill.skillId.toString()}>
                    {userSkill.skill.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* Skill you want */}
          <div>
            <Label htmlFor="requested-skill" className="text-sm font-semibold text-gray-700">
              Skill you want in return: *
            </Label>
            <Select value={selectedRequestedSkill} onValueChange={setSelectedRequestedSkill}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a skill you want to learn..." />
              </SelectTrigger>
              <SelectContent>
                {targetUser.skillsWanted?.map((userSkill) => (
                  <SelectItem key={userSkill.skill.id} value={userSkill.skill.id.toString()}>
                    {userSkill.skill.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
              Message (optional):
            </Label>
            <Textarea
              id="message"
              rows={4}
              placeholder="Introduce yourself and explain what you hope to learn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 resize-none"
            />
          </div>

          {/* Preferred time */}
          <div>
            <Label htmlFor="preferred-time" className="text-sm font-semibold text-gray-700">
              Preferred time:
            </Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your preferred time..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekday-mornings">Weekday Mornings</SelectItem>
                <SelectItem value="weekday-evenings">Weekday Evenings</SelectItem>
                <SelectItem value="weekends">Weekends</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button 
              type="submit" 
              disabled={createSwapRequestMutation.isPending}
              className="flex-1 gradient-primary text-white border-0 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
            >
              <Send className="mr-2 h-4 w-4" />
              {createSwapRequestMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-8"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
