"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, JSX } from "react";
import { useProject, Project } from "../ProjectProvider";

// UI Components
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import {
    LayoutDashboard,
    MessageCircle,
    Users,
    FolderKanban,
    PanelLeftClose,
    PanelRightClose,
    PlusCircle
} from "lucide-react";

// Helper for cleaner class names
import { cn } from "@/lib/utils";

// Types
interface SidebarLinkProps {
    href: string;
    label: string;
    icon: JSX.Element;
    collapsed: boolean;
    active?: boolean;
    onClick?: () => void;
    isButton?: boolean;
}

interface SidebarCompProps {
    projects?: Project[];
    setProjectId: (id: string) => void;
    isLoading: boolean;
}

// Data structure for main navigation links
const mainNavLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/qa", label: "Q&A", icon: MessageCircle },
    { href: "/meetings", label: "Meetings", icon: Users },
];

export const SidebarComp = ({ projects, setProjectId, isLoading }: SidebarCompProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    
    const isActive = (path: string) => pathname === path;

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex flex-col glass border-r h-screen transition-all duration-500 ease-in-out z-40 overflow-hidden",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className="flex items-center h-20 p-6 border-b border-white/5">
                    {!collapsed && (
                        <div className="text-2xl font-black text-gradient tracking-tighter mr-auto">
                            askGit<span className="text-secondary rotate-12 inline-block">.</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                        {collapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-1 p-3 space-y-6 overflow-y-auto no-scrollbar">
                    <nav className="space-y-1">
                        {!collapsed && (
                            <h3 className="px-4 text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-[0.2em] opacity-50">
                                Main Menu
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {mainNavLinks.map((link) => (
                                <li key={link.href}>
                                    <SidebarLink
                                        href={link.href}
                                        label={link.label}
                                        icon={<link.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />}
                                        collapsed={collapsed}
                                        active={isActive(link.href)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="space-y-1">
                        {!collapsed && (
                            <h3 className="px-4 text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-[0.2em] opacity-50">
                                Projects
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {isLoading ? (
                                <div className="space-y-2 px-4">
                                    <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
                                    <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
                                </div>
                            ) : (
                                projects?.map((proj) => (
                                    <li key={proj.id}>
                                        <SidebarLink
                                            href={`/project/${proj.id}`}
                                            label={proj.name}
                                            icon={<FolderKanban className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />}
                                            collapsed={collapsed}
                                            active={pathname.includes(`/project/${proj.id}`)}
                                            onClick={() => setProjectId(proj.id)}
                                        />
                                    </li>
                                ))
                            )}
                        </ul>
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 mt-auto border-t border-white/5">
                    <SidebarLink
                        href="/create"
                        label="New Project"
                        icon={<PlusCircle className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />}
                        collapsed={collapsed}
                        isButton
                    />
                </div>
            </aside>
        </TooltipProvider>
    );
};


const SidebarLink = ({ href, label, icon, collapsed, active, onClick, isButton = false }: SidebarLinkProps) => {
    const commonClasses = "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 w-full relative overflow-hidden";
    const activeClasses = "bg-primary/15 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)] before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:bg-primary before:rounded-full";
    const inactiveClasses = "text-muted-foreground hover:bg-white/5 hover:text-foreground";
    const buttonClasses = "bg-primary text-primary-foreground hover:shadow-[0_0_25px_oklch(var(--primary)/0.4)] hover:scale-[1.02] active:scale-95";

    const linkContent = (
        <>
            <div className={cn("relative z-10 transition-transform duration-300", active && "scale-110")}>
                {icon}
            </div>
            {!collapsed && (
                <span className="relative z-10 whitespace-nowrap transition-all duration-300">
                    {label}
                </span>
            )}
        </>
    );

    const linkElement = (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                commonClasses,
                isButton ? buttonClasses : (active ? activeClasses : inactiveClasses),
                collapsed && "justify-center px-0"
            )}
        >
            {linkContent}
            {active && !isButton && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
            )}
        </Link>
    );

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={15} className="glass border-white/10 font-bold px-3 py-1.5 text-xs">
                    {label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return linkElement;
};