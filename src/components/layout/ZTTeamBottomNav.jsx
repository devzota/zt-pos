/** ZTTeam Bottom Navigation Bar Component Compact Slim UX */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function ZTTeamBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const ztteam_navItems = [
    { path: '/', label: 'Trang chủ', icon: 'home' },
    { path: '/orders', label: 'Đơn hàng', icon: 'receipt_long' },
    { path: '/stats', label: 'Thống kê', icon: 'query_stats' },
    { path: '/profile', label: 'Thực đơn', icon: 'restaurant_menu' },
    { path: '/settings', label: 'Cài đặt', icon: 'settings' }
  ];

  return (
    <nav className="bg-surface-container-low/95 dark:bg-surface-container-high/95 fixed bottom-0 w-full z-50 backdrop-blur-md shadow-md flex justify-around items-center px-1 py-0.5 pb-safe border-t border-outline-variant/20">
      {ztteam_navItems.map((item) => {
        const ztteam_isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center px-2 py-0.5 rounded-md active:scale-95 transition-all duration-200 cursor-pointer ${
              ztteam_isActive
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${ztteam_isActive ? 'icon-fill' : ''}`}>
              {item.icon}
            </span>
            <span className="font-label-md text-[9px] mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
