import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}