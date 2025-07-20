import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/ui/header";
import MobileNav from "@/components/ui/mobile-nav";
import UserCard from "@/components/ui/user-card";
import SwapRequestModal from "@/components/ui/swap-request-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MapPin, Clock, Star } from "lucide-react";
import type { User, Skill, UserSkillOffered, UserSkillWanted } from "@shared/schema";

export default function Browse() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    availability: "",
    location: "",
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

  const { data: users = [], isLoading: usersLoading, error } = useQuery<(User & {
    skillsOffered: Array<UserSkillOffered & { skill: Skill }>;
    skillsWanted: Array<UserSkillWanted & { skill: Skill }>;
    averageRating?: number;
    totalSwaps?: number;
  })[]>({
    queryKey: ["/api/users/browse", { 
      skill: searchQuery, 
      availability: filters.availability,
      location: filters.location,
      limit: 20 
    }],
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

  const handleRequestSwap = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setSelectedUser(foundUser);
      setIsSwapModalOpen(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically refetch due to the queryKey dependency
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Skills</h1>
          <p className="text-xl text-gray-600">Discover what our community has to offer</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Main Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by skill (e.g., Excel, Python, Guitar)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-600 text-lg pr-16"
              />
              <Button 
                type="submit"
                size="sm"
                className="absolute right-2 top-2 gradient-primary text-white border-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => setFilters({ ...filters, availability: filters.availability === "available" ? "" : "available" })}
                className={filters.availability === "available" ? "border-blue-600 text-blue-600" : ""}
              >
                <Clock className="mr-2 h-4 w-4" />
                Available Now
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => setFilters({ ...filters, location: filters.location === "nearby" ? "" : "nearby" })}
                className={filters.location === "nearby" ? "border-blue-600 text-blue-600" : ""}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Near Me
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
              >
                <Star className="mr-2 h-4 w-4" />
                Top Rated
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {usersLoading ? "Searching..." : `Found ${users?.length || 0} skill swappers`}
          </h2>
        </div>

        {/* Users Grid */}
        {usersLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map((user: any) => (
                <UserCard 
                  key={user.id}
                  user={user}
                  onRequestSwap={handleRequestSwap}
                />
              ))}
            </div>
            
            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Profiles
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No users found for "${searchQuery}". Try a different search term.`
                : "No users available. Try adjusting your filters."
              }
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilters({ availability: "", location: "" });
              }}
            >
              Clear Search
            </Button>
          </div>
        )}
      </main>

      <MobileNav />
      
      {/* Swap Request Modal */}
      <SwapRequestModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        targetUser={selectedUser}
      />
    </div>
  );
}
