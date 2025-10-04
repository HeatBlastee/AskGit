"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Search, User as UserIcon, Settings, LogOut } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "../AuthProvider";
import { Spinner } from "../Spinner";
import { useGlobalLoading } from "../LoaderProvider";
import { useEffect } from "react";
import { User } from "@/hooks/use-auth";

// Helper for getting user initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('');
};

export const Navbar = ({ user }: { user: User | null }) => {
    
    
    return (
        <header className="sticky top-0 z-10 w-full h-16 px-4 md:px-6 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xs sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search projects, files..."
                    className="w-full pl-10 rounded-lg border-input bg-background/70 shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
            </div>

            {/* User Navigation */}
            <div className="ml-4">
                <UserNav user={user} />
            </div>
        </header>
    );
};



const UserNav = ({ user }: { user: User | null }) => {
    const router = useRouter();

    if (!user) {
        return null;
    }

    const userName = user.name || "User";
    const userEmail = user.email || "";

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/signout", { method: "POST" });
            if (res.ok) {
                toast.success("Logged out successfully");
                router.push("/login"); // redirect to login page
                router.refresh(); // refresh state
            } else {
                toast.error("Failed to log out");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    {user.imageUrl ? (
                                    <img
                                        className="rounded-full"
                                        height={30}
                                        width={30}
                                        src={user.imageUrl}
                                        alt={user.name}
                                    />
                                ) :
                    <Avatar className="h-9 w-9 border">
                        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserNav;
