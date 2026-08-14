import { ArrowRight } from 'lucide-react';
import { cn } from '../../ui/utils';
import { MotionReveal } from './MotionReveal';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  actionLabel,
  onAction
}: SectionHeaderProps) {
  return (
    <MotionReveal className={cn('mb-10 md:mb-14', className)}>
      <div
        className={cn(
          'flex flex-col gap-4',
          align === 'center'
            ? 'items-center text-center'
            : 'items-start text-left'
        )}
      >
        {eyebrow && (
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-8 bg-current opacity-60" />
            {eyebrow}
            {align === 'center' && <span className="h-px w-8 bg-current opacity-60" />}
          </span>
        )}

        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground uppercase">
          {title}
        </h2>

        {subtitle && (
          <p
            className={cn(
              'text-muted-foreground text-base md:text-lg max-w-2xl',
              align === 'center' ? 'mx-auto' : ''
            )}
          >
            {subtitle}
          </p>
        )}

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-foreground hover:text-primary transition-colors"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </MotionReveal>
  );
}
