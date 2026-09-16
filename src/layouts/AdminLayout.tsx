import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopHeader } from '../components/header/TopHeader';

export const AdminLayout: React.FC = () => {
  const [isOpenOnMobile, setIsOpenOnMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FAF7EB] text-[#18281B] flex flex-col font-sans selection:bg-[#18281B] selection:text-[#FFFFFF]">
      {/* Responsive Sidebar */}
      <Sidebar
        isOpenOnMobile={isOpenOnMobile}
        onCloseMobile={() => setIsOpenOnMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <TopHeader
          onOpenMobile={() => setIsOpenOnMobile(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />

        {/* Main Content Area */}
        <main id="admin-main-content" className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

