# SEN VIỆT HOTEL - CUSTOMER FRONTEND GUIDELINES
<!-- Quy chuẩn lập trình Tối giản & Kỷ luật cao (Karpathy + Ponytail Standard) -->

This file defines the strict behavioral rules and coding guidelines for AI agents working on the Sen Việt Customer Web Frontend repository.

---

## 1. COMMUNICATION & LANGUAGE (GIAO TIẾP VỚI LẬP TRÌNH VIÊN)
- **Developer Communication**: Always reply to the developer in Vietnamese (Tiếng Việt) clearly, honestly, and concisely.
- **End of Response**: End every reply with 1-2 lines summarizing: (1) exact files/lines modified, (2) what was skipped or untouched, (3) any edge-case risks.
- **Customer Chatbot Multilingual Behavior**: The customer chat widget communicates with guests dynamically. It defaults to Vietnamese but MUST automatically detect and adapt to foreign languages (English, Chinese, Japanese, Korean, etc.) based on the customer's input.

---

## 2. ANDREJ KARPATHY 4 GOLDEN RULES (4 NGUYÊN TẮC VÀNG KARPATHY)

### Rule 1: Think Before Coding (Suy nghĩ trước khi gõ phím)
- Never assume user requirements or guess blindly. If unclear, stop and ask.
- When multiple architectural or UI approaches exist, state the tradeoffs explicitly before implementing.
- If a simpler approach exists, propose it before coding.

### Rule 2: Simplicity First (Tối giản là trên hết)
- Minimum code that solves the problem. Nothing speculative.
- No unused abstractions, helper wrappers, or extra configuration for single-use logic.
- Do NOT install new npm packages when native browser APIs or existing packages already do the job.
- If you write 150 lines and it can be done cleanly in 40 lines, rewrite it.

### Rule 3: Surgical Changes (Can thiệp chuẩn xác như phẫu thuật)
- Touch ONLY what is necessary to solve the issue. Keep blast radius minimal.
- Do NOT "improve" or reformat adjacent code, untouched components, or existing comments.
- Match the existing codebase style, Tailwind CSS patterns, and React state conventions.
- Clean up only your own orphans (unused imports/variables that your edit created).

### Rule 4: Goal-Driven Execution (Làm việc theo mục tiêu kiểm chứng được)
- Transform tasks into verifiable criteria before declaring completion.
- Verify changes directly against the running development server (Port 8080).

---

## 3. PONYTAIL SENIOR DEV PRINCIPLES (TƯ DUY SENIOR LƯỜI)
- *"The best code is the code never written."* (Dòng code tốt nhất là dòng code không bao giờ phải viết).
- Deletion beats addition.
- Decision hierarchy before writing new code:
  1. Does this feature/code actually need to exist? Skip unrequested options.
  2. Already in this codebase? Reuse existing UI components (`components/ui/*`), hooks, and utilities.
  3. Standard browser/React feature? Use native React APIs.
  4. Installed npm dependency? Use existing icons (`lucide-react`), utilities (`clsx`, `tailwind-merge`).

---

## 4. PROJECT ARCHITECTURE & RUNTIME
- **Tech Stack**: React 18, Vite, TypeScript, TailwindCSS 3, Lucide React, Radix UI.
- **Dev Server Port**: `8080` (`npm run dev`)
- **Key Modules**:
  - `client/components/ChatWidget.tsx`: Customer AI chatbot & live receptionist chat widget.
  - `client/pages/`: Main booking routes (Home, Hotel Detail, Checkout, Payment Success).
  - `client/services/`: API integration with Spring Boot BE (8081) and AI Service (8000).
