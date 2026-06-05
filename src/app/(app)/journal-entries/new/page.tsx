import { PageHeader } from "@/components/ui/PageHeader";
import { JournalEntryForm } from "../_components/JournalEntryForm";

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="仕訳入力"
        description="新規仕訳を入力してください"
      />
      <JournalEntryForm />
    </div>
  );
}
