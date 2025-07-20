import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillTagProps {
  name: string;
  icon?: string;
  variant?: "offered" | "wanted" | "default";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function SkillTag({ 
  name, 
  icon, 
  variant = "default", 
  removable = false, 
  onRemove,
  className 
}: SkillTagProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "offered":
        return "gradient-primary text-white hover:shadow-lg";
      case "wanted":
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
      default:
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    }
  };

  return (
    <Badge 
      className={cn(
        "skill-tag px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300",
        getVariantStyles(),
        className
      )}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span>{name}</span>
      {removable && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
