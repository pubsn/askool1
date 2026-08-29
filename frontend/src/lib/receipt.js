import { API_ROOT } from "@/lib/api";

// Downloads the payment receipt PDF using the authenticated session (cookies).
export async function downloadReceipt(paymentId) {
  const res = await fetch(`${API_ROOT}/payments/${paymentId}/receipt`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Reçu indisponible");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recu-askool-${paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
