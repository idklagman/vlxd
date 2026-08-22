import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { vi } from '../../locales/vi';

export function SettingsPage() {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm();

  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      reset(res.data);
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/settings', data),
    onSuccess: () => {
      toast({
        title: vi.settings.saved,
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu cài đặt',
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">{vi.settings.title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{vi.settings.storeInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{vi.settings.storeName}</Label>
                <Input {...register('storeName')} />
              </div>
              <div className="space-y-2">
                <Label>{vi.settings.storePhone}</Label>
                <Input {...register('storePhone')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{vi.settings.storeAddress}</Label>
                <Input {...register('storeAddress')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{vi.settings.bankInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{vi.settings.bankName}</Label>
                <Input {...register('bankName')} />
              </div>
              <div className="space-y-2">
                <Label>{vi.settings.bankAccount}</Label>
                <Input {...register('bankAccount')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{vi.settings.bankAccountName}</Label>
                <Input {...register('bankAccountName')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? vi.common.loading : vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}