import { useState } from "react";
import { Pencil, PlusCircle } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth-store";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import type { Enrollment } from "@/lib/types";

export default function StudentEnrollmentsPage() {
  const studentId = useAuthStore((s) => s.studentId);
  const {
    students,
    courses,
    enrollments,
    enroll,
    changeEnrollment,
    dropEnrollment,
  } = useEnrollmentStore();

  const [open, setOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<string | null>(null);
  const [editingEnrollment, setEditingEnrollment] =
    useState<Enrollment | null>(null);
  const [replacementCourse, setReplacementCourse] = useState<string | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const me = students.find((s) => s.studentId === studentId);
  const myEnrollments = enrollments.filter((e) => e.studentId === studentId);

  const courseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  const courseOf = (courseId: string) =>
    courses.find((c) => c.courseId === courseId);

  const replacementOptions = courses
    .filter(
      (course) =>
        course.courseId !== editingEnrollment?.courseId &&
        !myEnrollments.some(
          (enrollment) => enrollment.courseId === course.courseId,
        ),
    )
    .map((course) => ({
      value: course.courseId,
      label: `${course.courseId} — ${course.courseTitle}`,
    }));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFormCourse(null);
      setServerError(null);
      setEditingEnrollment(null);
      setReplacementCourse(null);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !formCourse) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await enroll(studentId, formCourse);
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeEnrollment = async () => {
    if (
      !editingEnrollment ||
      !replacementCourse ||
      replacementCourse === editingEnrollment.courseId
    ) {
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await changeEnrollment(
        editingEnrollment.studentId,
        editingEnrollment.courseId,
        replacementCourse,
      );
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDropEnrollment = async (enrollment: Enrollment) => {
    setActionError(null);
    try {
      await dropEnrollment(enrollment.studentId, enrollment.courseId);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">จัดการการลงทะเบียน</h1>
          <p className="text-sm text-muted-foreground">
            {me
              ? `${me.studentId} — ${me.firstName} ${me.lastName} (${me.program})`
              : (studentId ?? "-")}{" "}
            · ลงทะเบียนแล้ว {myEnrollments.length} วิชา
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button disabled={!studentId} />}>
            <PlusCircle className="h-4 w-4" />
            ลงทะเบียนเรียน
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกวิชาที่ยังไม่ได้ลงทะเบียน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="formCourse">วิชา</Label>
              <Select
                items={courseOptions}
                value={formCourse}
                onValueChange={(v) => setFormCourse(v as string)}
              >
                <SelectTrigger id="formCourse" className="w-full">
                  <SelectValue
                    placeholder={
                      courseOptions.length === 0
                        ? "ลงทะเบียนครบทุกวิชาแล้ว"
                        : "เลือกวิชา"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!formCourse || submitting}
                onClick={handleEnroll}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={Boolean(editingEnrollment)} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เปลี่ยนวิชาที่ลงทะเบียน</DialogTitle>
            <DialogDescription>
              เลือกวิชาใหม่แทน {editingEnrollment?.courseId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="replacementCourse">วิชาใหม่</Label>
            <Select
              items={replacementOptions}
              value={replacementCourse}
              onValueChange={(value) => setReplacementCourse(value as string)}
            >
              <SelectTrigger id="replacementCourse" className="w-full">
                <SelectValue
                  placeholder={
                    replacementOptions.length === 0
                      ? "ไม่มีวิชาอื่นให้เลือก"
                      : "เลือกวิชา"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {replacementOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <DialogFooter>
            <Button
              disabled={
                !replacementCourse ||
                replacementCourse === editingEnrollment?.courseId ||
                submitting
              }
              onClick={handleChangeEnrollment}
            >
              <Pencil className="h-4 w-4" />
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border">
        {actionError && (
          <p className="p-3 text-sm text-destructive">{actionError}</p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>ผู้สอน</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="w-28 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEnrollments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  ยังไม่ได้ลงทะเบียนวิชาใด
                </TableCell>
              </TableRow>
            )}
            {myEnrollments.map((e) => {
              const course = courseOf(e.courseId);
              return (
                <TableRow key={e.courseId}>
                  <TableCell>{e.courseId}</TableCell>
                  <TableCell>{course?.courseTitle ?? "-"}</TableCell>
                  <TableCell>{course?.instructors.join(", ") || "-"}</TableCell>
                  <TableCell>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`เปลี่ยนวิชา ${e.courseId}`}
                      onClick={() => {
                        setServerError(null);
                        setReplacementCourse(null);
                        setEditingEnrollment(e);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDeleteButton
                      label={`ยกเลิกการลงทะเบียน ${e.courseId}`}
                      title={`ยกเลิกวิชา ${e.courseId}?`}
                      description={`ยืนยันการยกเลิกการลงทะเบียนวิชา ${course?.courseTitle ?? e.courseId}`}
                      onConfirm={() => handleDropEnrollment(e)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
