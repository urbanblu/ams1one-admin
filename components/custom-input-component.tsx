import Helpers from "@/utils/helpers";
import { fieldLabelClass } from "@/components/ui/field-label";
import {
  CloseButton,
  cn,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import React, { useCallback, useRef, useState } from "react";
import { LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";

type Props = {
  id?: string;
  name?: string;
  label?: string;
  type?:
    | "password"
    | "text"
    | "search"
    | "url"
    | "tel"
    | "email"
    | (string & {})
    | undefined;
  placeholder?: string;
  description?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  defaultValue?: string;
  className?: string;
  validate?:
    | ((value: string) => string | string[] | true | null | undefined)
    | undefined;
  isRequired?: boolean;
  minLength?: number;
  isEmail?: boolean;
  showPreficIcon?: boolean;
  showSuffixIcon?: boolean;
  showLabel?: boolean;
  showPlaceholder?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

function CustomInputComponent({
  label,
  minLength,
  placeholder,
  name,
  id,
  validate,
  prefixIcon,
  suffixIcon,
  className,
  description,
  type,
  isRequired,
  showLabel = true,
  showPlaceholder = true,
  showSuffixIcon = true,
  showPreficIcon = true,
  defaultValue,
  onChange,
}: Props) {
  const [showing, showPassword] = useState<boolean>(false);
  const [hasSubmittedParentForm, setHasSubmittedParentForm] = useState(false);
  const [formAssociation, setFormAssociation] = useState<
    "unknown" | "inside" | "outside"
  >("unknown");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formListenersCleanupRef = useRef<(() => void) | null>(null);

  const setInputElement = useCallback((el: HTMLInputElement | null) => {
    formListenersCleanupRef.current?.();
    formListenersCleanupRef.current = null;
    inputRef.current = el;

    if (!el) {
      setFormAssociation("unknown");
      return;
    }

    setFormAssociation(el.form ? "inside" : "outside");

    const form = el.form;
    if (!form) return;

    const handleSubmit = () => setHasSubmittedParentForm(true);
    const handleInvalid = () => setHasSubmittedParentForm(true);
    const handleReset = () => setHasSubmittedParentForm(false);

    // Native validation cancels submit, so "submit" never fires — listen for "invalid" too
    // so error UI (FieldError, borders) can show after a blocked submit.
    form.addEventListener("submit", handleSubmit);
    form.addEventListener("invalid", handleInvalid, true);
    form.addEventListener("reset", handleReset);
    formListenersCleanupRef.current = () => {
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener("invalid", handleInvalid, true);
      form.removeEventListener("reset", handleReset);
    };
  }, []);

  const startContent = (() => {
    if (!showPreficIcon) return undefined;

    if (type == "email") {
      return <LuMail className="size-3.5 text-foreground-muted" />;
    }

    if (type == "password") {
      return <LuLock className="size-3.5 text-foreground-muted" />;
    }

    return prefixIcon;
  })();

  const endContent = (() => {
    if (!showSuffixIcon) return undefined;

    if (type == "password") {
      return (
        <CloseButton
          className="mr-1 bg-transparent text-foreground-muted transition-colors hover:text-foreground"
          onPress={() => showPassword(!showing)}
        >
          <InputGroup.Suffix>
            {showing ? (
              <LuEyeOff className="size-3.5" />
            ) : (
              <LuEye className="size-3.5" />
            )}
          </InputGroup.Suffix>
        </CloseButton>
      );
    }

    return suffixIcon;
  })();

  const labelText = (() => {
    if (!showLabel) return;

    if (type == "email") return "Email";
    if (type == "password") {
      if (showLabel && label) return label;
      return "Password";
    }

    return label;
  })();

  const placeholderText = (() => {
    if (!showPlaceholder) return;
    // An explicit placeholder outranks the per-type default: a caller that
    // named one has a better one in mind than "Enter your email".
    if (placeholder) return placeholder;
    if (type == "email") return "Enter your email";
    if (type == "password") return "Enter password";

    return placeholder;
  })();

  return (
    <TextField
      isRequired={isRequired}
      name={name}
      defaultValue={defaultValue}
      validationBehavior="native"
      type={
        type == "password"
          ? (() => {
              if (showing) return "text";
              return "password";
            })()
          : type
      }
      validate={
        validate
          ? validate
          : (value) => Helpers.getTextFieldValidation({ value, type })
      }
    >
      {({ isInvalid }) => {
        const showInvalidState =
          formAssociation === "outside"
            ? isInvalid
            : hasSubmittedParentForm && isInvalid;

        return (
          <>
            {labelText && (
              <Label
                className={cn(
                  fieldLabelClass,
                  showInvalidState && "text-destructive!",
                )}
                htmlFor={id}
              >
                {labelText}
              </Label>
            )}
            <InputGroup
              className={cn(
                "h-9 items-center bg-surface border border-solid rounded-md px-3 transition-colors duration-200",
                "focus-within:outline-none shadow-none focus-within:ring-2 focus-within:ring-brand-500/20",
                // HeroUI's .input-group__input adds its own px-3 py-2; zero it
                // so the group's own h-11/px-4 is what actually measures.
                "[&_input]:px-0 [&_input]:py-0 [&_input]:h-full",
                showInvalidState
                  ? "border-destructive! focus-within:border-destructive!"
                  : "border-border-strong focus-within:border-brand-500",
                className,
              )}
            >
              {startContent && (
                <InputGroup.Prefix>{startContent}</InputGroup.Prefix>
              )}
              <InputGroup.Input
                id={id}
                ref={setInputElement}
                minLength={minLength}
                placeholder={placeholderText}
                onChange={onChange}
                onKeyDown={
                  type === "tel"
                    ? (e) => {
                        const allowed = /^[0-9+\-\s()]$/;
                        if (
                          !allowed.test(e.key) &&
                          ![
                            "Backspace",
                            "Delete",
                            "ArrowLeft",
                            "ArrowRight",
                            "ArrowUp",
                            "ArrowDown",
                            "Tab",
                            "Home",
                            "End",
                          ].includes(e.key) &&
                          !e.metaKey &&
                          !e.ctrlKey
                        ) {
                          e.preventDefault();
                        }
                      }
                    : undefined
                }
                onPaste={
                  type === "tel"
                    ? (e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text");
                        const sanitized = pasted.replace(/[^0-9+\-\s()]/g, "");
                        const el = e.currentTarget;
                        const start = el.selectionStart ?? el.value.length;
                        const end = el.selectionEnd ?? el.value.length;
                        const next =
                          el.value.slice(0, start) +
                          sanitized +
                          el.value.slice(end);
                        const nativeInputValueSetter =
                          Object.getOwnPropertyDescriptor(
                            window.HTMLInputElement.prototype,
                            "value",
                          )?.set;
                        nativeInputValueSetter?.call(el, next);
                        el.dispatchEvent(new Event("input", { bubbles: true }));
                        el.setSelectionRange(
                          start + sanitized.length,
                          start + sanitized.length,
                        );
                      }
                    : undefined
                }
                className="text-sm text-foreground placeholder:text-sm placeholder:text-foreground-lighter focus:outline-none focus:ring-0 shadow-none"
              />
              {!!endContent && endContent}
            </InputGroup>
            {description && (
              <Description className="mt-1.5 text-xs text-foreground-light">
                {description}
              </Description>
            )}
            {(formAssociation === "outside" || hasSubmittedParentForm) && (
              <FieldError className="mt-1.5 text-xs text-destructive" />
            )}
          </>
        );
      }}
    </TextField>
  );
}

export default CustomInputComponent;
