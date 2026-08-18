/** ZTTeam Orders History Page with custom Confirm Modal */
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import { ztteam_useNotification } from '../stores/ztteam_notificationContext';

export function ZTTeamOrdersPage() {
  const [ztteam_filterStatus, setZtteam_filterStatus] = useState('all');
  const { ztteam_showToast, ztteam_showConfirm } = ztteam_useNotification();

  /** Query Orders from Dexie IndexedDB */
  const ztteam_orders = useLiveQuery(async () => {
    const allOrders = await ztteam_db.orders.reverse().toArray();
    if (ztteam_filterStatus === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return allOrders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr));
    }
    return allOrders;
  }, [ztteam_filterStatus]);

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

  return (
    <ZTTeamLayout ztteam_title="Quản lý đơn hàng">
      <div className="space-y-md max-w-2xl mx-auto">
        {/** Filter Header */}
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-title-lg text-title-lg text-primary font-bold">Lịch sử đơn hàng</h2>
          <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/30">
            <button
              onClick={() => setZtteam_filterStatus('all')}
              className={`px-3 py-1 text-[12px] rounded-md font-label-md transition-all cursor-pointer ${
                ztteam_filterStatus === 'all'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setZtteam_filterStatus('today')}
              className={`px-3 py-1 text-[12px] rounded-md font-label-md transition-all cursor-pointer ${
                ztteam_filterStatus === 'today'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant'
              }`}
            >
              Hôm nay
            </button>
          </div>
        </div>

        {/** Orders List */}
        {!ztteam_orders ? (
          <div className="text-center py-8 text-outline">Đang tải danh sách đơn hàng...</div>
        ) : ztteam_orders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant shadow-soft border border-surface-container-high">
            <span className="material-symbols-outlined text-[48px] text-outline mb-2">receipt_long</span>
            <p className="font-body-lg">Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {ztteam_orders.map((order) => {
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
