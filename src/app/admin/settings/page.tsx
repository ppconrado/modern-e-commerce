'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
  disableReviews: boolean;
  disableWishlist: boolean;
  disableMaintenanceMode: boolean;
}

interface UISettings extends Omit<StoreSettings, 'disableReviews' | 'disableWishlist'> {
  enableReviews: boolean;
  enableWishlist: boolean;
}

export default function SettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UISettings>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    currency: 'USD',
    taxRate: 0,
    shippingFee: 0,
    freeShippingThreshold: 0,
    lowStockThreshold: 10,
    enableReviews: true,
    enableWishlist: true,
    disableMaintenanceMode: false,
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (
      sessionStatus === 'authenticated' &&
      session?.user?.role !== 'ADMIN' &&
      session?.user?.role !== 'SUPER_ADMIN'
    ) {
      router.push('/');
      return;
    }
  }, [sessionStatus, session, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json() as Promise<{ settings: StoreSettings }>;
    },
    enabled: sessionStatus === 'authenticated',
  });

  useEffect(() => {
    if (data?.settings) {
      setFormData({
        ...data.settings,
        enableReviews: !data.settings.disableReviews,
        enableWishlist: !data.settings.disableWishlist,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (uiSettings: UISettings) => {
      // Converter enable -> disable para o backend
      const settings: StoreSettings = {
        ...uiSettings,
        disableReviews: !uiSettings.enableReviews,
        disableWishlist: !uiSettings.enableWishlist,
      };
      // Remover enableReviews/enableWishlist do payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { enableReviews, enableWishlist, ...payload } = settings as any;
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof UISettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Store Settings</h1>
        <p className="text-gray-600">Configure your store preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="storeEmail">Store Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={formData.storeEmail}
                  onChange={(e) => handleChange('storeEmail', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="storePhone">Store Phone</Label>
                <Input
                  id="storePhone"
                  value={formData.storePhone}
                  onChange={(e) => handleChange('storePhone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) => handleChange('storeAddress', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) =>
                    handleChange('taxRate', parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="shippingFee">Shipping Fee ($)</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shippingFee}
                  onChange={(e) =>
                    handleChange('shippingFee', parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="freeShippingThreshold">
                  Free Shipping Threshold ($)
                </Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.freeShippingThreshold}
                  onChange={(e) =>
                    handleChange(
                      'freeShippingThreshold',
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="lowStockThreshold">
                Low Stock Alert Threshold
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  handleChange('lowStockThreshold', parseInt(e.target.value))
                }
                className="max-w-xs"
              />
              <p className="text-sm text-gray-600 mt-1">
                Get alerts when product stock falls below this number
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableReviews">Enable Product Reviews</Label>
                <p className="text-sm text-gray-600">
                  Allow customers to review products
                </p>
              </div>
              <Switch
                id="enableReviews"
                checked={formData.enableReviews}
                onCheckedChange={(checked) =>
                  handleChange('enableReviews', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableWishlist">Enable Wishlist</Label>
                <p className="text-sm text-gray-600">
                  Allow customers to save products to wishlist
                </p>
              </div>
              <Switch
                id="enableWishlist"
                checked={formData.enableWishlist}
                onCheckedChange={(checked) =>
                  handleChange('enableWishlist', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="disableMaintenanceMode" className="text-orange-600">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-gray-600">
                  Temporarily disable the store for customers
                </p>
              </div>
              <Switch
                id="disableMaintenanceMode"
                checked={formData.disableMaintenanceMode}
                onCheckedChange={(checked) =>
                  handleChange('disableMaintenanceMode', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={updateMutation.isPending}
            className="w-full md:w-auto"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
