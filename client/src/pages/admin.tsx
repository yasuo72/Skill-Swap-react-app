import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  ArrowLeftRight, 
  Star, 
  AlertTriangle, 
  Crown, 
  Download, 
  BarChart, 
  Megaphone,
  Eye,
  UserX,
  Shield,
  TrendingUp
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user?.isAdmin, toast]);

  const { data: platformStats = {}, isLoading: statsLoading } = useQuery<{
    totalUsers?: number;
    totalSwaps?: number;
    flaggedContent?: number;
    averageRating?: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.isAdmin,
    retry: false,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", { limit: 50 }],
    enabled: isAuthenticated && user?.isAdmin,
    retry: false,
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async (data: { userId: string; isAdmin?: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${data.userId}/status`, { isAdmin: data.isAdmin });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMakeAdmin = (userId: string) => {
    updateUserStatusMutation.mutate({ userId, isAdmin: true });
  };

  const handleRemoveAdmin = (userId: string) => {
    updateUserStatusMutation.mutate({ userId, isAdmin: false });
  };

  const handleExportData = (type: string) => {
    toast({
      title: "Export Started",
      description: `${type} export has been initiated. You'll receive a download link shortly.`,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const filteredUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           u.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Panel</h1>
            <Badge className="gradient-accent text-white px-4 py-2">
              <Crown className="mr-2 h-4 w-4" />
              Admin Access
            </Badge>
          </div>

          {/* Platform Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="text-white h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (platformStats?.totalUsers || 0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Total Users</h3>
                <p className="text-sm text-green-600">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Platform growth
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="text-white h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (platformStats?.totalSwaps || 0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Total Swaps</h3>
                <p className="text-sm text-green-600">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Knowledge sharing
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-white h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (platformStats?.flaggedContent || 0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Flagged Content</h3>
                <p className="text-sm text-orange-600">
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  Needs Review
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Star className="text-white h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (platformStats?.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Avg Rating</h3>
                <p className="text-sm text-green-600">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Platform Health
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tools */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="content">Content Moderation</TabsTrigger>
                  <TabsTrigger value="settings">Platform Settings</TabsTrigger>
                  <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-6">
                  {/* Search */}
                  <div className="mb-6">
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">Join Date</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">Swaps</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">Rating</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          [...Array(5)].map((_, i) => (
                            <tr key={i} className="border-b border-gray-100 animate-pulse">
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                                  <div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                              <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                              <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                              <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                              <td className="py-4 px-6"><div className="h-8 bg-gray-200 rounded w-20"></div></td>
                            </tr>
                          ))
                        ) : (
                          filteredUsers.map((user: any) => {
                            const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                            const profileImage = user.profileImageUrl || 
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
                            
                            return (
                              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <img 
                                      src={profileImage}
                                      alt={`${displayName} profile`}
                                      className="w-10 h-10 rounded-full object-cover mr-3"
                                    />
                                    <div>
                                      <p className="font-semibold text-gray-900">{displayName}</p>
                                      <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6 text-gray-900 font-semibold">
                                  {user.totalSwaps || 0}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <span className="text-yellow-400 mr-1">
                                      {user.averageRating > 0 ? user.averageRating.toFixed(1) : "0.0"}
                                    </span>
                                    <Star className="h-4 w-4 text-yellow-400" />
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  {user.isAdmin ? (
                                    <Badge className="bg-purple-100 text-purple-700">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-700">
                                      Active
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" title="View Profile">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {user.isAdmin && user.id !== user?.id ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleRemoveAdmin(user.id)}
                                        disabled={updateUserStatusMutation.isPending}
                                        title="Remove Admin"
                                      >
                                        <UserX className="h-4 w-4" />
                                      </Button>
                                    ) : !user.isAdmin ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleMakeAdmin(user.id)}
                                        disabled={updateUserStatusMutation.isPending}
                                        title="Make Admin"
                                      >
                                        <Shield className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-6">
                  <div className="text-center py-16">
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Moderation</h3>
                    <p className="text-gray-600 mb-6">
                      Content moderation tools will be available here to review flagged content and manage platform quality.
                    </p>
                    <Button variant="outline">
                      View Flagged Content
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <div className="text-center py-16">
                    <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Platform Settings</h3>
                    <p className="text-gray-600 mb-6">
                      Configure platform-wide settings, announcements, and system parameters.
                    </p>
                    <Button variant="outline">
                      <Megaphone className="mr-2 h-4 w-4" />
                      Send Platform Announcement
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">User Activity Report</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Export detailed user activity and engagement metrics.
                        </p>
                        <Button 
                          onClick={() => handleExportData("User Activity")}
                          className="gradient-primary text-white border-0"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Swap Statistics</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Download comprehensive swap data and success rates.
                        </p>
                        <Button 
                          onClick={() => handleExportData("Swap Statistics")}
                          className="gradient-secondary text-white border-0"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Feedback History</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Export all user feedback and rating data.
                        </p>
                        <Button 
                          onClick={() => handleExportData("Feedback History")}
                          className="gradient-accent text-white border-0"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
