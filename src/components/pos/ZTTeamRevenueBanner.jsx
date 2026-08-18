/** ZTTeam Revenue Banner Component Realtime Growth Calculation */
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db } from '../../db/ztteam_database';

export function ZTTeamRevenueBanner() {
  /** Calculate Today and Yesterday Total Revenue Realtime */
  const ztteam_revenueStats = useLiveQuery(async () => {
    const ztteam_today = new Date();
    const ztteam_yesterday = new Date();
    ztteam_yesterday.setDate(ztteam_today.getDate() - 1);

    const ztteam_todayStr = ztteam_today.toISOString().split('T')[0];
    const ztteam_yesterdayStr = ztteam_yesterday.toISOString().split('T')[0];

    const ztteam_orders = await ztteam_db.orders.toArray();

    const ztteam_todayOrders = ztteam_orders.filter(
      (o) => o.createdAt && o.createdAt.startsWith(ztteam_todayStr) && o.status === 'completed'
    );
    const ztteam_yesterdayOrders = ztteam_orders.filter(
      (o) => o.createdAt && o.createdAt.startsWith(ztteam_yesterdayStr) && o.status === 'completed'
    );

    const ztteam_todayRev = ztteam_todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const ztteam_yesterdayRev = ztteam_yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    let ztteam_growthPercent = 0;
    if (ztteam_yesterdayRev > 0) {
      ztteam_growthPercent = Math.round(((ztteam_todayRev - ztteam_yesterdayRev) / ztteam_yesterdayRev) * 100);
    } else if (ztteam_todayRev > 0) {
      ztteam_growthPercent = 100;
    }

    return {
      todayRevenue: ztteam_todayRev,
      growthPercent: ztteam_growthPercent
    };
  }, []);

  const ztteam_formattedRevenue = ztteam_revenueStats
    ? new Intl.NumberFormat('vi-VN').format(ztteam_revenueStats.todayRevenue) + 'đ'
    : '0đ';

  const ztteam_formattedDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short'
  });

  const ztteam_growth = ztteam_revenueStats?.growthPercent || 0;

  return (
    <section className="bg-secondary-fixed/50 backdrop-blur-sm rounded-lg p-2.5 shadow-xs border border-outline-variant/20 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-label-md text-[11px] text-primary font-semibold uppercase tracking-wide">
            Doanh thu hôm nay
          </span>
          <span className="font-label-md text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.5 rounded-full border border-outline-variant/30">
            {ztteam_formattedDate}
          </span>
        </div>
        <div className="font-display-md text-[20px] leading-tight text-primary font-bold">
          {ztteam_formattedRevenue}
        </div>
      </div>

      <div className="text-right">
        <span className={`font-body-md text-[12px] font-semibold flex items-center justify-end ${ztteam_growth >= 0 ? 'text-on-tertiary-container' : 'text-error'}`}>
          <span className="material-symbols-outlined text-[14px]">
            {ztteam_growth >= 0 ? 'arrow_upward' : 'arrow_downward'}
          </span>
          {ztteam_growth > 0 ? `+${ztteam_growth}%` : `${ztteam_growth}%`}
        </span>
      </div>
    </section>
  );
}
