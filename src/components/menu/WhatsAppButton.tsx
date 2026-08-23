import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  dishName: string;
  className?: string;
}

export function WhatsAppButton({ dishName, className }: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppUrl(dishName)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Consultar sobre ${dishName} por WhatsApp`}
      className={cn(
        'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-white transition-colors hover:bg-[#1EBE5A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]',
        className
      )}
    >
      <MessageCircle className="size-5" aria-hidden />
      Consultar por WhatsApp
    </a>
  );
}
