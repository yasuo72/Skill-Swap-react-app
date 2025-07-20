import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";
import SkillTag from "@/components/ui/skill-tag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Edit, Eye, Plus, Star, TrendingUp, Users, X } from "lucide-react";
import type { User, Skill, UserSkillOffered, UserSkillWanted, Feedback } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [skillModalType, setSkillModalType] = useState<"offered" | "wanted">("offered");
  const [newSkillName, setNewSkillName] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [profileData, setProfileData] = useState({
    title: "",
    location: "",
    isPublic: true,
    availability: [] as string[],
  });

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

  // Initialize profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        title: user.title || "",
        location: user.location || "",
        isPublic: user.isPublic ?? true,
        availability: user.availability || [],
      });
    }
  }, [user]);

  const { data: skillsOffered = [], isLoading: skillsOfferedLoading } = useQuery<(UserSkillOffered & { skill: Skill })[]>({
    queryKey: ["/api/user/skills/offered"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: skillsWanted = [], isLoading: skillsWantedLoading } = useQuery<(UserSkillWanted & { skill: Skill })[]>({
    queryKey: ["/api/user/skills/wanted"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: allSkills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: userFeedback = [] } = useQuery<(Feedback & { reviewer: User })[]>({
    queryKey: ["/api/users", user?.id, "feedback"],
    enabled: isAuthenticated && !!user?.id,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/auth/user`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: async (data: { skillId: number; type: "offered" | "wanted" }) => {
      const endpoint = data.type === "offered" 
        ? "/api/user/skills/offered" 
        : "/api/user/skills/wanted";
      await apiRequest("POST", endpoint, { skillId: data.skillId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Skill added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/offered"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/wanted"] });
      setIsAddSkillModalOpen(false);
      setNewSkillName("");
      setSelectedSkillId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (data: { id: number; type: "offered" | "wanted" }) => {
      const endpoint = data.type === "offered" 
        ? `/api/user/skills/offered/${data.id}` 
        : `/api/user/skills/wanted/${data.id}`;
      await apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Skill removed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/offered"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills/wanted"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      const response = await apiRequest("POST", "/api/skills", { name: skillName });
      return response.json();
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setSelectedSkillId(newSkill.id.toString());
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAvailabilityChange = (value: string, checked: boolean) => {
    setProfileData(prev => ({
      ...prev,
      availability: checked 
        ? [...prev.availability, value]
        : prev.availability.filter(a => a !== value)
    }));
  };

  const handleAddSkill = () => {
    if (selectedSkillId) {
      addSkillMutation.mutate({
        skillId: parseInt(selectedSkillId),
        type: skillModalType,
      });
    } else if (newSkillName.trim()) {
      createSkillMutation.mutate(newSkillName.trim());
    }
  };

  const openAddSkillModal = (type: "offered" | "wanted") => {
    setSkillModalType(type);
    setIsAddSkillModalOpen(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const averageRating = userFeedback.length > 0
    ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length
    : 0;

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  const profileImage = user.profileImageUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Your Profile</h1>

          <Card className="shadow-lg mb-8">
            <CardContent className="p-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
                <div className="relative mb-6 md:mb-0 md:mr-8">
                  <img 
                    src={profileImage}
                    alt="Your profile picture" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <Button 
                    size="sm"
                    className="absolute bottom-2 right-2 w-8 h-8 p-0 rounded-full gradient-primary text-white"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={profileData.title}
                        onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., UX Designer & Creative Professional"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., San Francisco, CA"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  {/* Profile Visibility Toggle */}
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <Label htmlFor="visibility" className="text-sm text-gray-700 mr-3">Profile Visibility:</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="visibility"
                        checked={profileData.isPublic}
                        onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, isPublic: checked }))}
                      />
                      <span className="text-sm font-medium text-blue-600">
                        {profileData.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="gradient-primary text-white border-0"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Public Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Skills Offered Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-900">Skills I Offer</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openAddSkillModal("offered")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Skill
                  </Button>
                </div>
                
                {skillsOfferedLoading ? (
                  <div className="flex flex-wrap gap-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {skillsOffered?.map((userSkill: any) => (
                      <SkillTag
                        key={userSkill.id}
                        name={userSkill.skill.name}
                        icon={userSkill.skill.icon}
                        variant="offered"
                        removable
                        onRemove={() => removeSkillMutation.mutate({ id: userSkill.id, type: "offered" })}
                      />
                    ))}
                    {(!skillsOffered || skillsOffered.length === 0) && (
                      <Button 
                        variant="outline"
                        className="border-dashed border-gray-300 text-gray-500 hover:border-blue-600 hover:text-blue-600"
                        onClick={() => openAddSkillModal("offered")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first skill
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Wanted Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-900">Skills I Want to Learn</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openAddSkillModal("wanted")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Skill
                  </Button>
                </div>
                
                {skillsWantedLoading ? (
                  <div className="flex flex-wrap gap-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {skillsWanted?.map((userSkill: any) => (
                      <SkillTag
                        key={userSkill.id}
                        name={userSkill.skill.name}
                        icon={userSkill.skill.icon}
                        variant="wanted"
                        removable
                        onRemove={() => removeSkillMutation.mutate({ id: userSkill.id, type: "wanted" })}
                      />
                    ))}
                    {(!skillsWanted || skillsWanted.length === 0) && (
                      <Button 
                        variant="outline"
                        className="border-dashed border-gray-300 text-gray-500 hover:border-blue-600 hover:text-blue-600"
                        onClick={() => openAddSkillModal("wanted")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add skills you want to learn
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Availability Section */}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Availability</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "weekdays", label: "Weekdays" },
                    { value: "weekends", label: "Weekends" },
                    { value: "evenings", label: "Evenings" },
                    { value: "flexible", label: "Flexible" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={profileData.availability.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={option.value} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {userFeedback?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {(skillsOffered?.length || 0) + (skillsWanted?.length || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Skills Listed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />

      {/* Add Skill Modal */}
      <Dialog open={isAddSkillModalOpen} onOpenChange={setIsAddSkillModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Add {skillModalType === "offered" ? "Skill You Offer" : "Skill You Want"}
              <Button variant="ghost" size="sm" onClick={() => setIsAddSkillModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="skill-select">Choose from existing skills:</Label>
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {allSkills?.map((skill: any) => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-gray-500">or</div>

            <div>
              <Label htmlFor="new-skill">Create a new skill:</Label>
              <Input
                id="new-skill"
                value={newSkillName}
                onChange={(e) => {
                  setNewSkillName(e.target.value);
                  if (e.target.value) {
                    setSelectedSkillId("");
                  }
                }}
                placeholder="Enter skill name..."
                className="mt-2"
              />
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleAddSkill}
                disabled={addSkillMutation.isPending || createSkillMutation.isPending || (!selectedSkillId && !newSkillName.trim())}
                className="flex-1 gradient-primary text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addSkillMutation.isPending || createSkillMutation.isPending ? "Adding..." : "Add Skill"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddSkillModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
