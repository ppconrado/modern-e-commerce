'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Coupon = {
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
};

export default function CouponsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Fetch coupons
  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) throw new Error('Failed to fetch coupons');
      return res.json() as Promise<{ coupons: Coupon[] }>;
    },
  });

  const coupons = couponsData?.coupons || [];

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
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
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create coupon');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Coupon created!',
        description: `Coupon ${data.coupon.code} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/coupons/${editingId}`, {
        method: 'PATCH',
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
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update coupon');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Success',
        description: 'Coupon updated successfully.',
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete coupon');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Deleted',
        description: 'Coupon has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    createCouponMutation.mutate();
  };

  const handleUpdateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    updateCouponMutation.mutate();
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      deleteCouponMutation.mutate(id);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coupon Management</h1>
        <Button
          onClick={() => {
            if (!showForm) {
              resetForm();
              setShowForm(true);
            } else {
              setShowForm(false);
            }
          }}
        >
          {showForm ? 'Cancel' : 'New Coupon'}
        </Button>
      </div>

      {/* Create/Edit Coupon Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <form
            onSubmit={editingId ? handleUpdateCoupon : handleCreateCoupon}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SAVE10"
                  disabled={!!editingId}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10% discount on purchases"
                  minLength={10}
                  maxLength={255}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Discount Value{' '}
                  {formData.discountType === 'PERCENTAGE' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={formData.discountValue.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    formData.discountType === 'PERCENTAGE' ? '10' : '5.00'
                  }
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Purchase Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.minimumAmount.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={formData.maxUses?.toString() || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={
                  editingId
                    ? updateCouponMutation.isPending
                    : createCouponMutation.isPending
                }
                className="w-full"
              >
                {editingId
                  ? updateCouponMutation.isPending
                    ? 'Updating...'
                    : 'Update Coupon'
                  : createCouponMutation.isPending
                  ? 'Creating...'
                  : 'Create Coupon'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Coupons</h2>
        {couponsLoading ? (
          <p className="text-gray-500">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No coupons created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Code</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Discount</th>
                  <th className="text-left py-3 px-4">Min. Amount</th>
                  <th className="text-left py-3 px-4">Uses</th>
                  <th className="text-left py-3 px-4">Period</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{coupon.code}</td>
                    <td className="py-3 px-4 text-sm">{coupon.description}</td>
                    <td className="py-3 px-4">
                      {coupon.discountValue}
                      {coupon.discountType === 'PERCENTAGE' ? '%' : '$'}
                    </td>
                    <td className="py-3 px-4">${coupon.minimumAmount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${
                          coupon.maxUses &&
                          coupon.usedCount >= coupon.maxUses
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                      </span>
                      {coupon.maxUses &&
                        coupon.usedCount >= coupon.maxUses && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Limit reached
                          </span>
                        )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(coupon.startDate).toLocaleDateString()} -{' '}
                      {new Date(coupon.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          disabled={deleteCouponMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
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