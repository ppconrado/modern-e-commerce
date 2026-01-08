'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { Star, Edit, Trash2, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const checkIfPurchased = useCallback(async () => {
    setCheckingPurchase(true);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to check purchase');
      const data = await response.json();

      // Check if user has any DELIVERED order with this product
      const purchased = data.orders.some(
        (order: any) =>
          order.status === 'DELIVERED' &&
          order.OrderItem.some((item: any) => item.productId === productId)
      );

      setHasPurchased(purchased);
    } catch (error) {
      console.error('Error checking purchase:', error);
    } finally {
      setCheckingPurchase(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
    if (session?.user?.id) {
      checkIfPurchased();
    }
  }, [productId, session, fetchReviews, checkIfPurchased]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a review.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/reviews/${editingId}`
        : `/api/products/${productId}/reviews`;

      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      toast({
        title: editingId ? 'Review updated' : 'Review submitted',
        description: 'Thank you for your feedback!',
      });

      setShowForm(false);
      setEditingId(null);
      setRating(5);
      setComment('');
      fetchReviews();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setRating(review.rating);
    setComment(review.comment || '');
    setEditingId(review.id);
    setShowForm(true);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete review');

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });

      fetchReviews();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const userReview = reviews.find((r) => r.userId === session?.user?.id);
  const canReview = session && !userReview && !showForm && hasPurchased;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Reviews</CardTitle>
          {canReview && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Star className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          )}
          {session && !userReview && !hasPurchased && !checkingPurchase && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Purchase this product to leave a review
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {showForm && session && (
          <form
            onSubmit={handleSubmit}
            className="border rounded-lg p-4 bg-gray-50"
          >
            <h3 className="font-medium mb-4">
              {editingId ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <StarRating
                  rating={rating}
                  size={32}
                  interactive
                  showNumber={false}
                  onRatingChange={setRating}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  placeholder="Share your experience with this product..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Submitting...'
                    : editingId
                    ? 'Update Review'
                    : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setRating(5);
                    setComment('');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No reviews yet</p>
            <p className="text-sm">Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating
                        rating={review.rating}
                        showNumber={false}
                        size={16}
                      />
                      <span className="font-medium">
                        {review.user.fullName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                  </div>
                  {session?.user?.id === review.userId && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
