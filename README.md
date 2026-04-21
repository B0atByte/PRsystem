# Casa Lapin — ระบบขอซื้อสินค้า (Purchase Request System)

ระบบจัดการใบขอซื้อสำหรับร้านอาหาร Casa Lapin รองรับ 5 บทบาท มี workflow อนุมัติ 3 ขั้นตอน ระบบแนบไฟล์จริง และ tracking สถานะแบบ real-time

---

## สถานะการพัฒนา

> **ปัจจุบันอยู่ Phase 2 (เสร็จแล้ว) — กำลังเข้าสู่ Phase 3**

| Phase | ชื่อ | รายละเอียด | สถานะ |
|-------|------|-----------|--------|
| **1** | Backend Foundation | Docker + MySQL + Prisma + JWT + API Routes ทั้งหมด | ✅ เสร็จ |
| **2** | Frontend → API | เชื่อม frontend ทุก action ไป real API + ระบบไฟล์แนบ + role permissions | ✅ เสร็จ |
| **3** | Dashboard & Reports | Dashboard ดึงข้อมูลจริง, กราฟสถิติ real-time | ⬜ ถัดไป |
| **4** | Polish & UX | Validation เพิ่มเติม, error handling, loading states | ⬜ |
| **5** | PDF Generation | ออก PDF ใบขอซื้อ, PR, PO | ⬜ |
| **6** | Testing + Deploy | End-to-end test, Nginx, Production Docker | ⬜ |

---

## ภาพรวมระบบ

```
พนักงาน: สร้างใบขอซื้อ
    ↓
[pending] — รอฝ่ายจัดซื้อ
    ↓ ฝ่ายจัดซื้อ: ออก PR/PO + แนบเอกสาร
[purchasing] — รอส่งต่อบัญชี
    ↓ ฝ่ายจัดซื้อ: Forward ไปบัญชี
[accounting] — รอโอนเงิน
    ↓ ฝ่ายบัญชี: บันทึก Transfer Ref + แนบสลิป
[transferred] ✓ เสร็จสิ้น

(ปฏิเสธได้ทุกขั้น → rejected)
```

---

## Tech Stack

### Frontend
| ส่วน | เทคโนโลยี |
|------|----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Routing | useState (ไม่ใช้ router library) |

### Backend
| ส่วน | เทคโนโลยี |
|------|----------|
| Runtime | Node.js 20 |
| Framework | Hono |
| ORM | Prisma |
| Database | MySQL 8.0 |
| Auth | JWT + bcryptjs |
| File Storage | Local disk (`backend/uploads/`) |

### Infrastructure
| ส่วน | เทคโนโลยี |
|------|----------|
| Container | Docker + Docker Compose |
| DB Admin | phpMyAdmin |
| Dev Proxy | Vite proxy (`/api` → `localhost:3000`) |

---

## วิธีรัน (Development)

### ต้องติดตั้งก่อน
- Docker Desktop
- Node.js 20+

### 1. Clone และตั้งค่า
```bash
git clone https://github.com/B0atByte/mockup-PRsystem.git
cd mockup-PRsystem
```

สร้างไฟล์ `.env` ที่ root:
```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=pr_system
MYSQL_USER=pruser
MYSQL_PASSWORD=prpassword
JWT_SECRET=your-secret-key
```

### 2. รัน Backend + Database
```bash
docker compose up -d
```

### 3. Seed ข้อมูลตัวอย่าง (ครั้งแรก)
```bash
docker exec pr_backend npx prisma db push
docker exec pr_backend npm run db:seed
```

### 4. รัน Frontend
```bash
cd app
npm install
npm run dev
```

เปิดที่ `http://localhost:5173`

### รันให้เครื่องอื่นใน LAN เข้าได้
Vite ตั้งค่า `host: true` ไว้แล้ว — เปิด `http://<IP เครื่อง>:5173` จากเครื่องอื่นได้เลย

> **หมายเหตุ:** ต้องเพิ่ม Firewall rule ให้ port 5173 ก่อน (port 3000 Docker จัดการให้อัตโนมัติ)
> ```powershell
> New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
> ```

---

## Services และ Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Hono) | 3000 | http://localhost:3000 |
| MySQL | 3306 | — |
| phpMyAdmin | 8080 | http://localhost:8080 |

---

## บัญชีผู้ใช้เริ่มต้น

> รหัสผ่านทุก account: **1234**

| Username | บทบาท | สิทธิ์หลัก |
|----------|-------|-----------|
| `owner` | ผู้ประกอบการ | ดูภาพรวม, รายงาน, คำขอทั้งหมด |
| `employee` | พนักงาน | สร้างใบขอซื้อ, ติดตามสถานะ |
| `emp2` | พนักงาน | สร้างใบขอซื้อ, ติดตามสถานะ |
| `purchasing` | ฝ่ายจัดซื้อ | อนุมัติ, ออก PR/PO, แนบเอกสาร, ส่งต่อบัญชี |
| `accounting` | บัญชี | บันทึกการโอนเงิน, แนบสลิป, ประวัติการโอน |
| `itsupport` | IT Support | จัดการผู้ใช้, Audit Log, ตั้งค่าเว็บไซต์ |

---

## หน้าจอหลัก

| หน้า | เข้าถึงได้โดย |
|------|-------------|
| แดชบอร์ด | owner, itsupport |
| ติดตามคำขอ | **ทุก role** |
| สร้างใบขอซื้อ | employee |
| คำขอของฉัน | employee |
| รายการรออนุมัติ | purchasing, itsupport |
| ออก PR/PO | purchasing |
| ส่งต่อบัญชี | purchasing |
| รายการรอโอนเงิน | accounting, itsupport |
| บันทึกการโอนเงิน | accounting |
| ประวัติการโอน | accounting, itsupport |
| คำขอทั้งหมด | owner, itsupport |
| รายงานสรุป | owner |
| จัดการผู้ใช้ | itsupport |
| Audit Log | itsupport |
| **ตั้งค่าเว็บไซต์** | itsupport |

---

## Features ที่ทำเสร็จแล้ว

- ✅ Authentication ด้วย JWT (login/logout/auto-login)
- ✅ Role-based access control (5 roles)
- ✅ Workflow ใบขอซื้อ 4 ขั้นตอน (pending → purchasing → accounting → transferred)
- ✅ แนบไฟล์จริง (PR, PO, สลิปโอนเงิน) — อัปโหลดไปเก็บบน server
- ✅ แสดงผู้แนบไฟล์ + role + เวลาที่แนบ
- ✅ Tracking timeline ทุก role
- ✅ Audit Log บันทึกทุก action
- ✅ จัดการผู้ใช้ (เพิ่ม/แก้ไข/ลบ/reset password)
- ✅ ตั้งค่าโลโก้และชื่อเว็บไซต์ผ่าน IT Support
- ✅ Dark mode
- ✅ รองรับ LAN (เครื่องอื่นในวงเดียวกันเข้าได้)

---

## โครงสร้างโปรเจ็ค

```
prs/
├── docker-compose.yml
├── .env                    # credentials (git ignored)
├── README.md
├── CLAUDE.md               # สารบัญสำหรับ AI agent
├── app/                    # Frontend
│   ├── src/
│   │   ├── App.tsx         # Components ทั้งหมด
│   │   ├── data.ts         # Types
│   │   ├── lib/api.ts      # API client
│   │   └── index.css
│   ├── public/
│   │   └── favicon.png
│   └── package.json
└── backend/                # Backend
    ├── src/
    │   ├── index.ts        # Hono server
    │   ├── routes/         # auth, requests, users, audit, files, settings
    │   ├── middleware/      # JWT auth
    │   └── lib/            # prisma, jwt
    ├── prisma/
    │   └── schema.prisma
    ├── uploads/            # ไฟล์ที่ผู้ใช้อัปโหลด
    └── Dockerfile
```
