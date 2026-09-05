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

  /** Modal State for Editing / Converting Order to Debt */
  const [ztteam_editingOrder, setZtteam_editingOrder] = useState(null);
  const [ztteam_editName, setZtteam_editName] = useState('');
  const [ztteam_editPhone, setZtteam_editPhone] = useState('');
  const [ztteam_editPaidAmount, setZtteam_editPaidAmount] = useState('0');

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

  /** Open Modal to Convert or Edit Debt Information for an Order */
  const ztteam_handleOpenConvertDebtModal = (order) => {
    setZtteam_editingOrder(order);
    setZtteam_editName(order.customerName || '');
    setZtteam_editPhone(order.customerPhone || '');
    setZtteam_editPaidAmount(order.paidAmount !== undefined ? String(order.paidAmount) : '0');
  };

  /** Save Debt Conversion from Modal */
  const ztteam_handleSaveDebtConversion = async () => {
    if (!ztteam_editingOrder) return;
    if (!ztteam_editName.trim()) {
      ztteam_showToast('Vui lòng nhập tên khách nợ!', 'error');
      return;
    }

    try {
      const ztteam_total = ztteam_editingOrder.totalAmount || 0;
      const ztteam_paid = Math.min(ztteam_total, Math.max(0, Number(ztteam_editPaidAmount) || 0));
      const ztteam_debt = Math.max(0, ztteam_total - ztteam_paid);
      const ztteam_payStatus = ztteam_debt === 0 ? 'paid' : (ztteam_paid > 0 ? 'partial' : 'unpaid');

      await ztteam_db.orders.update(ztteam_editingOrder.id, {
        paymentStatus: ztteam_payStatus,
        customerName: ztteam_editName.trim(),
        customerPhone: ztteam_editPhone.trim(),
        paidAmount: ztteam_paid,
        debtAmount: ztteam_debt
      });

      ztteam_showToast(`Đã cập nhật đơn hàng #${ztteam_editingOrder.id} thành đơn nợ thành công!`);
      setZtteam_editingOrder(null);
    } catch (error) {
      console.error('Error converting order to debt:', error);
      ztteam_showToast('Có lỗi khi cập nhật đơn nợ!', 'error');
    }
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
                  <div className="flex justify-between items-center border-t border-surface-container-high pt-sm mt-xs flex-wrap gap-xs">
                    <div className="flex items-center gap-xs sm:gap-sm flex-wrap">
                      <button
                        onClick={() => ztteam_handleDeleteOrder(order.id)}
                        className="text-error hover:opacity-80 text-[12px] flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span> Xóa đơn
                      </button>

                      {/** Convert or Edit Debt Button */}
                      <button
                        onClick={() => ztteam_handleOpenConvertDebtModal(order)}
                        className="text-on-surface-variant hover:text-error hover:bg-error-container/20 px-2 py-1 rounded-lg text-[12px] flex items-center gap-1 cursor-pointer font-semibold border border-outline-variant/40 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        <span>{ztteam_isDebt ? 'Sửa nợ' : 'Chuyển nợ'}</span>
                      </button>

                      {/** Clear Debt Action Button */}
                      {ztteam_isDebt && (
                        <button
                          onClick={() => ztteam_handleClearDebt(order)}
                          className="bg-primary text-on-primary hover:bg-[#442214] px-3 py-1 rounded-lg text-[12px] flex items-center gap-1 cursor-pointer font-bold shadow-xs active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> Thu nợ
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

        {/** Convert Paid Order to Debt Modal */}
        {ztteam_editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-[20px] p-md sm:p-lg max-w-md w-full shadow-2xl space-y-md">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-sm">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[24px]">edit_note</span>
                  <h3 className="font-title-lg text-[18px] font-bold text-on-surface">
                    Chuyển thành đơn nợ #{ztteam_editingOrder.id}
                  </h3>
                </div>
                <button
                  onClick={() => setZtteam_editingOrder(null)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="bg-surface-container p-3 rounded-xl flex justify-between items-center text-[14px]">
                <span className="text-on-surface-variant font-semibold">Tổng tiền đơn hàng:</span>
                <span className="font-bold text-primary text-[16px]">
                  {new Intl.NumberFormat('vi-VN').format(ztteam_editingOrder.totalAmount || 0)}đ
                </span>
              </div>

              {/** Form Inputs */}
              <div className="space-y-sm">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                    Tên khách nợ <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Anh Nam công an, Chị Hoa..."
                    value={ztteam_editName}
                    onChange={(e) => setZtteam_editName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                    Số điện thoại khách (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    placeholder="090..."
                    value={ztteam_editPhone}
                    onChange={(e) => setZtteam_editPhone(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                    Khách đã trả trước (đ)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={ztteam_editPaidAmount}
                    onChange={(e) => setZtteam_editPaidAmount(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error outline-none transition-all font-semibold text-primary"
                  />
                </div>

                <div className="flex justify-between items-center bg-error-container/20 p-2.5 rounded-lg border border-error/30 text-[13px]">
                  <span className="text-on-surface-variant font-semibold">Số tiền ghi nợ:</span>
                  <span className="font-bold text-error text-[16px]">
                    {new Intl.NumberFormat('vi-VN').format(
                      Math.max(0, (ztteam_editingOrder.totalAmount || 0) - (Number(ztteam_editPaidAmount) || 0))
                    )}đ
                  </span>
                </div>
              </div>

              {/** Action Buttons */}
              <div className="flex items-center justify-end gap-sm border-t border-surface-container-high pt-md">
                <button
                  type="button"
                  onClick={() => setZtteam_editingOrder(null)}
                  className="px-4 py-2 rounded-xl text-[14px] font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high cursor-pointer transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={ztteam_handleSaveDebtConversion}
                  className="px-4 py-2 rounded-xl text-[14px] font-bold text-white bg-error hover:bg-red-700 cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu ghi nợ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ZTTeamLayout>
  );
}

