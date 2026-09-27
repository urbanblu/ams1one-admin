import { cn, Label } from "@heroui/react";
import { fieldLabelClass } from "@/components/ui/field-label";
import { Calendar } from "@heroui/react/calendar";
import { DateField } from "@heroui/react/date-field";
import { DatePicker } from "@heroui/react/date-picker";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { useEffect, useState } from "react";

type Props = {
  label?: string;
  onDatePicked?: (date: DateValue) => void;
  className?: string;
  labelClassName?: string;
  maxValue?: DateValue;
  defaultValue?: DateValue;
};

function CustomDatePicker({
  label,
  onDatePicked,
  className,
  labelClassName,
  maxValue,
  defaultValue,
}: Props) {
  const todayDate = today(getLocalTimeZone());
  const [value, setValue] = useState<DateValue | null>(
    defaultValue ??
      (maxValue && todayDate.compare(maxValue) > 0 ? null : todayDate),
  );

  useEffect(() => {
    if (!value) return;
    onDatePicked?.(value);
  }, [value, onDatePicked]);

  return (
    <DatePicker
      name="date"
      value={value}
      onChange={setValue}
      maxValue={maxValue}
      className="w-full"
    >
      {label && (
        <Label className={cn(fieldLabelClass, labelClassName)}>{label}</Label>
      )}
      <DateField.Group
        fullWidth
        className={cn(
          "h-9 rounded-md border border-border-strong bg-surface px-3 text-sm shadow-none transition-colors duration-200",
          "focus-within:border-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500/20",
          "data-[invalid=true]:border-destructive",
          className,
        )}
      >
        <DateField.Input className="text-sm text-foreground">
          {(segment) => (
            <DateField.Segment
              segment={segment}
              className="rounded-sm px-0.5 data-[focused=true]:bg-brand-100 data-[focused=true]:text-brand-800 data-[placeholder=true]:text-foreground-lighter"
            />
          )}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger className="cursor-pointer text-foreground-muted transition-colors hover:text-foreground">
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="rounded-lg border border-border p-2 shadow-overlay">
        <Calendar aria-label="Select date">
          <Calendar.Header>
            <Calendar.YearPickerTrigger className="cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-surface-200">
              <Calendar.YearPickerTriggerHeading className="text-sm font-medium text-foreground" />
              <Calendar.YearPickerTriggerIndicator className="text-foreground-muted" />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton
              slot="previous"
              className="w-7 cursor-pointer rounded-md text-foreground-light transition-colors hover:bg-surface-200"
            />
            <Calendar.NavButton
              slot="next"
              className="w-7 cursor-pointer rounded-md text-foreground-light transition-colors hover:bg-surface-200"
            />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => (
                <Calendar.HeaderCell className="text-xs font-medium text-foreground-light">
                  {day}
                </Calendar.HeaderCell>
              )}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell
                  date={date}
                  className={cn(
                    "cursor-pointer rounded-md p-0 text-xs transition-colors",
                    "data-[hovered=true]:bg-surface-200",
                    "data-[today=true]:font-medium data-[today=true]:text-brand-700",
                    "data-[selected=true]:bg-brand-700 data-[selected=true]:font-medium data-[selected=true]:text-white",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40",
                  )}
                />
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => (
                <Calendar.YearPickerCell
                  year={year}
                  className="cursor-pointer rounded-md text-xs transition-colors data-[hovered=true]:bg-surface-200 data-[selected=true]:bg-brand-700 data-[selected=true]:text-white"
                />
              )}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

export default CustomDatePicker;
