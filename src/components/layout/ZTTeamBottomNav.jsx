/** ZTTeam Bottom Navigation Bar Component Floating iOS 17 Style */
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
    <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none pb-safe">
      <nav className="pointer-events-auto bg-surface-container-lowest/85 dark:bg-surface-container-high/90 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-outline-variant/30 rounded-full flex items-center justify-around px-2 py-1.5 max-w-md w-full transition-all">
        {ztteam_navItems.map((item) => {
          const ztteam_isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-full active:scale-90 transition-all duration-200 cursor-pointer ${
                ztteam_isActive
                  ? 'bg-primary text-on-primary font-bold shadow-xs scale-105'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] ${ztteam_isActive ? 'icon-fill' : ''}`}>
                {item.icon}
              </span>
              <span className="font-label-md text-[9.5px] mt-0.5 whitespace-nowrap leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
