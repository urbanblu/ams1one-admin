import { Checkbox, cn, Label } from "@heroui/react";

const CustomCheckboxItem = ({
  selected,
  label,
  labelClassName,
  isDisabled = false,
  setIsSelected,
}: {
  selected: boolean;
  label?: string;
  labelClassName?: string;
  isDisabled?: boolean;
  setIsSelected?: (isSelected: boolean) => void;
}) => {
  return (
    <Checkbox
      id={label}
      isSelected={selected}
      isDisabled={isDisabled}
      onChange={setIsSelected}
      className="cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
    >
      <Checkbox.Control className="rounded-sm border-border-strong transition-colors data-[selected=true]:border-brand-700 data-[selected=true]:bg-brand-700">
        <Checkbox.Indicator />
      </Checkbox.Control>
      {label && (
        <Checkbox.Content>
          <Label
            className={cn(
              "cursor-pointer select-none text-sm text-foreground-light",
              labelClassName,
            )}
          >
            {label}
          </Label>
        </Checkbox.Content>
      )}
    </Checkbox>
  );
};

export default CustomCheckboxItem;
