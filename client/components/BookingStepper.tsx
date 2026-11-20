import { Check, CalendarDays, UserRound, ConciergeBell, Tag, CreditCard } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface BookingStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onStepClick?: (step: 1 | 2 | 3 | 4 | 5) => void;
}

const STEPS = [
  { step: 1 as const, labelVi: "Ngày & phòng", labelEn: "Dates & Rooms", Icon: CalendarDays },
  { step: 2 as const, labelVi: "Thông tin khách", labelEn: "Guest Info", Icon: UserRound },
  { step: 3 as const, labelVi: "Chọn dịch vụ", labelEn: "Services", Icon: ConciergeBell },
  { step: 4 as const, labelVi: "Khuyến mãi", labelEn: "Promotions", Icon: Tag },
  { step: 5 as const, labelVi: "Thanh toán", labelEn: "Payment", Icon: CreditCard },
];

export default function BookingStepper({ currentStep, onStepClick }: BookingStepperProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="mb-6 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {STEPS.map(({ step, labelVi, labelEn, Icon }, index) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const clickable = Boolean(onStepClick && step < currentStep);

          return (
            <div key={step} className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(step)}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition ${
                  clickable ? "cursor-pointer hover:bg-secondary/80" : "cursor-default"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isEn ? `Step ${step}` : `Bước ${step}`}
                  </span>
                  <span
                    className={`block truncate text-xs sm:text-sm font-semibold ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isEn ? labelEn : labelVi}
                  </span>
                </div>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={`hidden md:block h-0.5 flex-1 rounded-full ${
                    step < currentStep ? "bg-emerald-500/60" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
