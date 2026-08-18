/** ZTTeam Header Component compact mobile layout with dynamic store name */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db } from '../../db/ztteam_database';
import { ztteam_useCart } from '../../stores/ztteam_cartContext';

export function ZTTeamHeader() {
  const navigate = useNavigate();
  const { ztteam_totalItemsCount } = ztteam_useCart();

  /** Query Store Name from Dexie IndexedDB */
  const ztteam_storeNameSetting = useLiveQuery(async () => {
    const setting = await ztteam_db.settings.get('storeName');
    return setting?.value || '';
  }, []);

  const ztteam_displayTitle = ztteam_storeNameSetting || 'Bán Hàng POS';

  return (
    <header className="bg-surface dark:bg-surface-dim docked full-width top-0 flat no-shadows flex justify-between items-center w-full px-4 py-1.5 sticky z-40 border-b border-outline-variant/20">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-primary-container shrink-0">
          <span className="material-symbols-outlined text-[18px] text-primary">store</span>
        </div>
        <h1 className="font-title-lg text-[16px] text-primary font-bold truncate max-w-[200px]">
          {ztteam_displayTitle}
        </h1>
      </div>

      <button
        onClick={() => navigate('/orders')}
        className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform text-primary dark:text-primary-fixed-dim relative"
        aria-label="Giỏ hàng và Đơn hàng"
      >
        <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
        {ztteam_totalItemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-on-error rounded-full w-4 h-4 flex items-center justify-center font-label-md text-[9px] font-bold shadow-md">
            {ztteam_totalItemsCount}
          </span>
        )}
      </button>
    </header>
  );
}
