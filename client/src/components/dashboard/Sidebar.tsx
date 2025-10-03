"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProject } from "../ProjectProvider";

// UI Components (assuming shadcn/ui)
import { Button } from "@/components/ui/button";
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
import { Project } from "@prisma/client";

// Data structure for main navigation links
const mainNavLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/qa", label: "Q&A", icon: MessageCircle },
    { href: "/meetings", label: "Meetings", icon: Users }, // Using a more appropriate icon
];

export const SidebarComp = ({projects,setProjectId,isLoading}) => {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    
    const isActive = (path: string) => pathname === path;

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex flex-col bg-card/90 backdrop-blur-md border-r border-border shadow-lg transition-[width] duration-300 ease-in-out",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className="flex items-center h-16 p-4 border-b border-border">
                    {!collapsed && <div className="text-2xl font-extrabold text-primary mr-auto">askGit</div>}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        {collapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-1 p-2 overflow-y-auto">
                    <nav className="flex-1 space-y-1">
                        {/* Main Navigation */}
                        <ul className="space-y-1">
                            {mainNavLinks.map((link) => (
                                <li key={link.href}>
                                    <SidebarLink
                                        href={link.href}
                                        label={link.label}
                                        icon={<link.icon className="h-5 w-5" />}
                                        collapsed={collapsed}
                                        active={isActive(link.href)}
                                    />
                                </li>
                            ))}
                        </ul>

                        <hr className={cn("my-4 border-border", collapsed && "mx-auto w-1/2")} />

                        {/* Projects Section */}
                        {!collapsed && (
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                Projects
                            </h3>
                        )}

                        <ul className="space-y-1">
                            {projects?.map((proj) => (
                                <li key={proj.id}>
                                    <SidebarLink
                                        href={`/project/${proj.id}`}
                                        label={proj.name}
                                        icon={<FolderKanban className="h-5 w-5" />}
                                        collapsed={collapsed}
                                        active={pathname.includes(`/project/${proj.id}`)}
                                        onClick={() => setProjectId(proj.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer - Create Project Button */}
                    <div className="mt-4">
                        <SidebarLink
                            href="/create"
                            label="New Project"
                            icon={<PlusCircle className="h-5 w-5" />}
                            collapsed={collapsed}
                            isButton
                        />
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    );
};


// A reusable Sidebar Link component for cleaner code
const SidebarLink = ({ href, label, icon, collapsed, active, onClick, isButton = false }) => {
    const commonClasses = "flex items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full";
    const activeClasses = "bg-primary/10 text-primary";
    const inactiveClasses = "text-foreground hover:bg-muted hover:text-foreground";

    const linkContent = (
        <>
            {icon}
            <span className={cn("whitespace-nowrap transition-opacity", collapsed ? "opacity-0" : "opacity-100")}>
                {label}
            </span>
        </>
    );

    const linkElement = (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                commonClasses,
                active ? activeClasses : inactiveClasses,
                isButton && "bg-primary text-primary-foreground hover:bg-primary/90",
                collapsed && "justify-center"
            )}
        >
            {linkContent}
        </Link>
    );

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                    {label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return linkElement;
};