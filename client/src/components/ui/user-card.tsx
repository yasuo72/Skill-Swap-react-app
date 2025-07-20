import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SkillTag from "./skill-tag";
import { ArrowLeftRight, Clock, Star } from "lucide-react";

interface UserCardProps {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    profileImageUrl?: string;
    skillsOffered?: Array<{ skill: { name: string; icon?: string } }>;
    skillsWanted?: Array<{ skill: { name: string; icon?: string } }>;
    availability?: string[];
    averageRating?: number;
    totalSwaps?: number;
  };
  onRequestSwap?: (userId: string) => void;
}

export default function UserCard({ user, onRequestSwap }: UserCardProps) {
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = fullName || 'Unknown User';
  const profileImage = user.profileImageUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <CardContent className="p-6">
        {/* User Info */}
        <div className="flex items-center mb-4">
          <img 
            src={profileImage}
            alt={`${displayName} profile`}
            className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-gray-100"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
            <p className="text-gray-600">{user.title || 'Skill Swapper'}</p>
            {user.averageRating && (
              <div className="flex items-center mt-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(user.averageRating!) ? 'fill-current' : ''}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm ml-2">
                  {user.averageRating.toFixed(1)} ({user.totalSwaps || 0} swaps)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Skills Offered */}
        {user.skillsOffered && user.skillsOffered.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Offers:</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered.slice(0, 3).map((userSkill, index) => (
                <SkillTag 
                  key={index}
                  name={userSkill.skill.name}
                  icon={userSkill.skill.icon}
                  variant="offered"
                />
              ))}
              {user.skillsOffered.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.skillsOffered.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Skills Wanted */}
        {user.skillsWanted && user.skillsWanted.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Wants:</h4>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted.slice(0, 3).map((userSkill, index) => (
                <SkillTag 
                  key={index}
                  name={userSkill.skill.name}
                  icon={userSkill.skill.icon}
                  variant="wanted"
                />
              ))}
              {user.skillsWanted.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.skillsWanted.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Availability */}
        {user.availability && user.availability.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>{user.availability.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full gradient-primary text-white border-0 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          onClick={() => onRequestSwap?.(user.id)}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Request Swap
        </Button>
      </CardContent>
    </Card>
  );
}
