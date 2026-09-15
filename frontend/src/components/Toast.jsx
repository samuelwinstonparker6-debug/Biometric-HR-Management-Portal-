import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toasts } = useApp();
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fa-solid ${icons[t.type] || icons.info}`} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
