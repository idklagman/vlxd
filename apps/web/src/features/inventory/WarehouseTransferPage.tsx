import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Trash2, ArrowRightLeft, ArrowLeft } from 'lucide-react';

export function WarehouseTransferPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ton-kho')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chuyển kho nội bộ</h1>
          <p className="text-muted-foreground">Tính năng chuyển kho giữa các chi nhánh</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Hệ thống đang hoạt động ở chế độ 1 Kho Tổng duy nhất</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cửa hàng quản lý tập trung tại <strong>Kho Tổng VLXD</strong>. Bạn không cần thực hiện thao tác chuyển kho nội bộ.
            </p>
          </div>
          <Button onClick={() => navigate('/ton-kho')}>
            Xem số dư tồn kho
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
