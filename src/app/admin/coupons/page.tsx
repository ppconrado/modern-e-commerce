'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minimumAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { data: session, status } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    maxUses: null as number | null,
    minimumAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  // Check authorization
  useEffect(() => {
    const role = session?.user?.role;
    const isAllowed = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (status === 'unauthenticated' || (session && !isAllowed)) {
      redirect('/');
    }
  }, [session, status]);

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/admin/coupons');
        if (res.ok) {
          const data = await res.json();
          setCoupons(data.coupons);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchCoupons();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minimumAmount: Number(formData.minimumAmount),
          maxUses: formData.maxUses ? Number(formData.maxUses) : null,
          startDate: `${formData.startDate}T00:00:00Z`,
          endDate: `${formData.endDate}T23:59:59Z`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setCoupons(coupons.map(c => (c.id === editingId ? data.coupon : c)));
        } else {
          setCoupons([data.coupon, ...coupons]);
        }
        resetForm();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Error saving coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCoupons(coupons.filter(c => c.id !== id));
      } else {
        alert('Error deleting coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Error deleting coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      minimumAmount: coupon.minimumAmount,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: null,
      minimumAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const resetFormOnly = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: null,
      minimumAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setEditingId(null);
  };

  if (status === 'loading') {
    return <div className="p-8">Carregando...</div>;
  }

  if (loading) {
    return <div className="p-8">Carregando cupons...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Cupons</h1>
          <button
            onClick={() => {
              if (!showForm) {
                resetFormOnly();
                setShowForm(true);
              } else {
                setShowForm(false);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Novo Cupom'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Cupom' : 'Criar Novo Cupom'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="SAVE10"
                    disabled={!!editingId}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="10% desconto em compras"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Desconto</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor de Desconto {formData.discountType === 'PERCENTAGE' ? '(%)' : '($)'}
                  </label>
                  <div className="relative">
                    {formData.discountType === 'FIXED' && (
                      <span className="absolute left-3 top-2 text-gray-500 font-medium">$</span>
                    )}
                    <input
                      type="number"
                      value={formData.discountValue.toString()}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) || 0 })}
                      className={`w-full border rounded-lg px-3 py-2 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&[type=number]]:[-moz-appearance:textfield] ${
                        formData.discountType === 'FIXED' ? 'pl-7' : ''
                      }`}
                      placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '5.00'}
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Mínimo ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      value={formData.minimumAmount.toString()}
                      onChange={(e) => setFormData({ ...formData, minimumAmount: Number(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 pl-7 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&[type=number]]:[-moz-appearance:textfield]"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Final</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Uso Máximo</label>
                  <input
                    type="number"
                    value={formData.maxUses?.toString() || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded-lg px-3 py-2 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&[type=number]]:[-moz-appearance:textfield]"
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Ativo</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingId ? 'Atualizar' : 'Criar'} Cupom
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">Nenhum cupom criado ainda</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Código</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Desconto</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mín. Compra</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Uso</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Período</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {coupon.discountValue}
                      {coupon.discountType === 'PERCENTAGE' ? '%' : '$'}
                    </td>
                    <td className="px-6 py-4">${coupon.minimumAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        coupon.maxUses && coupon.usedCount >= coupon.maxUses
                          ? 'text-red-600 font-bold'
                          : 'text-gray-700'
                      }`}>
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                      </span>
                      {coupon.maxUses && coupon.usedCount >= coupon.maxUses && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Limite atingido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(coupon.startDate).toLocaleDateString('pt-BR')} -
                      <br />
                      {new Date(coupon.endDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
