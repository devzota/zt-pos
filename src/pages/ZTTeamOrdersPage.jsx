/** ZTTeam Orders History Page with Date Filter & Summary Stats Cards */
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db, ztteam_getLocalDateStr } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import { ztteam_useNotification } from '../stores/ztteam_notificationContext';

export function ZTTeamOrdersPage() {
  const { ztteam_showToast, ztteam_showConfirm } = ztteam_useNotification();

  /** Date filter states in Local Timezone */
  const [ztteam_filterMode, setZtteam_filterMode] = useState('today');
  const [ztteam_selectedDate, setZtteam_selectedDate] = useState(() => {
    return ztteam_getLocalDateStr();
  });

  /** Date helper strings */
  const ztteam_getTodayStr = () => ztteam_getLocalDateStr();
  const ztteam_getYesterdayStr = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return ztteam_getLocalDateStr(yesterday);
  };

  /** Query Orders & calculate summary stats from Dexie IndexedDB */
  const ztteam_ordersData = useLiveQuery(async () => {
    const allOrders = await ztteam_db.orders.reverse().toArray();
    let filteredOrders = allOrders;

    if (ztteam_filterMode === 'today') {
      const todayStr = ztteam_getTodayStr();
      filteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === todayStr);
    } else if (ztteam_filterMode === 'yesterday') {
      const yesterdayStr = ztteam_getYesterdayStr();
      filteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === yesterdayStr);
    } else if (ztteam_filterMode === 'custom') {
      filteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === ztteam_selectedDate);
    }

    /** Calculate totals for filtered orders */
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalItems = filteredOrders.reduce((sum, order) => {
      const orderItems = order.totalItems || order.items?.reduce((s, item) => s + (item.quantity || 1), 0) || 1;
      return sum + orderItems;
    }, 0);

    return {
      orders: filteredOrders,
      totalRevenue,
      totalItems,
      orderCount: filteredOrders.length
    };
  }, [ztteam_filterMode, ztteam_selectedDate]);

  /** Delete Order with Custom Confirm Modal */
  const ztteam_handleDeleteOrder = (orderId) => {
    ztteam_showConfirm({
      title: 'Xóa đơn hàng',
      message: `Bạn có chắc chắn muốn xóa đơn hàng #${orderId} này khỏi hệ thống?`,
      confirmText: 'Xóa đơn',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        await ztteam_db.orders.delete(orderId);
        ztteam_showToast(`Đã xóa thành công đơn hàng #${orderId}`);
      }
    });
  };

  const ztteam_formattedRevenue = ztteam_ordersData
    ? new Intl.NumberFormat('vi-VN').format(ztteam_ordersData.totalRevenue) + 'đ'
    : '0đ';

  return (
    <ZTTeamLayout ztteam_title="Quản lý đơn hàng">
      <div className="space-y-md max-w-2xl mx-auto">
        {/** Date Filter Header & Custom Date Picker */}
        <div className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high space-y-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
            <h2 className="font-title-lg text-[18px] text-primary font-bold">Lịch sử đơn hàng</h2>

            <div className="flex flex-wrap items-center gap-xs">
              <button
                onClick={() => setZtteam_filterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all ${
                  ztteam_filterMode === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setZtteam_filterMode('today')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all ${
                  ztteam_filterMode === 'today'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setZtteam_filterMode('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all ${
                  ztteam_filterMode === 'yesterday'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Hôm qua
              </button>
              <div className="flex items-center gap-1 bg-surface-container border border-surface-container-high rounded-lg px-2 py-1">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                <input
                  type="date"
                  value={ztteam_selectedDate}
                  onChange={(e) => {
                    setZtteam_selectedDate(e.target.value);
                    setZtteam_filterMode('custom');
                  }}
                  className="bg-transparent font-title-lg text-[12px] text-on-surface outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/** Summary Bento Cards (Tổng số lượng & Giá tiền) */}
        <div className="grid grid-cols-2 gap-sm">
          {/** Card 1: Total Revenue */}
          <div className="bg-secondary-fixed rounded-xl p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[11px] text-on-secondary-container uppercase tracking-wider font-semibold">
              Tổng doanh thu
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[22px] text-primary font-bold block">
                {ztteam_formattedRevenue}
              </span>
            </div>
          </div>

          {/** Card 2: Total Orders & Items Count */}
          <div className="bg-surface-container rounded-xl p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Tổng đơn / Số lượng món
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[20px] text-on-surface font-bold">
                {ztteam_ordersData?.orderCount || 0} <span className="text-[12px] font-normal">đơn</span>
                <span className="text-[14px] text-primary ml-1.5 font-semibold">({ztteam_ordersData?.totalItems || 0} món)</span>
              </span>
            </div>
          </div>
        </div>

        {/** Orders List */}
        {!ztteam_ordersData ? (
          <div className="text-center py-8 text-outline">Đang tải danh sách đơn hàng...</div>
        ) : ztteam_ordersData.orders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant shadow-soft border border-surface-container-high">
            <span className="material-symbols-outlined text-[48px] text-outline mb-2">receipt_long</span>
            <p className="font-body-lg">Chưa có đơn hàng nào trong khoảng thời gian này.</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {ztteam_ordersData.orders.map((order) => {
              const ztteam_formattedDate = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              });
              const ztteam_formattedTotal = new Intl.NumberFormat('vi-VN').format(order.totalAmount) + 'đ';

              return (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest rounded-xl p-md shadow-soft border border-surface-container-high flex flex-col gap-sm"
                >
                  <div className="flex justify-between items-center border-b border-surface-container-high pb-sm">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
                      <span className="font-title-lg text-[15px] font-bold text-primary">
                        Đơn #{order.id}
                      </span>
                      <span className="text-[12px] text-outline ml-2">{ztteam_formattedDate}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-[10px] font-semibold">
                      Hoàn thành
                    </span>
                  </div>

                  {/** Items list in order */}
                  <div className="space-y-xs py-xs">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[14px]">
                        <span className="font-body-md text-on-surface">
                          {item.quantity}x {item.productName} ({item.packaging})
                          {item.note && <span className="text-outline text-[12px] italic block">Ghi chú: {item.note}</span>}
                        </span>
                        <span className="font-semibold text-primary">
                          {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                        </span>
                      </div>
                    ))}
                  </div>

                  {/** Footer of order card */}
                  <div className="flex justify-between items-center border-t border-surface-container-high pt-sm mt-xs">
                    <button
                      onClick={() => ztteam_handleDeleteOrder(order.id)}
                      className="text-error hover:opacity-80 text-[12px] flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span> Xóa đơn
                    </button>
                    <div className="text-right">
                      <span className="text-[12px] text-on-surface-variant mr-2">Tổng tiền:</span>
                      <span className="font-display-md text-[18px] text-primary font-bold">
                        {ztteam_formattedTotal}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ZTTeamLayout>
  );
}
