/**
 * API response wrapper for consistent error and success responses
 * Ensures all responses follow the same schema
 */

import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export function successResponse<T>(data: T, requestId?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    } as ApiResponse<T>,
    { status: 200 }
  );
}

export function errorResponse(
  error: string,
  statusCode: number = 400,
  requestId?: string
) {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      requestId,
    } as ApiResponse,
    { status: statusCode }
  );
}

export function createdResponse<T>(data: T, requestId?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    } as ApiResponse<T>,
    { status: 201 }
  );
}
