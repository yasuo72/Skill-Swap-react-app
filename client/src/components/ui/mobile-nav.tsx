import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Home, Search, ArrowLeftRight, MessageSquare, User } from "lucide-react";

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 h-16">
        <Link href="/" className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/") ? "text-blue-600" : "text-gray-600"
          }`}>
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Home</span>
        </Link>
        
        <Link href="/browse" className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/browse") ? "text-blue-600" : "text-gray-600"
          }`}>
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs">Browse</span>
        </Link>
        
        <Link href="/swaps" className={`flex flex-col items-center justify-center transition-colors relative ${
            isActive("/swaps") ? "text-blue-600" : "text-gray-600"
          }`}>
          <ArrowLeftRight className="h-5 w-5 mb-1" />
          <span className="text-xs">Swaps</span>
          <Badge variant="destructive" className="absolute -top-1 -right-1 w-4 h-4 text-xs p-0 flex items-center justify-center">
            3
          </Badge>
        </Link>
        
        <button className="flex flex-col items-center justify-center text-gray-600 relative">
          <MessageSquare className="h-5 w-5 mb-1" />
          <span className="text-xs">Messages</span>
          <Badge variant="destructive" className="absolute -top-1 -right-1 w-4 h-4 text-xs p-0 flex items-center justify-center">
            2
          </Badge>
        </button>
        
        <Link href="/profile" className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/profile") ? "text-blue-600" : "text-gray-600"
          }`}>
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
}
