/** ZTTeam Statistics & Dashboard Page 100% Dynamic Database Categories & Realtime Charts */
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

/** Register ChartJS components */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function ZTTeamStatsPage() {
  /** Query statistics real-time from Dexie IndexedDB */
  const ztteam_statsData = useLiveQuery(async () => {
    const ztteam_today = new Date();
    const ztteam_yesterday = new Date();
    ztteam_yesterday.setDate(ztteam_today.getDate() - 1);

    const ztteam_todayStr = ztteam_today.toISOString().split('T')[0];
    const ztteam_yesterdayStr = ztteam_yesterday.toISOString().split('T')[0];

    const ztteam_orders = await ztteam_db.orders.toArray();
    const ztteam_dbCategories = await ztteam_db.categories.toArray();

    /** Filter categories excluding 'all' */
    const ztteam_activeCategories = ztteam_dbCategories.filter(c => c.key !== 'all');

    /** Today orders filter */
    const ztteam_todayOrders = ztteam_orders.filter(
      (o) => o.createdAt && o.createdAt.startsWith(ztteam_todayStr)
    );
    const ztteam_yesterdayOrders = ztteam_orders.filter(
      (o) => o.createdAt && o.createdAt.startsWith(ztteam_yesterdayStr)
    );

    const ztteam_todayRevenue = ztteam_todayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const ztteam_yesterdayRevenue = ztteam_yesterdayOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    let ztteam_growthPercent = 0;
    if (ztteam_yesterdayRevenue > 0) {
      ztteam_growthPercent = Math.round(((ztteam_todayRevenue - ztteam_yesterdayRevenue) / ztteam_yesterdayRevenue) * 100);
    } else if (ztteam_todayRevenue > 0) {
      ztteam_growthPercent = 100;
    }

    /** Realtime Weekly Sales calculation (T2 - CN) */
    const ztteam_weeklySales = [0, 0, 0, 0, 0, 0, 0];
    
    ztteam_orders.forEach((order) => {
      if (order.createdAt) {
        const dateObj = new Date(order.createdAt);
        const day = dateObj.getDay();
        /** Convert JS Sunday=0 to Index: T2=0, T3=1, T4=2, T5=3, T6=4, T7=5, CN=6 */
        const dayIdx = day === 0 ? 6 : day - 1;
        const totalItemsInOrder = order.totalItems || order.items?.reduce((s, i) => s + i.quantity, 0) || 1;
        ztteam_weeklySales[dayIdx] += totalItemsInOrder;
      }
    });

    /** Realtime Category Breakdown matching Database Categories */
    const ztteam_categoryMap = {};
    ztteam_activeCategories.forEach(cat => {
      ztteam_categoryMap[cat.key] = { label: cat.label, count: 0 };
    });

    /** Match order items with category map */
    const ztteam_products = await ztteam_db.products.toArray();
    const ztteam_productCatLookup = {};
    ztteam_products.forEach(p => {
      ztteam_productCatLookup[p.name.toLowerCase()] = p.category;
    });

    ztteam_orders.forEach((order) => {
      order.items?.forEach((item) => {
        const pName = (item.productName || '').toLowerCase();
        const catKey = ztteam_productCatLookup[pName] || 'coffee';
        if (ztteam_categoryMap[catKey]) {
          ztteam_categoryMap[catKey].count += item.quantity || 1;
        }
      });
    });

    const ztteam_categoryLabels = ztteam_activeCategories.map(c => c.label);
    const ztteam_categoryCounts = ztteam_activeCategories.map(c => ztteam_categoryMap[c.key]?.count || 0);

    return {
      todayRevenue: ztteam_todayRevenue,
      todayOrderCount: ztteam_todayOrders.length,
      growthPercent: ztteam_growthPercent,
      weeklySales: ztteam_weeklySales,
      categoryLabels: ztteam_categoryLabels,
      categoryCounts: ztteam_categoryCounts,
      hasOrders: ztteam_orders.length > 0
    };
  }, []);

  const ztteam_revenueStr = ztteam_statsData
    ? new Intl.NumberFormat('vi-VN').format(ztteam_statsData.todayRevenue)
    : '0';

  /** Bar Chart Data (Weekly Sales 100% Realtime) */
  const ztteam_barChartData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Số lượng bán',
        data: ztteam_statsData?.weeklySales || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#4b2c20',
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  };

  /** Bar Chart Options */
  const ztteam_barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#efe6e4',
        titleColor: '#1f1b19',
        bodyColor: '#1f1b19',
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#504440', font: { family: 'Montserrat', size: 12 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#504440', font: { family: 'Montserrat', size: 12 } }
      }
    }
  };

  /** Color palette for dynamic categories */
  const ztteam_colors = ['#4b2c20', '#bf9282', '#efe0cd', '#8ca55a', '#b6d081'];

  /** Doughnut Chart Data (100% Dynamic from Database Categories) */
  const ztteam_doughnutChartData = {
    labels: ztteam_statsData?.categoryLabels || [],
    datasets: [
      {
        data: ztteam_statsData?.hasOrders ? ztteam_statsData.categoryCounts : (ztteam_statsData?.categoryCounts.map(() => 0) || []),
        backgroundColor: ztteam_colors.slice(0, ztteam_statsData?.categoryLabels.length || 1),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  /** Doughnut Chart Options */
  const ztteam_doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false }
    }
  };

  const ztteam_growth = ztteam_statsData?.growthPercent || 0;

  return (
    <ZTTeamLayout ztteam_title="Thống kê">
      <div className="flex flex-col gap-md max-w-5xl mx-auto w-full">
        {/** Page Title & Date Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-xs">
          <div>
            <h1 className="font-display-lg-mobile text-[22px] text-primary font-bold">
              Thống kê Doanh Thu
            </h1>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Tự động tính toán từ đơn hàng thực tế
            </p>
          </div>
        </div>

        {/** Bento Grid: Key Metrics */}
        <div className="grid grid-cols-2 gap-sm">
          {/** Total Revenue Card */}
          <div className="bg-secondary-fixed rounded-xl p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[11px] text-on-secondary-container uppercase tracking-wider font-semibold">
              Doanh thu hôm nay
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[22px] text-primary font-bold block">
                {ztteam_revenueStr} <span className="text-[12px]">đ</span>
              </span>
              <span className={`text-[12px] font-semibold flex items-center gap-0.5 mt-0.5 ${ztteam_growth >= 0 ? 'text-on-tertiary-container' : 'text-error'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {ztteam_growth >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {ztteam_growth > 0 ? `+${ztteam_growth}% so với hôm qua` : `${ztteam_growth}% so với hôm qua`}
              </span>
            </div>
          </div>

          {/** Total Orders Card */}
          <div className="bg-surface-container rounded-xl p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Đơn hàng hôm nay
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[22px] text-on-surface font-bold">
                {ztteam_statsData?.todayOrderCount || 0} <span className="text-[12px]">đơn</span>
              </span>
            </div>
          </div>
        </div>

        {/** Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mt-sm">
          {/** Weekly Sales Chart (Bar) */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-xs lg:col-span-2 border border-surface-container-high">
            <div className="flex justify-between items-center mb-sm">
              <h2 className="font-headline-sm text-[15px] text-on-surface font-bold">
                Sản phẩm bán ra trong tuần
              </h2>
            </div>
            <div className="relative h-56 w-full">
              <Bar data={ztteam_barChartData} options={ztteam_barChartOptions} />
            </div>
          </div>

          {/** Top Products Chart (Doughnut) */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high">
            <div className="flex justify-between items-center mb-sm">
              <h2 className="font-headline-sm text-[15px] text-on-surface font-bold">Tỷ lệ theo danh mục</h2>
            </div>

            {ztteam_statsData?.categoryLabels.length === 0 ? (
              <div className="text-center py-10 text-outline text-[12px]">Chưa tạo danh mục sản phẩm.</div>
            ) : (
              <>
                <div className="relative h-40 w-full flex justify-center">
                  <Doughnut data={ztteam_doughnutChartData} options={ztteam_doughnutChartOptions} />
                </div>
                <div className="mt-sm flex flex-col gap-1 text-[13px]">
                  {ztteam_statsData?.categoryLabels.map((label, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ztteam_colors[idx % ztteam_colors.length] }}
                        ></div>
                        <span>{label}</span>
                      </div>
                      <span className="font-semibold">{ztteam_statsData?.categoryCounts[idx] || 0}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ZTTeamLayout>
  );
}
