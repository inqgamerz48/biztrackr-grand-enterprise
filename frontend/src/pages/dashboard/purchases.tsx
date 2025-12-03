import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { ShoppingCart, Truck, CheckCircle, Clock } from 'lucide-react';

export default function PurchasesPage() {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [items, setItems] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [transportCharges, setTransportCharges] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [purchases, setPurchases] = useState<any[]>([]);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');

    useEffect(() => {
        fetchData();
        fetchHistory();
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/banking/');
            setAccounts(res.data);
            if (res.data.length > 0) {
                setSelectedAccount(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [itemsRes, suppliersRes] = await Promise.all([
                api.get('/inventory/'),
                api.get('/crm/suppliers')
            ]);
            setItems(itemsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/purchases/');
            setPurchases(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const addToCart = (item: any) => {
        const existing = cart.find((c) => c.item_id === item.id);
        if (existing) {
            setCart(cart.map((c) => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                item_id: item.id,
                name: item.name,
                price: item.purchase_price || item.selling_price || 0,
                quantity: 1
            }]);
        }
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(cart.map((c) => {
            if (c.item_id === itemId) {
                const newQty = Math.max(1, c.quantity + delta);
                return { ...c, quantity: newQty };
            }
            return c;
        }));
    };

    const updatePrice = (itemId: number, price: number) => {
        setCart(cart.map((c) => c.item_id === itemId ? { ...c, price: Math.max(0, price) } : c));
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter((c) => c.item_id !== itemId));
    };

    const handlePurchase = () => {
        if (!selectedSupplier) {
            alert('Please select a supplier');
            return;
        }
        if (cart.length === 0) {
            alert('Please add items to purchase');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmPurchase = async () => {
        try {
            const payload = {
                supplier_id: parseInt(selectedSupplier),
                invoice_number: `PUR-${Date.now()}`,
                items: cart.map((c) => ({ item_id: c.item_id, quantity: c.quantity, price: c.price })),
                transport_charges: transportCharges
            };
            const res = await api.post('/purchases/', payload);

            try {
                const pdfRes = await api.get(`/sales/purchases/${res.data.id}/pdf`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `purchase_${res.data.invoice_number}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (pdfError) {
                console.error('PDF download failed:', pdfError);
            }

            setShowConfirmModal(false);
            alert(`Purchase Order Created! Status: Ordered.\nPlease go to 'Order History' to receive goods when they arrive.`);
            setCart([]);
            setTransportCharges(0);
            setSelectedSupplier('');
            fetchHistory();
            setActiveTab('history');
        } catch (error) {
            alert('Purchase failed');
        }
    };

    const handleReceiveClick = (purchaseId: number) => {
        setSelectedPurchaseId(purchaseId);
        setShowReceiveModal(true);
    };

    const confirmReceive = async () => {
        if (!selectedPurchaseId) return;
        try {
            await api.post(`/purchases/${selectedPurchaseId}/receive`);
            alert('Goods Received! Inventory updated.');
            setShowReceiveModal(false);
            setSelectedPurchaseId(null);
            fetchHistory();
            fetchData();
        } catch (error) {
            alert('Failed to receive order');
        }
    };

    const handlePaymentClick = (purchase: any) => {
        setSelectedPurchaseId(purchase.id);
        const remaining = purchase.total_amount - (purchase.amount_paid || 0);
        setPaymentAmount(remaining);
        setShowPaymentModal(true);
    };

    const confirmPayment = async () => {
        if (!selectedPurchaseId) return;
        try {
            await api.post(`/purchases/${selectedPurchaseId}/pay`, {
                amount: paymentAmount,
                payment_method: paymentMethod,
                account_id: selectedAccount ? parseInt(selectedAccount) : null
            });
            alert('Payment Recorded!');
            setShowPaymentModal(false);
            setSelectedPurchaseId(null);
            fetchHistory();
        } catch (error) {
            alert('Failed to record payment');
        }
    };

    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const totalAmount = subtotal + transportCharges;
    const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const selectedSupplierData = suppliers.find(s => s.id === parseInt(selectedSupplier));

    return (
        <DashboardLayout>

            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none w-[400px]">
                            <h2 className="text-xl font-bold mb-4 text-white">Record Payment</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Amount</label>
                                    <input
                                        type="number"
                                        className="mt-1 block w-full bg-black text-white border border-white/20 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-white focus:border-white sm:text-sm"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Payment Method</label>
                                    <select
                                        className="mt-1 block w-full bg-black text-white pl-3 pr-10 py-2 text-base border border-white/20 focus:outline-none focus:ring-white focus:border-white sm:text-sm rounded-md"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Payment Account</label>
                                    <select
                                        className="mt-1 block w-full bg-black text-white pl-3 pr-10 py-2 text-base border border-white/20 focus:outline-none focus:ring-white focus:border-white sm:text-sm rounded-md"
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency} {acc.balance})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded hover:bg-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 font-semibold border border-white"
                                >
                                    Save Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Receive Confirmation Modal */}
            {
                showReceiveModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none w-[400px]">
                            <h2 className="text-xl font-bold mb-4 text-white">Confirm Receipt</h2>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to mark this order as Received? This will update your inventory stock.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowReceiveModal(false)}
                                    className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded hover:bg-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReceive}
                                    className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 font-semibold border border-white"
                                >
                                    Confirm Receive
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Purchase Confirmation Modal */}
            {
                showConfirmModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-black border border-white/20 p-6 rounded-lg shadow-none w-[600px] max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 text-white">Confirm Purchase Order</h2>

                            {/* Supplier Info */}
                            <div className="mb-4 p-3 bg-white/5 rounded border border-white/20">
                                <p className="text-sm font-semibold text-gray-300">Supplier:</p>
                                <p className="text-lg font-bold text-white">{selectedSupplierData?.name}</p>
                            </div>

                            {/* Items */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-3 text-white">Items to Purchase</h3>
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div key={item.item_id} className="flex justify-between items-start border-b border-white/10 pb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{item.name}</p>
                                                <p className="text-sm text-gray-400">
                                                    {item.quantity} × ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-white">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-white/10 pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Subtotal:</span>
                                    <span className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {transportCharges > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Transport Charges:</span>
                                        <span className="text-white">₹{transportCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                                    <span className="text-white">Total Amount:</span>
                                    <span className="text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded hover:bg-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPurchase}
                                    className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 font-semibold border border-white"
                                >
                                    Create PO
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-white">Purchase Management</h1>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-white/20">
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'new' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        New Purchase Order
                    </button>
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Order History
                    </button>
                </div>

                {activeTab === 'new' ? (
                    <>
                        {/* Supplier Selection */}
                        <div className="bg-black border border-white/20 p-4 rounded shadow-none">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Supplier *</label>
                            <select
                                className="block w-full bg-black text-white pl-3 pr-10 py-2 text-base border border-white/20 rounded focus:outline-none focus:ring-white focus:border-white"
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                            >
                                <option value="">Choose a supplier...</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 350px)' }}>
                            {/* Items List */}
                            <div className="flex-1 bg-black border border-white/20 p-4 rounded shadow-none overflow-y-auto">
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    className="w-full bg-black text-white p-2 border border-white/20 rounded mb-4 focus:ring-white focus:border-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border border-white/20 p-4 rounded cursor-pointer hover:shadow-none hover:border-white transition bg-white/5"
                                            onClick={() => addToCart(item)}
                                        >
                                            <h3 className="font-bold text-white">{item.name}</h3>
                                            <p className="text-sm text-gray-400">Current Stock: {item.quantity}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Price: ₹{(item.purchase_price || item.selling_price || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Purchase Cart */}
                            <div className="w-full lg:w-96 bg-black border border-white/20 p-4 rounded shadow-none flex flex-col h-1/2 lg:h-auto">
                                <h2 className="text-xl font-bold mb-4 text-white">Draft Order</h2>
                                <div className="flex-1 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.item_id} className="border-b border-white/10 pb-3 mb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-white">{item.name}</p>
                                                </div>
                                                <button onClick={() => removeFromCart(item.item_id)} className="text-white hover:text-gray-300 text-xl">×</button>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-xs text-gray-400 w-16">Quantity:</label>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, -1)}
                                                    className="bg-white/10 text-white px-2 py-1 rounded hover:bg-white/20 border border-white/20"
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center font-medium text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, 1)}
                                                    className="bg-white/10 text-white px-2 py-1 rounded hover:bg-white/20 border border-white/20"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-400 w-16">Price (₹):</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => updatePrice(item.item_id, parseFloat(e.target.value) || 0)}
                                                    className="flex-1 bg-black text-white px-2 py-1 border border-white/20 rounded text-sm focus:ring-white focus:border-white"
                                                />
                                                <span className="text-sm text-gray-400">
                                                    = ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-400 w-32">Transport Charges:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={transportCharges}
                                            onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                                            className="flex-1 bg-black text-white px-2 py-1 border border-white/20 rounded text-sm focus:ring-white focus:border-white"
                                            placeholder="0.00"
                                        />
                                        <span className="text-xs text-white">₹</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Subtotal:</span>
                                        <span className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                                        <span className="text-white">Total:</span>
                                        <span className="text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <button
                                        onClick={handlePurchase}
                                        disabled={cart.length === 0 || !selectedSupplier}
                                        className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white"
                                    >
                                        Create Purchase Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-black border border-white/20 rounded shadow-none overflow-hidden">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-black divide-y divide-white/10">
                                {purchases.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(p.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {p.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {p.supplier_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                            ₹{p.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'Received' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/10 text-white border border-white/20'}`}>
                                                {p.status || 'Ordered'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${p.payment_status === 'paid' ? 'bg-white/10 text-white border border-white/20' : p.payment_status === 'partial' ? 'bg-white/10 text-white border border-white/20' : 'bg-white/10 text-white border border-white/20'}`}>
                                                    {p.payment_status ? p.payment_status.toUpperCase() : 'PENDING'}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    Paid: ₹{(p.amount_paid || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {p.status !== 'Received' && (
                                                <button
                                                    onClick={() => handleReceiveClick(p.id)}
                                                    className="text-white hover:text-gray-300 inline-flex items-center gap-1"
                                                >
                                                    <Truck size={16} /> Receive
                                                </button>
                                            )}
                                            {p.payment_status !== 'paid' && (
                                                <button
                                                    onClick={() => handlePaymentClick(p)}
                                                    className="text-white hover:text-gray-300 inline-flex items-center gap-1"
                                                >
                                                    <ShoppingCart size={16} /> Pay
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                            No purchase history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout >
    );
}
