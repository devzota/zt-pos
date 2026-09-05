/** ZTTeam Orders History Page with Date Filter, Debt Management & Summary Stats Cards */
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

  /** Debt Payment Status Filter State ('all' | 'paid' | 'debt') */
  const [ztteam_paymentFilter, setZtteam_paymentFilter] = useState('all');

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
    let dateFilteredOrders = allOrders;

    /** 1. Filter by Date */
    if (ztteam_filterMode === 'today') {
      const todayStr = ztteam_getTodayStr();
      dateFilteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === todayStr);
    } else if (ztteam_filterMode === 'yesterday') {
      const yesterdayStr = ztteam_getYesterdayStr();
      dateFilteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === yesterdayStr);
    } else if (ztteam_filterMode === 'custom') {
      dateFilteredOrders = allOrders.filter((o) => o.createdAt && ztteam_getLocalDateStr(o.createdAt) === ztteam_selectedDate);
    }

    /** Calculate Debt Metrics for the date-filtered range */
    const totalGrossRevenue = dateFilteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalDebtAmount = dateFilteredOrders.reduce((sum, order) => sum + (order.debtAmount || 0), 0);
    const totalCollectedRevenue = dateFilteredOrders.reduce((sum, order) => {
      if (order.paidAmount !== undefined) return sum + order.paidAmount;
      return sum + (order.totalAmount || 0); /** Fallback for legacy orders without paidAmount field */
    }, 0);

    const totalUnpaidOrdersCount = dateFilteredOrders.filter(
      (o) => (o.debtAmount && o.debtAmount > 0) || o.paymentStatus === 'unpaid' || o.paymentStatus === 'partial'
    ).length;

    /** 2. Filter by Payment Status Sub-tab */
    let finalOrders = dateFilteredOrders;
    if (ztteam_paymentFilter === 'paid') {
      finalOrders = dateFilteredOrders.filter(
        (o) => (!o.paymentStatus || o.paymentStatus === 'paid') && (!o.debtAmount || o.debtAmount === 0)
      );
    } else if (ztteam_paymentFilter === 'debt') {
      finalOrders = dateFilteredOrders.filter(
        (o) => (o.debtAmount && o.debtAmount > 0) || o.paymentStatus === 'unpaid' || o.paymentStatus === 'partial'
      );
    }

    const totalItems = finalOrders.reduce((sum, order) => {
      const orderItems = order.totalItems || order.items?.reduce((s, item) => s + (item.quantity || 1), 0) || 1;
      return sum + orderItems;
    }, 0);

    return {
      orders: finalOrders,
      totalGrossRevenue,
      totalCollectedRevenue,
      totalDebtAmount,
      totalUnpaidOrdersCount,
      totalItems,
      orderCount: finalOrders.length
    };
  }, [ztteam_filterMode, ztteam_selectedDate, ztteam_paymentFilter]);

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

  /** Clear Debt Action: Mark order as fully paid */
  const ztteam_handleClearDebt = (order) => {
    const ztteam_customer = order.customerName || `Đơn #${order.id}`;
    const ztteam_debtFormatted = new Intl.NumberFormat('vi-VN').format(order.debtAmount || order.totalAmount) + 'đ';

    ztteam_showConfirm({
      title: 'Xác nhận thu nợ',
      message: `Xác nhận đã thu đủ ${ztteam_debtFormatted} tiền nợ từ ${ztteam_customer}?`,
      confirmText: 'Đã thu tiền',
      cancelText: 'Hủy',
      type: 'primary',
      onConfirm: async () => {
        await ztteam_db.orders.update(order.id, {
          paymentStatus: 'paid',
          debtAmount: 0,
          paidAmount: order.totalAmount,
          paidAt: new Date().toISOString()
        });
        ztteam_showToast(`Đã thu nợ ${ztteam_debtFormatted} từ ${ztteam_customer} thành công!`);
      }
    });
  };

  const ztteam_formattedCollectedRev = ztteam_ordersData
    ? new Intl.NumberFormat('vi-VN').format(ztteam_ordersData.totalCollectedRevenue) + 'đ'
    : '0đ';

  const ztteam_formattedTotalDebt = ztteam_ordersData
    ? new Intl.NumberFormat('vi-VN').format(ztteam_ordersData.totalDebtAmount) + 'đ'
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

        {/** Payment Status Sub-Tabs (Tất cả / Đã thanh toán / Đang nợ) */}
        <div className="flex bg-surface-container rounded-xl p-1 shadow-inner-soft">
          <button
            onClick={() => setZtteam_paymentFilter('all')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${
              ztteam_paymentFilter === 'all'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tất cả đơn
          </button>

          <button
            onClick={() => setZtteam_paymentFilter('paid')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${
              ztteam_paymentFilter === 'paid'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Đã thanh toán
          </button>

          <button
            onClick={() => setZtteam_paymentFilter('debt')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 ${
              ztteam_paymentFilter === 'debt'
                ? 'bg-error text-white shadow-xs'
                : 'text-error hover:bg-error-container/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">error_med</span>
            <span>Đang nợ tiền</span>
            {(ztteam_ordersData?.totalUnpaidOrdersCount || 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-error rounded-full text-[10px] font-bold">
                {ztteam_ordersData.totalUnpaidOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/** Summary Bento Cards (Doanh thu thực thu, Tổng nợ chưa thu & Số đơn) */}
        <div className="grid grid-cols-3 gap-xs sm:gap-sm">
          {/** Card 1: Collected Revenue */}
          <div className="bg-secondary-fixed rounded-xl p-sm sm:p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[10px] sm:text-[11px] text-on-secondary-container uppercase tracking-wider font-semibold">
              Thực thu
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[16px] sm:text-[20px] text-primary font-bold block">
                {ztteam_formattedCollectedRev}
              </span>
            </div>
          </div>

          {/** Card 2: Total Debt Amount */}
          <div className="bg-error-container/30 border border-error/20 rounded-xl p-sm sm:p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[10px] sm:text-[11px] text-error uppercase tracking-wider font-semibold">
              Còn nợ chưa thu
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[16px] sm:text-[20px] text-error font-bold block">
                {ztteam_formattedTotalDebt}
              </span>
            </div>
          </div>

          {/** Card 3: Total Orders & Items Count */}
          <div className="bg-surface-container rounded-xl p-sm sm:p-md shadow-xs flex flex-col justify-between">
            <span className="font-label-md text-[10px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Số đơn / Món
            </span>
            <div className="mt-1">
              <span className="font-display-lg-mobile text-[15px] sm:text-[18px] text-on-surface font-bold block">
                {ztteam_ordersData?.orderCount || 0} <span className="text-[10px] font-normal">đơn</span>
                <span className="text-[12px] text-primary ml-1 font-semibold">({ztteam_ordersData?.totalItems || 0} món)</span>
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
            <p className="font-body-lg">
              {ztteam_paymentFilter === 'debt'
                ? 'Không có đơn nợ nào trong khoảng thời gian này.'
                : 'Chưa có đơn hàng nào trong khoảng thời gian này.'}
            </p>
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
              const ztteam_isDebt = (order.debtAmount && order.debtAmount > 0) || order.paymentStatus === 'unpaid' || order.paymentStatus === 'partial';
              const ztteam_formattedDebt = order.debtAmount
                ? new Intl.NumberFormat('vi-VN').format(order.debtAmount) + 'đ'
                : ztteam_formattedTotal;

              return (
                <div
                  key={order.id}
                  className={`bg-surface-container-lowest rounded-xl p-md shadow-soft border flex flex-col gap-sm transition-all ${
                    ztteam_isDebt ? 'border-error/50 ring-1 ring-error/30' : 'border-surface-container-high'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-surface-container-high pb-sm">
                    <div className="flex items-center gap-xs flex-wrap">
                      <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
                      <span className="font-title-lg text-[15px] font-bold text-primary">
                        Đơn #{order.id}
                      </span>
                      <span className="text-[12px] text-outline ml-1">{ztteam_formattedDate}</span>
                    </div>

                    {ztteam_isDebt ? (
                      <span className="px-2.5 py-1 rounded-full bg-error text-white font-label-md text-[11px] font-bold flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[14px]">error_med</span>
                        <span>Nợ: {ztteam_formattedDebt}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-[10px] font-semibold">
                        Đã thanh toán
                      </span>
                    )}
                  </div>

                  {/** Customer Info if Debt */}
                  {ztteam_isDebt && (
                    <div className="bg-error-container/20 p-2.5 rounded-lg border border-error/20 flex flex-col sm:flex-row sm:items-center justify-between text-[13px] gap-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-error text-[18px]">person</span>
                        <span className="font-bold text-on-surface">Khách nợ: {order.customerName || 'Khách quen'}</span>
                        {order.customerPhone && (
                          <span className="text-on-surface-variant font-body-md">({order.customerPhone})</span>
                        )}
                      </div>
                      <div className="text-[12px] text-error font-semibold">
                        Đã trả trước: {new Intl.NumberFormat('vi-VN').format(order.paidAmount || 0)}đ
                      </div>
                    </div>
                  )}

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
                    <div className="flex items-center gap-md">
                      <button
                        onClick={() => ztteam_handleDeleteOrder(order.id)}
                        className="text-error hover:opacity-80 text-[12px] flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span> Xóa đơn
                      </button>

                      {ztteam_isDebt && (
                        <button
                          onClick={() => ztteam_handleClearDebt(order)}
                          className="bg-primary text-on-primary hover:bg-[#442214] px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-1 cursor-pointer font-bold shadow-xs active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> Thu nợ (Trả tiền)
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[12px] text-on-surface-variant mr-2">Tổng đơn:</span>
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

