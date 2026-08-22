import { Hammer } from 'lucide-react';
import { vi } from '../../locales/vi';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <Hammer className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <h2 className="text-xl text-primary font-medium mb-2">{vi.common.underDevelopment}</h2>
      <p className="text-muted-foreground">Chức năng này sẽ sớm được cập nhật</p>
    </div>
  );
}