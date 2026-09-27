"use client";

import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import PayoutsService, { IAdminPayout } from "@/api/payouts";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { cn, Form } from "@heroui/react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  PageShell,
  StatusBadge,
} from "@/components/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { usePageAccess } from "@/hooks/use-page-access";
import { LuBanknote, LuReceipt } from "react-icons/lu";

const PROVIDERS = [
  { key: "MTN", label: "MTN Mobile Money" },
  { key: "VOD", label: "Vodafone Cash" },
  { key: "ATL", label: "AirtelTigo Money" },
];

function AdminPayoutsView() {
  const { hasPage } = usePageAccess();
  const canSend = hasPage("admin_payouts.send");

  const [provider, setProvider] = useState<"MTN" | "VOD" | "ATL">("MTN");
  const [lastPayout, setLastPayout] = useState<IAdminPayout | null>(null);
  const [formKey, setFormKey] = useState(0);

  /* Mirrors of the uncontrolled fields. The form still submits from FormData —
     these only drive the summary and the submit gate, so money never depends
     on them being in sync. */
  const [amount, setAmount] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const { mutate: send, isPending } = useMutation({
    mutationFn: ({
      payload,
      key,
    }: {
      payload: Parameters<typeof PayoutsService.sendAdminPayout>[0];
      key: string;
    }) => PayoutsService.sendAdminPayout(payload, key),
    onSuccess: (data) => {
      ToastService.success({ text: "Payout initiated successfully." });
      setLastPayout(data);
      setAmount("");
      setMobileNumber("");
      setFormKey((k) => k + 1);
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to send payout." });
    },
  });

  const handleSubmit: React.ComponentProps<typeof Form>["onSubmit"] = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const amount = String(data.amount ?? "").trim();
    const mobile_number = String(data.mobile_number ?? "").trim();
    const recipient_name = String(data.recipient_name ?? "").trim();
    const description = String(data.description ?? "").trim();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      ToastService.error({ text: "Enter a valid amount." });
      return;
    }
    if (!mobile_number) {
      ToastService.error({ text: "Enter a mobile number." });
      return;
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    send({
      payload: {
        amount,
        mobile_number,
        mobile_provider: provider,
        recipient_name,
        description: description || undefined,
      },
      key: idempotencyKey,
    });
  };

  const parsedAmount = parseFloat(amount);
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isReady = amountIsValid && mobileNumber.trim().length > 0;
  const providerLabel =
    PROVIDERS.find((p) => p.key === provider)?.label ?? provider;

  if (!canSend) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-foreground-light">
        You don&apos;t have permission to access this page.
      </div>
    );
  }

  return (
    <PageShell narrow>
      {lastPayout && (
        <Card>
          <CardHeader
            icon={<LuReceipt />}
            title="Last payout"
            description={lastPayout.reference}
            action={<StatusBadge status={lastPayout.status} />}
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Amount"
                value={`USD ${lastPayout.amount}`}
                numeric
              />
              <Field label="Recipient" value={lastPayout.recipient_name} />
              <Field label="Mobile" value={lastPayout.mobile_number} ident />
              <Field
                label="Transfer code"
                value={lastPayout.paystack_transfer_code || "—"}
                ident
              />
            </div>
            {lastPayout.status === "pending" && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-700">
                Status is pending — it will flip to success or failed once
                Paystack confirms via webhook.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<LuBanknote />}
          title="Send a payout"
          description="Mobile money transfer — it leaves as soon as you send it."
        />

        <Form key={formKey} onSubmit={handleSubmit}>
          <div className="w-full">
            <CardBody className="space-y-4">
              {/* Amount is the consequential field, so it gets its own row and
                  a width that says "a figure", not "a sentence". */}
              <CustomInputComponent
                className="sm:max-w-[16rem]"
                label="Amount"
                name="amount"
                type="number"
                placeholder="0.00"
                prefixIcon={
                  <span className="text-xs font-medium text-foreground-light">
                    USD
                  </span>
                }
                onChange={(e) => setAmount(e.target.value)}
                isRequired
              />

              {/* One decision — which mobile money account — so one row. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <CustomInputComponent
                  label="Mobile number"
                  name="mobile_number"
                  type="tel"
                  onChange={(e) => setMobileNumber(e.target.value)}
                  isRequired
                />
                <CustomSelectComponent
                  label="Provider"
                  placeholder="Select provider"
                  showDropDownIcon
                  list={PROVIDERS}
                  initialItemKey="MTN"
                  onSelectionChange={(val) =>
                    setProvider(val.key as "MTN" | "VOD" | "ATL")
                  }
                />
              </div>

              <CustomInputComponent
                label="Recipient name"
                name="recipient_name"
                showPreficIcon={false}
                placeholder="Name on the mobile money account"
                isRequired
              />

              <CustomInputComponent
                label="Description (optional)"
                name="description"
                showPreficIcon={false}
                placeholder="What this payout is for"
                isRequired={false}
              />
            </CardBody>

            {/* The transfer is irreversible, so the confirm sits next to a
                plain-language restatement of what is about to happen rather
                than under a form the reader has to re-read. */}
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {isReady ? (
                <p className="min-w-0 leading-relaxed">
                  Sending{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    USD{" "}
                    {parsedAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>{" "}
                  to{" "}
                  <span className="font-ident text-foreground">
                    {mobileNumber.trim()}
                  </span>{" "}
                  on {providerLabel}.
                </p>
              ) : (
                <p className="text-foreground-lighter">
                  Enter an amount and a mobile number to continue.
                </p>
              )}

              <Button
                type="submit"
                className="shrink-0"
                disabled={!isReady}
                isPending={isPending}
              >
                <LuBanknote />
                {isPending ? "Sending…" : "Send payout"}
              </Button>
            </CardFooter>
          </div>
        </Form>
      </Card>
    </PageShell>
  );
}

export default AdminPayoutsView;

const Field = ({
  label,
  value,
  numeric,
  ident,
}: {
  label: string;
  value: React.ReactNode;
  /** Figures — aligns digits down the column. */
  numeric?: boolean;
  /** References and codes — reads as a value, not as prose. */
  ident?: boolean;
}) => (
  <div className="min-w-0">
    <p className="text-xs text-foreground-light">{label}</p>
    <p
      className={cn(
        "mt-0.5 truncate text-sm font-medium text-foreground",
        numeric && "tabular-nums",
        ident && "font-ident",
      )}
    >
      {value}
    </p>
  </div>
);
