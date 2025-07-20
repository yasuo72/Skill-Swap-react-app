import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, TrendingUp, MessageSquare, Star, ArrowRight, Calendar, Search } from "lucide-react";
import type { SwapRequest, User, Skill } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: swapRequests = [], isLoading: swapRequestsLoading } = useQuery<(SwapRequest & {
    requester: User;
    receiver: User;
    offeredSkill: Skill;
    requestedSkill: Skill;
  })[]>({
    queryKey: ["/api/swap-requests"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery<(User & {
    skillsOffered: Array<{skill: Skill}>;
    skillsWanted: Array<{skill: Skill}>;
    averageRating?: number;
    totalSwaps?: number;
  })[]>({
    queryKey: ["/api/users/browse", "limit=6"],
    retry: false,
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingRequests = swapRequests.filter(req => req.status === 'pending');
  const activeSwaps = swapRequests.filter(req => req.status === 'accepted');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Ready to learn something new or share your expertise?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 gradient-primary rounded-lg mx-auto mb-2 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{pendingRequests.length}</div>
              <div className="text-sm text-gray-600">Pending Requests</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 gradient-secondary rounded-lg mx-auto mb-2 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{activeSwaps.length}</div>
              <div className="text-sm text-gray-600">Active Swaps</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 gradient-accent rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">4.9</div>
              <div className="text-sm text-gray-600">Your Rating</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">23</div>
              <div className="text-sm text-gray-600">Total Swaps</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                size="lg" 
                className="gradient-primary text-white border-0 h-16 flex flex-col"
                onClick={() => window.location.href = "/browse"}
              >
                <Search className="h-6 w-6 mb-1" />
                Browse Skills
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 flex flex-col hover:border-blue-600"
                onClick={() => window.location.href = "/profile"}
              >
                <Users className="h-6 w-6 mb-1" />
                Update Profile
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 flex flex-col hover:border-blue-600"
                onClick={() => window.location.href = "/swaps"}
              >
                <MessageSquare className="h-6 w-6 mb-1" />
                My Swaps
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/swaps"}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {swapRequestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.slice(0, 3).map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {request.requester.firstName} wants to swap
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.offeredSkill.name} for {request.requestedSkill.name}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start browsing to find swap partners!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recommended for You</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/browse"}>
                Browse All
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=3b82f6&color=fff`}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.title || 'Skill Swapper'}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet</p>
                  <p className="text-sm">Complete your profile to get personalized suggestions!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
