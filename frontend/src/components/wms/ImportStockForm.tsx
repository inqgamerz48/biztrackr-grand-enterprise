import { useState } from 'react';
import axiosInstance from '@/lib/axios';

export default function ImportStockForm() {
    const [formData, setFormData] = useState({
        warehouse_id: 1,
        supplier_id: '',
        item_id: '',
        quantity_received: '',
        bin_id: '',
        quality_check_status: 'approved',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axiosInstance.post('/wms/inward', {
                warehouse_id: parseInt(formData.warehouse_id),
                supplier_id: parseInt(formData.supplier_id),
                item_id: parseInt(formData.item_id),
                quantity_received: parseInt(formData.quantity_received),
                bin_id: parseInt(formData.bin_id),
                quality_check_status: formData.quality_check_status,
                notes: formData.notes
            });

            setMessage('✅ Stock imported successfully! Inventory updated.');
            console.log('Response:', response.data);

            // Reset form
            setFormData({
                warehouse_id: 1,
                supplier_id: '',
                item_id: '',
                quantity_received: '',
                bin_id: '',
                quality_check_status: 'approved',
                notes: ''
            });
        } catch (error: any) {
            setMessage('❌ Error: ' + (error.response?.data?.detail || error.message));
            console.error('Import error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">📦 Import Stock to Warehouse</h2>

            {message && (
                <div className={`p-4 rounded-lg mb-4 ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Warehouse ID
                    </label>
                    <input
                        type="number"
                        value={formData.warehouse_id}
                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Supplier ID
                    </label>
                    <input
                        type="number"
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Item ID (Product)
                    </label>
                    <input
                        type="number"
                        value={formData.item_id}
                        onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantity Received
                    </label>
                    <input
                        type="number"
                        value={formData.quantity_received}
                        onChange={(e) => setFormData({ ...formData, quantity_received: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        required
                        min="1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bin ID (Storage Location)
                    </label>
                    <input
                        type="number"
                        value={formData.bin_id}
                        onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quality Check Status
                    </label>
                    <select
                        value={formData.quality_check_status}
                        onChange={(e) => setFormData({ ...formData, quality_check_status: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                        <option value="approved">✅ Approved</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="rejected">❌ Rejected</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        rows={3}
                        placeholder="e.g., Batch number, inspection notes..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Importing...' : '📦 Import Stock'}
                </button>
            </form>

            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">💡 Tips:</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• You can find Item IDs in your inventory page</li>
                    <li>• Supplier IDs are in the CRM/Suppliers section</li>
                    <li>• Quality check "approved" will add to usable inventory</li>
                    <li>• Quality check "rejected" won't add to inventory</li>
                </ul>
            </div>
        </div>
    );
}
