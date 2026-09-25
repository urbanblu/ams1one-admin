import { cn, Label, ListBox, Select } from "@heroui/react";
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
          <Label
            className={cn(
              "mb-1.5 block text-xs font-medium text-muted-foreground",
              labelClassName,
            )}
          >
            {label}
          </Label>
        )}
        <Select.Trigger
          className={cn(
            "h-11 cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm shadow-none transition-colors",
            "data-[hovered=true]:border-zinc-300 data-[focused=true]:border-primary data-[pressed=true]:border-primary",
            "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60",
          )}
        >
          <Select.Value className="text-sm text-foreground" />
          {(showDropDownIcon || endContent) && (
            <Select.Indicator>
              {endContent ?? <LuChevronDown className="size-4 text-zinc-400" />}
            </Select.Indicator>
          )}
        </Select.Trigger>
        <Select.Popover
          shouldFlip={shouldFlip}
          className="rounded-2xl border border-border-subtle p-1.5 shadow-lg shadow-zinc-200/60"
        >
          <ListBox className="text-sm">
            {list.map((item) => (
              <ListBox.Item
                key={item.key}
                id={item.key}
                textValue={item.label}
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors",
                  "data-[hovered=true]:bg-subtle data-[hovered=true]:text-foreground",
                  "data-[selected=true]:bg-primary-soft data-[selected=true]:font-semibold data-[selected=true]:text-primary-strong",
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
