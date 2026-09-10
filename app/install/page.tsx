import type { Metadata } from "next";
import { InstallApp } from "@/components/InstallApp";

export const metadata: Metadata = {
  title: "نصب اپ | Sokout",
  description: "اپلیکیشن Sokout را روی دستگاهت نصب کن",
};

export default function InstallPage() {
  return (
    <div dir="rtl" lang="fa">
      <InstallApp />
    </div>
  );
}
