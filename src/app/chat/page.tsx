import Link from "next/link";

import Chat from "@/components/chat";
import { SakuShell } from "@/components/saku-shell";
import { Button } from "@/components/ui/button";
import { getSakuDataset } from "@/lib/saku-data";

export default async function ChatPage() {
  const dataset = await getSakuDataset();

  return (
    <SakuShell
      actions={
        <Button asChild variant="outline">
          <Link href="/transactions">Lihat data transaksi</Link>
        </Button>
      }
      mode={dataset.mode}
      subtitle="Gunakan percakapan natural untuk minta saran hemat yang langsung mengacu pada ringkasan keuanganmu."
      title="Chat Saku AI"
      userName={dataset.userName}
    >
      <Chat mode={dataset.mode} summary={dataset.aiSummary} />
    </SakuShell>
  );
}
