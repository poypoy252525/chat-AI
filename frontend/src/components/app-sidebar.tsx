import * as React from "react";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
interface NavItem {
  title: string;
  url: string;
  isActive?: boolean;
}

interface NavGroup {
  title?: string;
  url: string;
  items: NavItem[];
}

const data: {
  versions: string[];
  navMain: NavGroup[];
} = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      url: "#",
      items: [
        {
          title: "New chat",
          url: "#",
        },
      ],
    },
    {
      title: "Chat History",
      url: "#",
      items: [
        {
          title: "How to build a chat app",
          url: "#",
        },
        {
          title: "React vs Vue in 2024",
          url: "#",
          isActive: true,
        },
        {
          title: "Deep learning tutorial",
          url: "#",
        },
        {
          title: "Best pizza in Rome",
          url: "#",
        },
        {
          title: "TypeScript advanced patterns",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title || group.url}>
            {group.title && (
              <SidebarGroupLabel className="font-bold">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item: NavItem) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
