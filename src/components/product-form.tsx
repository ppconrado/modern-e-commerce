'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/image-upload';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Price must be a positive number',
    }),
  image: z.string().min(1, 'Product image is required'),
  category: z.string().min(1, 'Category is required'),
  stock: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: 'Stock must be a non-negative number',
    }),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(product?.image || '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          image: product.image,
          category: product.category,
          stock: product.stock.toString(),
        }
      : undefined,
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!imageUrl) {
      toast({
        title: 'Error',
        description: 'Please upload a product image',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        image: imageUrl,
        category: data.category,
        stock: parseInt(data.stock),
      };

      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';

      const method = product ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error) || 'Failed to save product';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: product
          ? 'Product updated successfully'
          : 'Product created successfully',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
    setValue('image', url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Product Name</label>
            <Input
              {...register('name')}
              placeholder="e.g., Wireless Headphones"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              placeholder="Detailed product description..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Price ($)</label>
              <Input
                {...register('price')}
                type="number"
                step="0.01"
                placeholder="99.99"
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Stock</label>
              <Input {...register('stock')} type="number" placeholder="100" />
              {errors.stock && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Input {...register('category')} placeholder="e.g., Electronics" />
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <ImageUpload
            onImageUploaded={handleImageUploaded}
            currentImage={imageUrl}
            label="Product Image"
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
