import * as React from "react";

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
import chatService, { type Conversation } from "@/services/chat-service";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { VersionSwitcher } from "./version-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);

  const location = useLocation();

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const data = await chatService.getChatHistory();
        setChatHistory(data?.results || []);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setChatHistory([]);
      }
    };
    fetchChatHistory();
  }, [location.pathname]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <SquarePen />
                    <span>New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatHistory.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === `/chat/${conversation.id}`}
                  >
                    <Link to={`/chat/${conversation.id}`}>
                      <span>{conversation.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* We create a SidebarGroup for each parent. */}
        {/* {data.navMain.map((group) => (
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
        ))} */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
