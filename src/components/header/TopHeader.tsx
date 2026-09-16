import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  onOpenMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { adminProfile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminName =
    adminProfile?.adminRecord?.full_name ||
    (user?.email === 'mdsohanali636@gmail.com' ? 'Md Sohan Ali' : user?.email?.split('@')[0]) ||
    'Md Sohan Ali';

  const roleName =
    adminProfile?.role?.name ||
    (typeof adminProfile?.adminRecord?.admin_roles === 'object' && adminProfile?.adminRecord?.admin_roles
      ? (adminProfile.adminRecord.admin_roles as any).name
      : null) ||
    'Super Admin';

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/admin/catalog/products?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header
      id="admin-top-header"
      className="sticky top-0 z-30 h-18 bg-[#FAF7EB]/95 backdrop-blur-xs border-b border-[#DED6BE]/80 px-4 md:px-8 flex items-center justify-between transition-colors"
    >
      {/* Left section: toggles & search bar matching PDF */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-md">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu"
          type="button"
          onClick={onOpenMobile}
          className="p-2 text-[#18281B] hover:bg-[#EDE7D4] rounded-lg lg:hidden transition-colors cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          id="btn-desktop-collapse"
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 text-[#5A6258] hover:text-[#18281B] hover:bg-[#EDE7D4] rounded-lg transition-colors cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Search Bar matching PDF Page 1 & 2 */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-sm">
          <Search className="w-4 h-4 text-[#7A8278] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-global-search"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-9 pr-4 py-2 bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] focus:bg-[#FFFFFF] border border-[#DED6BE] rounded-lg text-xs md:text-sm text-[#18281B] placeholder-[#8A9288] focus:outline-none focus:ring-1 focus:ring-[#18281B] focus:border-[#18281B] transition-all"
          />
        </form>
      </div>

      {/* Right section: Notification bell, User avatar pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell with indicator */}
        <button
          id="btn-header-notifications"
          type="button"
          className="relative p-2 text-[#5A6258] hover:text-[#18281B] hover:bg-[#EDE7D4] rounded-full transition-colors cursor-pointer"
          title="Notifications"
          onClick={() => navigate('/admin/orders')}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D97706] ring-2 ring-[#FAF7EB]" />
        </button>

        {/* User Profile Pill matching PDF */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btn-header-user-menu"
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-[#EDE7D4] transition-colors cursor-pointer group"
          >
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#18281B] text-[#FFFFFF] flex items-center justify-center font-sans text-xs font-semibold tracking-wider">
              {getInitials(adminName)}
            </div>

            {/* Name and Role */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-sans text-xs font-medium text-[#18281B] leading-tight truncate max-w-[140px]">
                {adminName}
              </span>
              <span className="font-sans text-[10px] text-[#6E736B] leading-none mt-0.5">
                {roleName}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[#6E736B] group-hover:text-[#18281B] transition-transform duration-200" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              id="header-user-dropdown"
              className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] rounded-xl border border-[#DED6BE] shadow-lg py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
            >
              <div className="px-4 py-2.5 border-b border-[#EBE4D2]">
                <p className="font-medium text-[#18281B] text-xs">{adminName}</p>
                <p className="text-[11px] text-[#6E736B] truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-[#FAF7EB] text-[#2D6636] font-medium text-[10px]">
                  {roleName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/admin/administration/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[#3D453E] hover:bg-[#FAF7EB] hover:text-[#18281B] transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#6E736B]" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/admin/administration/users');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[#3D453E] hover:bg-[#FAF7EB] hover:text-[#18281B] transition-colors text-left cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#6E736B]" />
                <span>Administration</span>
              </button>

              <div className="my-1 border-t border-[#EBE4D2]" />

              <button
                id="btn-dropdown-logout"
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[#DC2626] hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

