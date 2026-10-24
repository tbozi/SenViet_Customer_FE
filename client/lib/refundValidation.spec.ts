import { describe, it, expect } from "vitest";

export interface RefundFormState {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  contactPhone: string;
  reason: string;
}

export function isRefundFormValid(form: RefundFormState): boolean {
  return (
    form.bankName.trim().length > 0 &&
    form.accountNumber.trim().length >= 6 &&
    form.accountHolder.trim().length >= 2 &&
    form.contactPhone.trim().length >= 9 &&
    form.reason.trim().length >= 5
  );
}

describe("Customer Refund Form Validation", () => {
  it("should unlock submit button only when all 5 required fields are valid", () => {
    const validForm: RefundFormState = {
      bankName: "MB Bank",
      accountNumber: "0989809036",
      accountHolder: "NGUYEN VAN A",
      contactPhone: "0989809036",
      reason: "Bận việc đột xuất không thể nhận phòng đúng lịch",
    };
    expect(isRefundFormValid(validForm)).toBe(true);
  });

  it("should block submission if bankName is missing or whitespace only", () => {
    const invalidForm: RefundFormState = {
      bankName: "   ",
      accountNumber: "0989809036",
      accountHolder: "NGUYEN VAN A",
      contactPhone: "0989809036",
      reason: "Bận việc đột xuất",
    };
    expect(isRefundFormValid(invalidForm)).toBe(false);
  });

  it("should block submission if accountNumber is shorter than 6 digits", () => {
    const invalidForm: RefundFormState = {
      bankName: "Vietcombank",
      accountNumber: "123",
      accountHolder: "NGUYEN VAN A",
      contactPhone: "0989809036",
      reason: "Bận việc đột xuất",
    };
    expect(isRefundFormValid(invalidForm)).toBe(false);
  });

  it("should block submission if phone is invalid or too short", () => {
    const invalidForm: RefundFormState = {
      bankName: "Vietcombank",
      accountNumber: "123456789",
      accountHolder: "NGUYEN VAN A",
      contactPhone: "090",
      reason: "Bận việc đột xuất",
    };
    expect(isRefundFormValid(invalidForm)).toBe(false);
  });

  it("should block submission if reason is empty or less than 5 characters", () => {
    const invalidForm: RefundFormState = {
      bankName: "Vietcombank",
      accountNumber: "123456789",
      accountHolder: "NGUYEN VAN A",
      contactPhone: "0989809036",
      reason: "Hủy",
    };
    expect(isRefundFormValid(invalidForm)).toBe(false);
  });
});
