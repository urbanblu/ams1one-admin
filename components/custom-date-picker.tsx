import { cn, Label } from "@heroui/react";
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
        <Label
          className={cn(
            "mb-1.5 block text-xs font-medium text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </Label>
      )}
      <DateField.Group
        fullWidth
        className={cn(
          "h-11 rounded-xl border border-border bg-surface px-4 text-sm shadow-none transition-colors duration-200",
          "focus-within:border-primary focus-within:outline-none focus-within:ring-0",
          "data-[invalid=true]:border-destructive",
          className,
        )}
      >
        <DateField.Input className="text-sm text-foreground">
          {(segment) => (
            <DateField.Segment
              segment={segment}
              className="rounded-md px-0.5 data-[focused=true]:bg-primary-soft data-[focused=true]:text-primary-strong data-[placeholder=true]:text-zinc-400"
            />
          )}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger className="cursor-pointer text-zinc-400 transition-colors hover:text-foreground">
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="rounded-2xl border border-border-subtle p-2 shadow-lg shadow-zinc-200/60">
        <Calendar aria-label="Select date">
          <Calendar.Header>
            <Calendar.YearPickerTrigger className="cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-subtle">
              <Calendar.YearPickerTriggerHeading className="text-sm font-semibold text-foreground" />
              <Calendar.YearPickerTriggerIndicator className="text-zinc-400" />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton
              slot="previous"
              className="w-7 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-subtle"
            />
            <Calendar.NavButton
              slot="next"
              className="w-7 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-subtle"
            />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => (
                <Calendar.HeaderCell className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {day}
                </Calendar.HeaderCell>
              )}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell
                  date={date}
                  className={cn(
                    "cursor-pointer rounded-full p-0 text-xs transition-colors",
                    "data-[hovered=true]:bg-subtle",
                    "data-[today=true]:font-bold data-[today=true]:text-primary",
                    "data-[selected=true]:bg-primary data-[selected=true]:font-semibold data-[selected=true]:text-white",
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
                  className="cursor-pointer rounded-full text-xs transition-colors data-[hovered=true]:bg-subtle data-[selected=true]:bg-primary data-[selected=true]:text-white"
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
