/** React Context for Custom Toast and Confirm Modal built with Tailwind CSS */
import React, { createContext, useContext, useState } from 'react';

/** Create Context */
const ZTTeamNotificationContext = createContext();

export function ZTTeamNotificationProvider({ children }) {
  /** Toast State */
  const [ztteam_toast, setZtteam_toast] = useState(null);

  /** Confirm Modal State */
  const [ztteam_confirmModal, setZtteam_confirmModal] = useState(null);

  /** Show Toast Notification */
  const ztteam_showToast = (message, type = 'success') => {
    setZtteam_toast({ message, type, id: Date.now() });

    /** Auto hide toast after 3 seconds */
    setTimeout(() => {
      setZtteam_toast(null);
    }, 3000);
  };

  /** Show Confirm Modal Dialog */
  const ztteam_showConfirm = ({
    title = 'Xác nhận hành động',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText = 'Đồng ý',
    cancelText = 'Hủy',
    type = 'danger',
    onConfirm
  }) => {
    setZtteam_confirmModal({
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: async () => {
        setZtteam_confirmModal(null);
        if (onConfirm) await onConfirm();
      },
      onCancel: () => {
        setZtteam_confirmModal(null);
      }
    });
  };

  return (
    <ZTTeamNotificationContext.Provider
      value={{
        ztteam_showToast,
        ztteam_showConfirm
      }}
    >
      {children}

      {/** Custom Tailwind CSS Toast Banner */}
      {ztteam_toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] animate-bounce-short">
          <div
            className={`rounded-xl p-3 shadow-lg border flex items-center justify-between gap-2 backdrop-blur-md transition-all ${
              ztteam_toast.type === 'error'
                ? 'bg-error-container/95 text-on-error-container border-error/30'
                : ztteam_toast.type === 'info'
                ? 'bg-surface-container-highest/95 text-on-surface border-outline-variant/40'
                : 'bg-primary-container/95 text-on-primary-container border-primary/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {ztteam_toast.type === 'error' ? 'error' : ztteam_toast.type === 'info' ? 'info' : 'check_circle'}
              </span>
              <span className="font-title-lg text-[13px] font-bold">{ztteam_toast.message}</span>
            </div>
            <button
              onClick={() => setZtteam_toast(null)}
              className="p-1 hover:opacity-80 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/** Custom Tailwind CSS Confirm Modal Dialog */}
      {ztteam_confirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-md backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-lg max-w-sm w-full shadow-2xl border border-surface-container-high space-y-md">
            <div className="flex items-start gap-sm">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  ztteam_confirmModal.type === 'danger'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {ztteam_confirmModal.type === 'danger' ? 'warning' : 'help'}
                </span>
              </div>
              <div>
                <h3 className="font-title-lg text-[16px] text-primary font-bold">
                  {ztteam_confirmModal.title}
                </h3>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-1 leading-snug">
                  {ztteam_confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-xs">
              <button
                type="button"
                onClick={ztteam_confirmModal.onCancel}
                className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-title-lg text-[13px] font-semibold cursor-pointer transition-colors"
              >
                {ztteam_confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={ztteam_confirmModal.onConfirm}
                className={`flex-1 py-2.5 rounded-xl font-title-lg text-[13px] font-bold cursor-pointer hover:opacity-90 transition-all shadow-xs ${
                  ztteam_confirmModal.type === 'danger'
                    ? 'bg-error text-on-error'
                    : 'bg-primary text-on-primary'
                }`}
              >
                {ztteam_confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ZTTeamNotificationContext.Provider>
  );
}

/** Custom hook to consume Notifications */
export function ztteam_useNotification() {
  const context = useContext(ZTTeamNotificationContext);
  if (!context) {
    throw new Error('ztteam_useNotification must be used within ZTTeamNotificationProvider');
  }
  return context;
}
