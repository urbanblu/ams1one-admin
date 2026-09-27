import { cn, Label, ListBox, Select } from "@heroui/react";
import { fieldLabelClass } from "@/components/ui/field-label";
import { LuChevronDown } from "react-icons/lu";
import React from "react";

type Props = {
  list: { key: string; label: string }[];
  initialItemKey?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  shouldFlip?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  endContent?: React.ReactNode;
  selectionMode?: "single" | "multiple";
  onSelectionChange: (value: { key: string; label: string }) => void;
  showDropDownIcon?: boolean;
  renderItem?: (item: { key: string; label: string }) => React.ReactNode;
};

export default function CustomSelectComponent({
  list,
  onSelectionChange,
  label,
  initialItemKey,
  placeholder,
  isRequired,
  className,
  labelClassName,
  selectionMode,
  isDisabled,
  endContent,
  shouldFlip,
  renderItem,
  showDropDownIcon = true,
}: Props) {
  const [value, setValue] = React.useState(initialItemKey);

  const handleSelectionChange = (key: React.Key | null) => {
    if (key == null) return;
    const selectedKey = String(key);

    const item = list.find((entry) => entry.key === selectedKey);

    if (item) {
      setValue(item.key);
      onSelectionChange({
        key: item.key,
        label: item.label,
      });
    }
  };

  return (
    <div className="relative w-full">
      <Select
        isRequired={isRequired}
        className={className}
        defaultSelectedKey={initialItemKey}
        selectedKey={value}
        selectionMode={selectionMode}
        placeholder={placeholder}
        isDisabled={isDisabled}
        onSelectionChange={handleSelectionChange}
      >
        {label && (
          <Label className={cn(fieldLabelClass, labelClassName)}>{label}</Label>
        )}
        <Select.Trigger
          className={cn(
            "h-9 cursor-pointer rounded-md border border-border-strong bg-surface px-3 text-sm shadow-none transition-colors",
            "data-[hovered=true]:border-border-stronger data-[focused=true]:border-brand-500 data-[focused=true]:ring-2 data-[focused=true]:ring-brand-500/20 data-[pressed=true]:border-brand-500",
            "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60",
          )}
        >
          <Select.Value className="text-sm text-foreground" />
          {(showDropDownIcon || endContent) && (
            <Select.Indicator>
              {endContent ?? (
                <LuChevronDown className="size-3.5 text-foreground-muted" />
              )}
            </Select.Indicator>
          )}
        </Select.Trigger>
        <Select.Popover
          shouldFlip={shouldFlip}
          className="rounded-md border border-border p-1 shadow-overlay"
        >
          <ListBox className="text-sm">
            {list.map((item) => (
              <ListBox.Item
                key={item.key}
                id={item.key}
                textValue={item.label}
                className={cn(
                  "cursor-pointer rounded-sm px-2.5 py-1.5 text-sm text-foreground-light transition-colors",
                  "data-[hovered=true]:bg-surface-200 data-[hovered=true]:text-foreground",
                  "data-[selected=true]:bg-surface-200 data-[selected=true]:font-medium data-[selected=true]:text-foreground",
                )}
              >
                {renderItem ? renderItem(item) : item.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
