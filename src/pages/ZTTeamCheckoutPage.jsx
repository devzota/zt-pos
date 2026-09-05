/** ZTTeam Checkout Page with custom Toast notifications */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ztteam_useCart } from '../stores/ztteam_cartContext';
import { ztteam_useNotification } from '../stores/ztteam_notificationContext';
import { ztteam_db } from '../db/ztteam_database';

export function ZTTeamCheckoutPage() {
  const navigate = useNavigate();
  const { ztteam_activeProduct } = ztteam_useCart();
  const { ztteam_showToast } = ztteam_useNotification();

  /** State for packaging, quantity, note */
  const [ztteam_packaging, setZtteam_packaging] = useState('Ly');
  const [ztteam_quantity, setZtteam_quantity] = useState(1);
  const [ztteam_note, setZtteam_note] = useState('');
  const [ztteam_isSubmitting, setZtteam_isSubmitting] = useState(false);

  /** State for Customer Debt Management */
  const [ztteam_paymentMethod, setZtteam_paymentMethod] = useState('paid'); /** 'paid' or 'debt' */
  const [ztteam_customerName, setZtteam_customerName] = useState('');
  const [ztteam_customerPhone, setZtteam_customerPhone] = useState('');
  const [ztteam_paidAmountInput, setZtteam_paidAmountInput] = useState('');

  /** Default fallback product if direct access */
  const ztteam_product = ztteam_activeProduct || {
    id: 1,
    name: 'Cà phê Sữa',
    price: 13000,
    priceChai: 28000,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop'
  };

  /** Calculate price based on selected packaging */
  const ztteam_unitPrice = ztteam_packaging === 'Chai'
    ? (ztteam_product.priceChai > 0 ? ztteam_product.priceChai : ztteam_product.price + 15000)
    : ztteam_product.price;

  const ztteam_totalAmount = ztteam_unitPrice * ztteam_quantity;

  const ztteam_formattedUnitPrice = new Intl.NumberFormat('vi-VN').format(ztteam_unitPrice) + ' ₫';
  const ztteam_formattedTotal = new Intl.NumberFormat('vi-VN').format(ztteam_totalAmount) + ' ₫';

  /** Confirm and Save Order to Dexie IndexedDB */
  const ztteam_handleConfirmSell = async () => {
    try {
      /** Validate Customer Name when debt mode is active */
      if (ztteam_paymentMethod === 'debt' && !ztteam_customerName.trim()) {
        ztteam_showToast('Vui lòng nhập tên khách nợ!', 'error');
        return;
      }

      setZtteam_isSubmitting(true);

      const ztteam_isDebt = ztteam_paymentMethod === 'debt';
      const ztteam_userPaidAmount = ztteam_isDebt
        ? Math.min(ztteam_totalAmount, Math.max(0, Number(ztteam_paidAmountInput) || 0))
        : ztteam_totalAmount;
      const ztteam_debtAmount = ztteam_isDebt ? Math.max(0, ztteam_totalAmount - ztteam_userPaidAmount) : 0;
      const ztteam_paymentStatus = ztteam_debtAmount === 0 ? 'paid' : (ztteam_userPaidAmount > 0 ? 'partial' : 'unpaid');

      const ztteam_newOrder = {
        createdAt: new Date().toISOString(),
        totalAmount: ztteam_totalAmount,
        totalItems: ztteam_quantity,
        status: 'completed',
        paymentStatus: ztteam_paymentStatus,
        customerName: ztteam_isDebt ? ztteam_customerName.trim() : '',
        customerPhone: ztteam_isDebt ? ztteam_customerPhone.trim() : '',
        paidAmount: ztteam_userPaidAmount,
        debtAmount: ztteam_debtAmount,
        items: [
          {
            productId: ztteam_product.id,
            productName: ztteam_product.name,
            price: ztteam_unitPrice,
            quantity: ztteam_quantity,
            packaging: ztteam_packaging,
            note: ztteam_note
          }
        ]
      };

      await ztteam_db.orders.add(ztteam_newOrder);
      
      /** Show Toast & Navigate to Orders history */
      ztteam_showToast(ztteam_isDebt ? 'Ghi nợ đơn hàng thành công!' : 'Xác nhận bán thành công!');
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      ztteam_showToast('Có lỗi khi tạo đơn hàng!', 'error');
    } finally {
      setZtteam_isSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-lg min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/** Top App Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-container-padding py-sm border-b border-outline-variant/20">
        <button
          onClick={() => navigate('/')}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-on-surface text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-title-lg text-title-lg text-on-surface text-center font-semibold">
          Bán ngay
        </h1>
        <div className="w-10 h-10"></div>
      </header>

      {/** Main Content */}
      <main className="flex-1 px-container-padding pt-md pb-[160px] flex flex-col gap-lg max-w-xl mx-auto w-full">
        {/** Product Overview Card */}
        <section className="bg-surface-container-lowest rounded-[20px] p-md shadow-soft border border-surface-container-high flex gap-md items-center">
          <div
            className="w-24 h-24 rounded-[14px] bg-cover bg-center shrink-0 shadow-inner-soft relative overflow-hidden"
            style={{ backgroundImage: `url('${ztteam_product.image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-xs mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[10px] uppercase tracking-wide font-semibold">
                {ztteam_product.category === 'coffee' ? 'Cà Phê' : ztteam_product.category === 'tea' ? 'Trà' : 'Khác'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[10px] uppercase tracking-wide">
                Mang đi
              </span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs font-bold">
              {ztteam_product.name}
            </h2>
            <div className="font-title-lg text-title-lg text-primary font-bold">
              {ztteam_formattedUnitPrice}
            </div>
          </div>
        </section>

        {/** Packaging Selection */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ml-1 font-semibold">
            Đóng gói
          </h3>
          <div className="flex bg-surface-container rounded-xl p-1 shadow-inner-soft relative">
            <button
              onClick={() => setZtteam_packaging('Ly')}
              className={`flex-1 py-3 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${
                ztteam_packaging === 'Ly'
                  ? 'bg-surface-container-lowest shadow-sm border border-surface-container-high text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined mb-1 text-[20px] ${ztteam_packaging === 'Ly' ? 'icon-fill' : ''}`}>
                coffee_maker
              </span>
              <span className="font-title-lg text-title-lg leading-tight">Ly</span>
              <span className="font-label-md text-[10px] text-on-surface-variant opacity-80 mt-0.5">
                {new Intl.NumberFormat('vi-VN').format(ztteam_product.price)}đ
              </span>
            </button>

            <button
              onClick={() => setZtteam_packaging('Chai')}
              className={`flex-1 py-3 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all relative ${
                ztteam_packaging === 'Chai'
                  ? 'bg-surface-container-lowest shadow-sm border border-surface-container-high text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined mb-1 text-[20px] ${ztteam_packaging === 'Chai' ? 'icon-fill' : ''}`}>
                water_bottle
              </span>
              <span className="font-title-lg text-title-lg leading-tight">Chai</span>
              <span className="font-label-md text-[10px] text-on-surface-variant opacity-80 mt-0.5">
                {ztteam_product.priceChai > 0
                  ? new Intl.NumberFormat('vi-VN').format(ztteam_product.priceChai) + 'đ'
                  : '+' + new Intl.NumberFormat('vi-VN').format(15000) + 'đ'}
              </span>
            </button>
          </div>
        </section>

        {/** Quantity Selector */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ml-1 font-semibold">
            Số lượng
          </h3>
          <div className="flex items-center justify-between bg-surface-container-lowest rounded-xl p-xs border border-surface-container shadow-sm">
            <button
              onClick={() => setZtteam_quantity((q) => Math.max(1, q - 1))}
              className="w-14 h-14 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">remove</span>
            </button>
            <div className="font-display-lg-mobile text-display-lg-mobile text-primary px-lg w-20 text-center font-bold">
              {ztteam_quantity}
            </div>
            <button
              onClick={() => setZtteam_quantity((q) => q + 1)}
              className="w-14 h-14 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
        </section>

        {/** Payment Method Selection & Debt Form */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ml-1 font-semibold">
            Hình thức thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-sm">
            <button
              type="button"
              onClick={() => setZtteam_paymentMethod('paid')}
              className={`py-3 px-md rounded-xl flex items-center justify-center gap-2 border font-semibold text-[14px] transition-all cursor-pointer ${
                ztteam_paymentMethod === 'paid'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-high hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">payments</span>
              <span>Thanh toán ngay</span>
            </button>

            <button
              type="button"
              onClick={() => setZtteam_paymentMethod('debt')}
              className={`py-3 px-md rounded-xl flex items-center justify-center gap-2 border font-semibold text-[14px] transition-all cursor-pointer ${
                ztteam_paymentMethod === 'debt'
                  ? 'bg-error text-white border-error shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-high hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Ghi nợ (Khách nợ)</span>
            </button>
          </div>

          {/** Debt Customer Form */}
          {ztteam_paymentMethod === 'debt' && (
            <div className="bg-error-container/20 border border-error/30 rounded-xl p-md space-y-sm mt-sm">
              <div className="flex items-center gap-2 text-error font-bold text-[14px]">
                <span className="material-symbols-outlined text-[20px]">error_med</span>
                <span>Thông tin ghi nợ</span>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                  Tên khách nợ <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Anh Nam công an, Chị Hoa..."
                  value={ztteam_customerName}
                  onChange={(e) => setZtteam_customerName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error focus:ring-1 focus:ring-error outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                  Số điện thoại khách (Tùy chọn)
                </label>
                <input
                  type="tel"
                  placeholder="090..."
                  value={ztteam_customerPhone}
                  onChange={(e) => setZtteam_customerPhone(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                  Khách trả trước (đ)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={ztteam_paidAmountInput}
                  onChange={(e) => setZtteam_paidAmountInput(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 font-body-md text-on-surface focus:border-error outline-none transition-all font-semibold text-primary"
                />
              </div>

              <div className="flex justify-between items-center bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/30 text-[13px]">
                <span className="text-on-surface-variant font-semibold">Số tiền ghi nợ:</span>
                <span className="font-bold text-error text-[16px]">
                  {new Intl.NumberFormat('vi-VN').format(
                    Math.max(0, ztteam_totalAmount - (Number(ztteam_paidAmountInput) || 0))
                  )}đ
                </span>
              </div>
            </div>
          )}
        </section>

        {/** Optional Notes */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ml-1 font-semibold">
            Ghi chú
          </h3>
          <textarea
            value={ztteam_note}
            onChange={(e) => setZtteam_note(e.target.value)}
            className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-xl p-md font-body-md text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all shadow-inner-soft resize-none"
            rows={2}
          ></textarea>
        </section>
      </main>

      {/** Bottom Action Area */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high px-container-padding py-md pb-safe z-50 shadow-[0_-10px_40px_rgba(75,44,32,0.06)] rounded-t-[24px]">
        <div className="flex justify-between items-end mb-md px-1 max-w-xl mx-auto">
          <div className="flex flex-col">
            <span className="font-body-md text-body-md text-on-surface-variant mb-0.5">Tổng thanh toán</span>
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span> {ztteam_quantity} Sản phẩm
            </span>
          </div>
          <div className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-bold">
            {ztteam_formattedTotal}
          </div>
        </div>

        <button
          onClick={ztteam_handleConfirmSell}
          disabled={ztteam_isSubmitting}
          className="w-full max-w-xl mx-auto h-[56px] bg-primary text-on-primary font-title-lg text-title-lg rounded-[16px] shadow-[0_8px_20px_rgba(50,23,13,0.25)] flex items-center justify-center gap-sm hover:bg-[#442214] active:scale-[0.98] transition-all duration-200 cursor-pointer font-bold disabled:opacity-50"
        >
          <span className="material-symbols-outlined icon-fill text-[22px]">point_of_sale</span>
          <span>{ztteam_isSubmitting ? 'Đang xử lý...' : 'Xác nhận bán'}</span>
        </button>
      </div>
    </div>
  );
}
