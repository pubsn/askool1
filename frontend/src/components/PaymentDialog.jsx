import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

const PROVIDERS = [
  { id: "orange_money", label: "Orange Money", accent: "#ee731f", initials: "OM" },
  { id: "wave", label: "Wave", accent: "#203c89", initials: "W" },
];

// payload: { purpose: "subscription"|"booking", plan?, audience?, booking_id? }
export const PaymentDialog = ({ open, onOpenChange, payload, amountLabel, onSuccess }) => {
  const [step, setStep] = useState("select"); // select | confirm
  const [provider, setProvider] = useState(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setStep("select"); setProvider(null); setPhone(""); setCode(""); setPayment(null); setBusy(false); };

  const close = (v) => { if (!v) reset(); onOpenChange(v); };

  const initiate = async () => {
    if (!provider) return toast.error("Choisissez un opérateur");
    if (!/^\d{9,}$/.test(phone.replace(/\s/g, ""))) return toast.error("Numéro de téléphone invalide");
    setBusy(true);
    try {
      const { data } = await api.post("/payments/initiate", { ...payload, provider, phone: phone.replace(/\s/g, "") });
      setPayment(data);
      setStep("confirm");
      toast.success(data.instructions || "Code de confirmation envoyé");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erreur lors de l'initiation du paiement");
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!/^\d{4}$/.test(code)) return toast.error("Saisissez le code à 4 chiffres");
    setBusy(true);
    try {
      await api.post(`/payments/${payment.payment_id}/confirm`, { code });
      toast.success("Paiement confirmé avec succès !");
      close(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Code invalide");
    } finally { setBusy(false); }
  };

  const displayAmount = payment ? `${(payment.amount || 0).toLocaleString()} ${payment.currency || "FCFA"}` : amountLabel;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent data-testid="payment-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Paiement Mobile Money</DialogTitle>
          <DialogDescription>{payload?.label || amountLabel}</DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  data-testid={`pay-provider-${p.id}`}
                  onClick={() => setProvider(p.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${provider === p.id ? "border-askool-orange bg-askool-orangelight" : "border-askool-border hover:border-askool-blue"}`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: p.accent }}>{p.initials}</span>
                  <span className="text-sm font-semibold text-gray-800">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-phone">Numéro de téléphone</Label>
              <Input id="pay-phone" data-testid="pay-phone-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="77 123 45 67" className="rounded-xl" inputMode="tel" />
            </div>
            {amountLabel && <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">Montant : <span className="font-semibold text-askool-blue">{amountLabel}</span></div>}
            <Button data-testid="pay-initiate-btn" onClick={initiate} disabled={busy} className="w-full rounded-xl bg-askool-orange font-semibold text-black hover:bg-askool-orangehover">
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Continuer"}
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-5">
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {payment?.instructions}
              <div className="mt-1">Montant : <span className="font-semibold text-askool-blue">{displayAmount}</span> · {payment?.provider}</div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-code">Code de confirmation (4 chiffres)</Label>
              <Input id="pay-code" data-testid="pay-code-input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" className="rounded-xl text-center text-lg tracking-[0.5em]" inputMode="numeric" />
            </div>
            <Button data-testid="pay-confirm-btn" onClick={confirm} disabled={busy} className="w-full rounded-xl bg-askool-blue font-semibold text-white hover:bg-askool-bluehover">
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Confirmer le paiement"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} /> Paiement sécurisé — mode démonstration</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
