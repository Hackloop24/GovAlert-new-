import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// App-wide notifications that replace window.alert / window.confirm:
//   const toast = useToast();
//   toast.success("Saved", "Optional details");      // also .error .info .warning
//   const ok = await toast.confirm({ title, message, confirmText, tone: "danger" });

const ToastContext = createContext(null);

const TONES = {
  success: { icon: "fa-circle-check", color: "#22c55e" },
  error: { icon: "fa-circle-xmark", color: "#ef4444" },
  warning: { icon: "fa-triangle-exclamation", color: "#f59e0b" },
  info: { icon: "fa-circle-info", color: "#3b82f6" },
};

let nextId = 1;

function Toast({ toast, onClose }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const tone = TONES[toast.type] || TONES.info;

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 250);
  }, [onClose, toast.id]);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(close, toast.remaining);
    const started = Date.now();
    return () => {
      clearTimeout(t);
      toast.remaining -= Date.now() - started; // resume where we left off after hover
    };
  }, [paused, close, toast]);

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`ga-toast ${leaving ? "ga-toast-out" : "ga-toast-in"}`}
      style={{ borderLeftColor: tone.color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <i className={`fa-solid ${tone.icon} ga-toast-icon`} style={{ color: tone.color }}></i>
      <div className="ga-toast-body">
        <div className="ga-toast-title">{toast.title}</div>
        {toast.message && <div className="ga-toast-message">{toast.message}</div>}
      </div>
      <button className="ga-toast-close" onClick={close} aria-label="Dismiss">
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div
        className="ga-toast-progress"
        style={{
          background: tone.color,
          animationDuration: `${toast.duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      ></div>
    </div>
  );
}

function ConfirmDialog({ dialog, onAnswer }) {
  const confirmRef = useRef(null);
  const tone = TONES[dialog.tone === "danger" ? "error" : dialog.tone] || TONES.info;

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onAnswer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer]);

  return (
    <div className="ga-overlay" onMouseDown={(e) => e.target === e.currentTarget && dialog.cancelText !== null && onAnswer(false)}>
      <div className="ga-dialog" role="dialog" aria-modal="true" aria-labelledby="ga-dialog-title">
        <div className="ga-dialog-icon" style={{ color: tone.color, background: `${tone.color}22` }}>
          <i className={`fa-solid ${dialog.icon || tone.icon}`}></i>
        </div>
        <h3 id="ga-dialog-title" className="ga-dialog-title">{dialog.title}</h3>
        {dialog.message && <div className="ga-dialog-message">{dialog.message}</div>}
        <div className="ga-dialog-actions">
          {dialog.cancelText !== null && (
            <button className="ga-btn ga-btn-secondary" onClick={() => onAnswer(false)}>
              {dialog.cancelText || "Cancel"}
            </button>
          )}
          <button
            ref={confirmRef}
            className="ga-btn"
            style={{ background: dialog.tone === "danger" ? "#dc2626" : "#2563eb" }}
            onClick={() => onAnswer(true)}
          >
            {dialog.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const remove = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback((type, title, message, opts = {}) => {
    const duration = opts.duration || (type === "error" ? 6000 : 4000);
    setToasts((all) => [...all.slice(-3), { id: nextId++, type, title, message, duration, remaining: duration }]);
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({
          ...options,
          resolve: (answer) => {
            setDialog(null);
            resolve(answer);
          },
        });
      }),
    []
  );

  const api = useMemo(
    () => ({
      success: (t, m, o) => show("success", t, m, o),
      error: (t, m, o) => show("error", t, m, o),
      warning: (t, m, o) => show("warning", t, m, o),
      info: (t, m, o) => show("info", t, m, o),
      confirm,
    }),
    [show, confirm]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ga-toast-stack" aria-live="polite">
        {toasts.map((t) => <Toast key={t.id} toast={t} onClose={remove} />)}
      </div>
      {dialog && <ConfirmDialog dialog={dialog} onAnswer={dialog.resolve} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
