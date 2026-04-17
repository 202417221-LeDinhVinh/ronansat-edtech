"use client";

import { useRouter } from "next/navigation";

import CreateQuestionForm from "@/components/admin/CreateQuestionForm";
import CreateStudentForm from "@/components/admin/CreateStudentForm";
import CreateTestForm from "@/components/admin/CreateTestForm";

type TestOption = {
  _id: string;
  title: string;
};

export default function AdminDashboardClient({ tests }: { tests: TestOption[] }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper-bg p-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="workbook-panel-muted overflow-hidden">
          <div className="border-b-4 border-ink-fg bg-paper-bg px-6 py-5">
            <div className="workbook-sticker bg-accent-3 text-white">Admin Desk</div>
            <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-ink-fg">
              Manage tests, questions, and showcase students.
            </h1>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <CreateTestForm onSuccess={() => router.refresh()} />
          <CreateQuestionForm tests={tests} />
        </div>

        <CreateStudentForm />
      </div>
    </div>
  );
}
