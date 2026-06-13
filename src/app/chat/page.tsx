import Link from "next/link"
import { ReceiptText } from "lucide-react"

import Chat from "@/components/chat"
import { SakuShell } from "@/components/saku-shell"
import { Button } from "@/components/ui/button"
import { getSakuDataset } from "@/lib/saku-data"

export default async function ChatPage() {
  const dataset = await getSakuDataset()

  return (
    <SakuShell
      actions={
        <Button asChild variant="outline">
          <Link href="/transactions">
            <ReceiptText className="h-4 w-4" />
            Transaksi
          </Link>
        </Button>
      }
      mode={dataset.mode}
      subtitle="Asisten budget personal."
      title="Chat"
      userName={dataset.userName}
    >
      <Chat mode={dataset.mode} summary={dataset.aiSummary} />
    </SakuShell>
  )
}
