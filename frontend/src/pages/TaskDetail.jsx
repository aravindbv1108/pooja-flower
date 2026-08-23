import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer, Download, Share2, Wallet, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { taskApi, paymentApi, reportApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import Loader from '../components/common/Loader';
import PaymentModal from '../components/common/PaymentModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatCurrency, formatDate, formatNumber, toInputDate } from '../utils/format';

const statusStyles = {
  NOT_STARTED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-amber-50 text-amber-600',
  COMPLETED: 'bg-green-50 text-green-600',
  MISSED: 'bg-red-50 text-red-500',
};

const TaskDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const printRef = useRef();

  const [task, setTask] = useState(null);
  const [days, setDays] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [dayForm, setDayForm] = useState({ quantity: '', date: '' });

  const load = async () => {
    setLoading(true);
    const res = await taskApi.get(id);
    setTask(res.data.data.task);
    setDays(res.data.data.dailyRecords);
    setPayments(res.data.data.payments);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const openDayEdit = (day) => {
    setEditingDay(day._id);
    setDayForm({ quantity: day.quantity, date: toInputDate(day.date) });
  };

  const saveDay = async (dayId, extra = {}) => {
    try {
      const payload = { ...extra };
      if (dayForm.quantity !== '' && editingDay === dayId) payload.quantity = Number(dayForm.quantity);
      if (dayForm.date && editingDay === dayId) payload.date = dayForm.date;
      const res = await taskApi.updateDay(id, dayId, payload);
      showToast(t('tasks.dayUpdated'));
      setEditingDay(null);
      setTask(res.data.data.task);
      setDays((prev) => prev.map((d) => (d._id === dayId ? res.data.data.record : d)));
    } catch (err) {
      showToast(err.response?.data?.message || t('common.somethingWrong'), 'error');
    }
  };

  const handleAddPayment = async (data) => {
    const res = await taskApi.addPayment(id, data);
    showToast(t('payments.recordedSuccess'));
    setTask(res.data.data.task);
    setPayments((prev) => [res.data.data.payment, ...prev]);
    setPaymentModalOpen(false);
  };

  const handleDeletePayment = async () => {
    const res = await paymentApi.remove(confirmDeletePayment._id);
    showToast(t('payments.deletedSuccess'));
    setTask(res.data.data.task);
    setPayments((prev) => prev.filter((p) => p._id !== confirmDeletePayment._id));
    setConfirmDeletePayment(null);
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default;
    const res = await reportApi.task(id);
    const { business, task: rTask, dailyRecords, payments: rPayments } = res.data.data;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text(business.name || 'Pooja Flower', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Flower Garland Work Statement', 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    let y = 36;
    const lines = [
      `Master: ${rTask.masterNameSnapshot}`,
      `Rate: Rs.${rTask.price} / ${rTask.unit}`,
      `Period: ${formatDate(rTask.startDate)} - ${formatDate(rTask.endDate)}`,
      `Total Days: ${rTask.totalDays}`,
    ];
    lines.forEach((line) => { doc.text(line, 14, y); y += 6; });

    autoTable(doc, {
      startY: y + 4,
      head: [['Day', 'Date', 'Quantity', 'Unit', 'Rate', 'Amount', 'Status']],
      body: dailyRecords.map((d) => [d.dayNumber, formatDate(d.date), d.quantity, d.unit, `Rs.${d.rate}`, `Rs.${d.amount}`, d.status]),
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 },
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    const summary = [
      `Total Quantity: ${rTask.totalQuantity} ${rTask.unit}`,
      `Total Earned: Rs.${rTask.totalAmount}`,
      `Total Paid: Rs.${rTask.totalPaid}`,
      `Balance: Rs.${rTask.pendingAmount}`,
      `Payment Status: ${rTask.paymentStatus}`,
    ];
    doc.setFontSize(10);
    summary.forEach((line) => { doc.text(line, 14, finalY); finalY += 6; });

    if (rPayments.length) {
      autoTable(doc, {
        startY: finalY + 4,
        head: [['Payment Date', 'Amount', 'Method', 'Notes']],
        body: rPayments.map((p) => [formatDate(p.paymentDate), `Rs.${p.amount}`, p.paymentMethod, p.notes || '-']),
        headStyles: { fillColor: [236, 72, 153] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`${rTask.taskName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const handleShare = async () => {
    const summary = `${task.masterNameSnapshot} — ${formatDate(task.startDate)} to ${formatDate(task.endDate)}\nTotal Earned: ${formatCurrency(task.totalAmount)}\nPaid: ${formatCurrency(task.totalPaid)}\nPending: ${formatCurrency(task.pendingAmount)}\nStatus: ${task.paymentStatus}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: task.taskName, text: summary });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(summary);
      showToast(t('common.copied'));
    }
  };

  if (loading || !task) return <Loader />;

  const remaining = Math.max(task.totalDays - task.completedDays - task.missedDays, 0);
  const progress = task.totalDays ? Math.round((task.completedDays / task.totalDays) * 100) : 0;

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{task.taskName}</h2>
          <p className="text-sm text-gray-400">{task.masterNameSnapshot} · {formatCurrency(task.price)}/{task.unit}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPaymentModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Wallet size={16} /> {t('tasks.recordPayment')}
          </button>
          <button onClick={handleDownloadPdf} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> {t('tasks.downloadPdf')}
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
            <Printer size={16} /> {t('tasks.printReport')}
          </button>
          <button onClick={handleShare} className="btn-secondary flex items-center gap-2 text-sm">
            <Share2 size={16} /> {t('tasks.share')}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('tasks.totalQuantity'), value: `${formatNumber(task.totalQuantity)} ${task.unit}` },
          { label: t('tasks.totalEarned'), value: formatCurrency(task.totalAmount) },
          { label: t('tasks.totalPaid'), value: formatCurrency(task.totalPaid) },
          { label: t('tasks.pendingBalance'), value: formatCurrency(task.pendingAmount) },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">{t('tasks.progress')}: {task.completedDays}/{task.totalDays} ({t('tasks.completed')} {task.completedDays}, {t('tasks.missed')} {task.missedDays}, {t('tasks.remaining')} {remaining})</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-purple-50 overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Daily breakdown - desktop table */}
      <div className="card p-5 hidden md:block overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">{t('tasks.dailyBreakdown')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-purple-50">
              <th className="py-2 pr-3">{t('tasks.day')}</th>
              <th className="py-2 pr-3">{t('tasks.date')}</th>
              <th className="py-2 pr-3">{t('tasks.quantity')}</th>
              <th className="py-2 pr-3">{t('tasks.unit')}</th>
              <th className="py-2 pr-3">{t('tasks.rate')}</th>
              <th className="py-2 pr-3">{t('tasks.amount')}</th>
              <th className="py-2 pr-3">{t('tasks.status')}</th>
              <th className="py-2 pr-3 no-print">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d._id} className="border-b border-purple-50/60">
                <td className="py-2.5 pr-3 font-medium">{d.dayNumber}</td>
                <td className="py-2.5 pr-3">
                  {editingDay === d._id ? (
                    <input type="date" className="input-field !py-1 !px-2 text-xs" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} />
                  ) : formatDate(d.date)}
                </td>
                <td className="py-2.5 pr-3">
                  {editingDay === d._id ? (
                    <input type="number" min="0" className="input-field !py-1 !px-2 w-20 text-xs" value={dayForm.quantity} onChange={(e) => setDayForm({ ...dayForm, quantity: e.target.value })} />
                  ) : d.quantity}
                </td>
                <td className="py-2.5 pr-3">{d.unit}</td>
                <td className="py-2.5 pr-3">{formatCurrency(d.rate)}</td>
                <td className="py-2.5 pr-3 font-semibold">{formatCurrency(d.amount)}</td>
                <td className="py-2.5 pr-3">
                  <span className={`badge ${statusStyles[d.status]}`}>{d.status.replace('_', ' ')}</span>
                </td>
                <td className="py-2.5 pr-3 no-print">
                  {editingDay === d._id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveDay(d._id, { status: 'COMPLETED' })} className="text-xs text-primary-600 font-semibold">{t('common.save')}</button>
                      <button onClick={() => setEditingDay(null)} className="text-xs text-gray-400">{t('common.cancel')}</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => openDayEdit(d)} className="text-xs text-primary-600 font-semibold">{t('common.edit')}</button>
                      <button onClick={() => saveDay(d._id, { status: 'MISSED' })} title={t('tasks.markMissed')} className="text-red-400"><XCircle size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily breakdown - mobile cards */}
      <div className="md:hidden space-y-3">
        <h3 className="font-bold text-gray-800">{t('tasks.dailyBreakdown')}</h3>
        {days.map((d) => (
          <div key={d._id} className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-gray-800">{t('tasks.day')} {d.dayNumber}</p>
              <span className={`badge ${statusStyles[d.status]}`}>{d.status.replace('_', ' ')}</span>
            </div>
            {editingDay === d._id ? (
              <div className="space-y-2">
                <input type="date" className="input-field text-sm" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} />
                <input type="number" min="0" className="input-field text-sm" value={dayForm.quantity} onChange={(e) => setDayForm({ ...dayForm, quantity: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={() => saveDay(d._id, { status: 'COMPLETED' })} className="btn-primary flex-1 text-sm py-2">{t('tasks.saveDay')}</button>
                  <button onClick={() => setEditingDay(null)} className="btn-secondary flex-1 text-sm py-2">{t('common.cancel')}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <p className="text-gray-500">{t('tasks.date')}: <span className="text-gray-800 font-medium">{formatDate(d.date)}</span></p>
                  <p className="text-gray-500">{t('tasks.quantity')}: <span className="text-gray-800 font-medium">{d.quantity} {d.unit}</span></p>
                  <p className="text-gray-500">{t('tasks.rate')}: <span className="text-gray-800 font-medium">{formatCurrency(d.rate)}</span></p>
                  <p className="text-gray-500">{t('tasks.amount')}: <span className="text-gray-800 font-bold">{formatCurrency(d.amount)}</span></p>
                </div>
                <div className="flex gap-2 no-print">
                  <button onClick={() => openDayEdit(d)} className="btn-secondary flex-1 text-xs py-2">{t('common.edit')}</button>
                  <button onClick={() => saveDay(d._id, { status: 'MISSED' })} className="btn-danger flex-1 text-xs py-2">{t('tasks.markMissed')}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4">{t('payments.history')}</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">—</p>
        ) : (
          <ul className="divide-y divide-purple-50">
            {payments.map((p) => (
              <li key={p._id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{formatCurrency(p.amount)} · {p.paymentMethod}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.paymentDate)} {p.notes && `· ${p.notes}`}</p>
                  </div>
                </div>
                <button onClick={() => setConfirmDeletePayment(p)} className="text-red-400 no-print"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} onSubmit={handleAddPayment} pendingAmount={task.pendingAmount} />
      <ConfirmModal
        open={!!confirmDeletePayment}
        title={t('payments.deleteConfirm')}
        message={confirmDeletePayment ? formatCurrency(confirmDeletePayment.amount) : ''}
        onCancel={() => setConfirmDeletePayment(null)}
        onConfirm={handleDeletePayment}
      />
    </div>
  );
};

export default TaskDetail;
