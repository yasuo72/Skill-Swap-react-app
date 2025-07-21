import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Bell, Menu, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ArrowRight className="text-white text-sm rotate-90" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Skill Swap
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`transition-colors ${isActive("/") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
              Home
            </Link>
            <Link href="/browse" className={`transition-colors ${isActive("/browse") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
              Browse
            </Link>
            <Link href="/swaps" className={`transition-colors ${isActive("/swaps") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
              My Swaps
            </Link>
            <Link href="/profile" className={`transition-colors ${isActive("/profile") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
              Profile
            </Link>
            {user && user.isAdmin && (
              <Link href="/admin" className={`transition-colors ${isActive("/admin") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
                Admin
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* Profile Avatar */}
            <Link href="/profile">
              <img 
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName || 'U'}+${user?.lastName || 'ser'}&background=3b82f6&color=fff`}
                alt="User profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md cursor-pointer"
              />
            </Link>

            {/* Logout */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="hidden sm:inline-flex"
            >
              Logout
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className={`px-4 py-2 rounded-lg transition-colors ${isActive("/") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                Home
              </Link>
              <Link href="/browse" className={`px-4 py-2 rounded-lg transition-colors ${isActive("/browse") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                Browse
              </Link>
              <Link href="/swaps" className={`px-4 py-2 rounded-lg transition-colors ${isActive("/swaps") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                My Swaps
              </Link>
              <Link href="/profile" className={`px-4 py-2 rounded-lg transition-colors ${isActive("/profile") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                Profile
              </Link>
              {user && user.isAdmin && (
                <Link href="/admin" className={`px-4 py-2 rounded-lg transition-colors ${isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}>
                  Admin
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="mx-4 mt-2"
              >
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
