import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-20 w-20 text-2xl" };

export function Avatar({ src, username, size = "md", className }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={username}
        className={cn("rounded-full object-cover ring-1 ring-glass-border", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-orange/30 font-semibold text-white ring-1 ring-glass-border",
        sizes[size],
        className
      )}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}
