import { Info } from 'lucide-react';
import { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  children: ReactNode;
  description?: string;
  tooltip?: string;
  required?: boolean;
  tone?: 'light' | 'dark';
};

export function FormField({
  label,
  children,
  description,
  tooltip,
  required = false,
  tone = 'light',
}: FormFieldProps) {
  const labelClassName =
    tone === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const descriptionClassName =
    tone === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const iconClassName =
    tone === 'dark'
      ? 'border-sky-400/30 bg-sky-400/10 text-sky-200 hover:border-sky-300/60 hover:bg-sky-400/20'
      : 'border-sky-200 bg-sky-50 text-sky-600 hover:border-sky-300 hover:bg-sky-100';
  const tooltipBubbleClassName =
    tone === 'dark'
      ? 'border-sky-400/20 bg-sky-100 text-sky-950 shadow-sky-950/20'
      : 'border-sky-200 bg-sky-50 text-sky-900 shadow-sky-200/60';
  const tooltipTailClassName =
    tone === 'dark' ? 'border-sky-400/20 bg-sky-100' : 'border-sky-200 bg-sky-50';

  return (
    <label className={`flex flex-col gap-2 text-sm font-medium ${labelClassName}`}>
      <span className={`flex items-center gap-2 ${labelClassName}`}>
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
        {tooltip ? (
          <span className="group/tooltip relative inline-flex">
            <span
              className={`inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border transition ${iconClassName}`}
              tabIndex={0}
              aria-label={tooltip}
              role="img"
            >
              <Info size={12} />
            </span>
            <span
              className={`pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-64 -translate-x-1/2 opacity-0 transition duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${tooltipBubbleClassName} rounded-2xl border px-4 py-3 text-xs font-normal leading-5 shadow-lg`}
            >
              <span
                className={`absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[4px] border-l border-t ${tooltipTailClassName}`}
              />
              <span className="relative block">{tooltip}</span>
            </span>
          </span>
        ) : null}
      </span>
      {description ? <span className={`text-xs font-normal ${descriptionClassName}`}>{description}</span> : null}
      {children}
    </label>
  );
}
