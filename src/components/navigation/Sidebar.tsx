import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Megaphone,
  FileText,
  Scissors,
  Truck,
  Mail,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  LucideIcon,
} from 'lucide-react';
import { MAIN_NAVIGATION, NavItem } from './navigationConfig';

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Package,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Megaphone,
  FileText,
  Scissors,
  Truck,
  Mail,
  ShieldCheck,
  Settings,
};

interface SidebarProps {
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenOnMobile,
  onCloseMobile,
  isCollapsed,
}) => {
  const location = useLocation();

  // State to track expanded accordion sub-items in sidebar
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Products: true,
  });

  const toggleSection = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isRouteActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (location.pathname.startsWith(item.path)) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => location.pathname.startsWith(child.path));
    }
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          id="admin-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#0C150E]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#18281B] text-[#FFFFFF] border-r border-[#223826] transition-all duration-300 ease-in-out
          ${isOpenOnMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#233A27]">
          {!isCollapsed ? (
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-[0.28em] text-[#FFFFFF] font-normal leading-none">
                E L I F
              </span>
              <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8FA896] font-medium mt-1.5">
                ADMIN
              </span>
            </div>
          ) : (
            <span className="font-serif text-2xl tracking-[0.15em] text-[#FFFFFF] mx-auto">
              E
            </span>
          )}

          {/* Close button for mobile */}
          <button
            id="admin-sidebar-close-mobile"
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-[#8FA896] hover:text-[#FFFFFF] lg:hidden focus:outline-none transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin">
          {MAIN_NAVIGATION.map((item) => {
            const IconComponent = ICON_MAP[item.iconName] || Package;
            const active = isRouteActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections[item.title];

            return (
              <div key={item.title} className="space-y-0.5">
                <div
                  className={`group relative flex items-center justify-between rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-[#2D4B36] text-[#FFFFFF] font-medium shadow-xs'
                      : 'text-[#C5D4CB] hover:text-[#FFFFFF] hover:bg-[#203324]'
                  }`}
                >
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className="flex-1 flex items-center gap-3 px-3.5 py-2.5 text-sm tracking-wide"
                    title={item.title}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? 'text-[#FFFFFF]' : 'text-[#8EA898] group-hover:text-[#FFFFFF]'
                      }`}
                    />
                    {!isCollapsed && <span className="font-sans text-[13px]">{item.title}</span>}
                  </NavLink>

                  {/* Expand / collapse trigger for items with sub-sections */}
                  {!isCollapsed && hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleSection(item.title, e)}
                      className="p-2 text-[#8FA896] hover:text-white transition-colors cursor-pointer"
                      aria-label={`Toggle ${item.title}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-items (nested links like inventory, categories, etc.) */}
                {!isCollapsed && hasChildren && isExpanded && (
                  <div className="ml-5 pl-3 border-l border-[#2B4533] space-y-0.5 py-1">
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.title}
                        to={child.path}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-md font-sans text-xs tracking-wide transition-colors ${
                            isActive
                              ? 'text-[#FFFFFF] bg-[#223927] font-medium'
                              : 'text-[#9CB3A5] hover:text-[#FFFFFF] hover:bg-[#1E3022]'
                          }`
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer matching PDF */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-[#233A27] flex items-center justify-between text-xs text-[#8FA896]">
            <div>
              <span className="font-medium text-[#D1DFD6] block text-[11px]">ELIF Admin Panel</span>
              <span className="text-[10px] text-[#789380]">v1.0.0</span>
            </div>
            <NavLink
              to="/admin/administration/settings"
              onClick={onCloseMobile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-[#A6BCB0] hover:text-white hover:bg-[#203324] transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </NavLink>
          </div>
        ) : (
          <div className="p-3 border-t border-[#233A27] flex justify-center">
            <NavLink
              to="/admin/administration/settings"
              onClick={onCloseMobile}
              className="p-2 text-[#8FA896] hover:text-white hover:bg-[#203324] rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
};

