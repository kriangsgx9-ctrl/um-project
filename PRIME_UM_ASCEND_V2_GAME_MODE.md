# PRIME UM ASCEND — V2 "Game Mode"
## Handoff spec สำหรับ Claude Code

> Version: 2.0 (ต่อยอดจาก MVP v1)
> ภาษา UI: ไทยเป็นหลัก ใช้คำอังกฤษเฉพาะคำเฉพาะของผลิตภัณฑ์
> ไฟล์อ้างอิงในชุดนี้:
> - `PRIME_UM_ASCEND_CLAUDE_CODE.md` — spec ต้นฉบับ v1 (ยังใช้เป็นฐานทั้งหมด)
> - `prototype/prime-um-ascend.html` — prototype ที่ทำงานได้จริง (single-file, localStorage) ใช้เป็นต้นแบบ UX และ business logic

---

# 0. สรุปสำหรับ Claude Code (อ่านก่อน)

เป้าหมายของ V2 คือทำให้แอป **ใช้ง่ายขึ้น** และ **สนุกเหมือนเล่นเกม** โดยที่เนื้อหาการพัฒนาผู้นำยังจริงจังและตรวจสอบได้

หลักคิดเดียวที่ต้องรักษาไว้ตลอด:

> **Game feel, business substance** — เกมเป็นเปลือกที่ทำให้อยากกลับมาใช้ทุกวัน แต่ทุกคะแนนต้องผูกกับพฤติกรรมจริงที่ทำให้คนเข้าใกล้ UM

ข้อสำคัญ:
1. Spec v1 ข้อ 37 เคยกำหนดว่า gamification ต้อง "subtle" — **V2 ตั้งใจเปลี่ยนเป็น game-like เต็มรูปแบบ** แต่ต้องมี **Professional Mode** (ข้อ 9) ที่ปิดองค์ประกอบเกมได้ สำหรับนำเสนอผู้บริหาร
2. XP, Level, Badge **ไม่ใช่เกณฑ์เลื่อนตำแหน่ง** และห้ามนำไปแทน Internal UM Readiness หรือเกณฑ์ทางการของบริษัท
3. Business logic จาก prototype ใช้ต่อได้เลย (ดูข้อ 12) ห้ามคิดสูตรใหม่โดยไม่จำเป็น
4. Stack ตาม spec v1 ข้อ 31 (Next.js, TypeScript, Tailwind, shadcn/ui, Prisma, PostgreSQL, Auth.js)

---

# 1. ปัญหาที่ V2 ต้องแก้

จากการทดลองใช้ prototype:

| ปัญหา | แนวทางใน V2 |
|---|---|
| เมนูเยอะ ผู้ใช้ไม่รู้จะเริ่มตรงไหน | หน้าแรกเหลือปุ่มหลักปุ่มเดียว: **"ภารกิจถัดไป"** |
| การบันทึกข้อมูล (KPI, ผู้สมัคร) ต้องกดหลายขั้น | **Quick Log** แบบ bottom sheet บันทึกได้ใน 2 แตะ |
| ความคืบหน้าดูเป็นตัวเลข ไม่มีแรงจูงใจ | XP, Level, Streak, Boss Gate, การฉลองเมื่อสำเร็จ |
| งานยาวหลายสัปดาห์ รู้สึกไม่เห็นผล | แตกงานใหญ่เป็น **Daily Missions** ที่เสร็จได้ในวันเดียว |
| โค้ชให้กำลังใจได้แค่ผ่านคอมเมนต์ | **Kudos** และ Coach Quest ที่มี XP รางวัล |

---

# 2. โลกของเกม: The Ascent

เส้นทาง 180 วันเปรียบเป็น **การปีนภูเขาสู่ยอด UM**

| Phase | ชื่อโซน | ธีมภาพ | Boss (Gate) |
|---|---|---|---|
| 01 DISCOVER | Base Camp | เต็นท์ แผนที่ เข็มทิศ | Discover Gate — "ผู้พิทักษ์วิสัยทัศน์" |
| 02 BUILD | Training Ridge | ลานฝึก เชือก อุปกรณ์ | Build Gate |
| 03 PRODUCE | Forge Valley | โรงตีเหล็ก ประกายไฟ | Produce Gate |
| 04 RECRUIT | Signal Peak | หอสัญญาณ ธงเรียกพวก | Recruit Gate |
| 05 LEAD | Summit Trail | กลุ่มนักปีนผูกเชือกเดียวกัน | Lead Gate |
| 06 PROVE | Final Ascent | พายุหิมะ แสงยอดเขา | Promotion Gate |
| — | UM Summit | ธงส้มบนยอดเขา | — |

## 2.1 World Map (หน้าแรกของ Future UM)
- ภาพภูเขาแนวตั้ง เลื่อนดูได้ (mobile-first) มีเส้นทางคดเคี้ยวผ่าน 6 โซน
- ตัวละคร (avatar) ของผู้ใช้ยืนอยู่ตำแหน่งจริงตาม % ความคืบหน้า
- โซนที่ผ่านแล้วมีสีเต็ม โซนปัจจุบันมีแสงส้มและ animation เบา ๆ โซนถัดไปเป็นเงา/หมอก
- แตะโซน → เปิด Zone Detail (เดิมคือ Phase Detail)
- วาดด้วย SVG แบบเลเยอร์ (ฉากหลัง, ภูเขา, เส้นทาง, ตัวละคร) ไม่ใช้รูปภาพจากภายนอก

---

# 3. Core Game Loop

```
เปิดแอป → เห็นภารกิจถัดไป 1 อย่าง → ทำ → ส่งหลักฐาน/บันทึก
→ ได้ XP ทันที (ส่วนหนึ่ง) → โค้ชยืนยัน → ได้ XP เต็ม + ฉลอง
→ Boss HP ลด → Level up / Badge → ภารกิจถัดไป
```

## 3.1 Missions (เดิมคือ Actions)

| ประเภท | ที่มา | ไอคอน/สี |
|---|---|---|
| **Main Quest** | Action ที่เป็น Required ของ Phase | ดาวส้ม |
| **Side Quest** | Action ที่เป็น Optional | ดาวเทา |
| **Coach Quest** | งานที่โค้ชมอบหมาย (มี XP โบนัสที่โค้ชกำหนด) | รูปนกหวีด |
| **Daily Mission** | ระบบสร้างให้ 3 ข้อทุกวัน | ปฏิทิน |
| **Weekly Challenge** | 1 ข้อต่อสัปดาห์ ท้าทายกว่า | ถ้วย |

**Daily Missions** สร้างจาก logic เดิม `todayItems()` และ `weeklyPriorities()` ใน prototype แล้วแปลงเป็นงานเล็กที่ทำเสร็จได้ในวันเดียว เช่น
- "โทรหาผู้สมัคร 2 คน" (จาก candidate ที่ next action ถึงกำหนด)
- "บันทึก KPI เมื่อวาน" (ถ้ายังไม่บันทึก)
- "อ่าน feedback โค้ชและกดรับทราบ"
- "ทำ Main Quest ต่ออีก 1 ขั้น"

กติกา: 3 ข้อต่อวัน, ต้องทำได้จริงภายในวันนั้น, ไม่ซ้ำเกิน 2 วันติด

## 3.2 XP Table (ค่าเริ่มต้น — Admin แก้ได้)

| เหตุการณ์ | XP | หมายเหตุ |
|---|---:|---|
| ทำ Daily Mission ครบ 1 ข้อ | 10 | |
| ทำ Daily Mission ครบทั้ง 3 ข้อ | +20 โบนัส | |
| เริ่ม Main Quest | 5 | |
| ส่งหลักฐาน | 20 | ให้ทันที |
| หลักฐานได้รับการยืนยันจากโค้ช | 80 | ให้หลังโค้ชยืนยันเท่านั้น |
| ทำ Quest ที่ไม่ต้องมีหลักฐานเสร็จ | 40 | |
| บันทึก KPI ประจำสัปดาห์ | 15 | สูงสุด 1 ครั้ง/สัปดาห์ |
| ผู้สมัครขยับขั้นใน funnel | 10–60 | Contact 10 → Interview 25 → Presentation 35 → Commit 50 → Onboard 60 |
| ส่ง Weekly Review | 30 | |
| ได้รับโค้ชชิ่ง (บันทึกผลแล้ว) | 30 | |
| โค้ชทีม/1-on-1 ที่บันทึก | 25 | สูงสุด 5 ครั้ง/สัปดาห์ |
| ชนะ Boss Gate | 500 | |
| ได้ Kudos จากโค้ช/AL | 15 | |

## 3.3 Anti-gaming (สำคัญ — ป้องกันปั๊มแต้ม)
- XP ก้อนใหญ่ให้เฉพาะสิ่งที่ **โค้ชยืนยันแล้ว** หรือ **ขยับ funnel จริง**
- กิจกรรมที่บันทึกเองซ้ำ ๆ มี **เพดานต่อวัน/สัปดาห์**
- ถ้าหลักฐานถูก Revision หรือผู้สมัครถูกย้อนขั้น → XP ส่วนนั้นถูกหักคืน (บันทึกใน XpEvent เป็นค่าติดลบ พร้อมเหตุผล)
- ผู้สมัครที่ขยับหลายขั้นในวันเดียวได้ XP ขั้นละครั้งเท่านั้น
- ทุก XpEvent ต้องอ้าง entity ต้นทาง (actionId / evidenceId / candidateId) และตรวจซ้ำฝั่ง server
- XP คำนวณฝั่ง server เท่านั้น client แสดงผลอย่างเดียว

## 3.4 Level
- สูตร: XP ที่ต้องใช้ขึ้น Level n = `100 × n^1.5` (ปัดเป็นหลักสิบ)
- ช่วง Level 1–30 ตลอดโปรแกรม 180 วัน (ปรับค่าคงที่ให้ Future UM ที่ทำงานสม่ำเสมอจบโปรแกรมที่ Level ~25)
- ชื่อยศตาม Level: 1–5 **Climber**, 6–10 **Pathfinder**, 11–15 **Rope Leader**, 16–20 **Ridge Captain**, 21+ **Summit Ready**
- ยศเป็นของเกมเท่านั้น ห้ามใช้ชื่อตำแหน่งจริงของบริษัท (UM, DM ฯลฯ) เป็นชื่อยศ

## 3.5 Streak
- Streak = จำนวนวันทำงานติดต่อกันที่ทำ Daily Mission อย่างน้อย 1 ข้อ
- นับเฉพาะวันจันทร์–เสาร์ (วันอาทิตย์ไม่ทำให้ streak ขาด)
- **Streak Shield**: 1 ครั้ง/สัปดาห์ ใช้กันขาดอัตโนมัติ
- Weekly Review Streak แยกต่างหาก
- เมื่อ streak ขาด ข้อความต้องให้กำลังใจ ไม่ตำหนิ: "เริ่มใหม่วันนี้ได้เลย สถิติสูงสุดของคุณคือ 23 วัน"

## 3.6 Boss Gate (เดิมคือ Gate Checklist)
- Gate แต่ละ Phase แสดงเป็น "Boss" ที่มี **HP bar**
- แต่ละเงื่อนไขใน Gate = ความเสียหายต่อ Boss (HP ลดตามสัดส่วนเงื่อนไขที่ผ่าน)
- เมื่อ HP เหลือ 0 → ปุ่ม **"ท้าชิง Gate"** (= ขอรีวิว Gate เดิม)
- AL อนุมัติ → หน้าจอ **Victory** (confetti, XP +500, ปลดล็อกโซนใหม่, avatar เปลี่ยนชุด)
- AL ขอพัฒนาเพิ่ม → Boss ฟื้น HP บางส่วน + แสดงคำแนะนำจาก AL เป็น "คำใบ้"
- ใช้ `gateRequirements()` เดิมจาก prototype เป็นแหล่งข้อมูล

## 3.7 Character Sheet (เดิมคือ UM Passport + Readiness)
- Avatar ที่ **วิวัฒน์ตาม Phase** (ชุด/อุปกรณ์เพิ่มขึ้นทุกครั้งที่ผ่าน Gate)
- ค่าสถานะ 5 ด้านแบบ RPG = 5 dimensions ของ Internal UM Readiness
  - ⚔️ Production · 📣 Recruitment · 🌱 Team Development · ⭐ Leadership · 🧭 Management
- แสดงเป็น radar chart + ตัวเลข
- ใต้ radar ต้องมีข้อความถาวร: "ค่าสถานะนี้เป็นตัวชี้วัดการพัฒนาภายใน ไม่ใช่ผลพิจารณาเลื่อนตำแหน่ง"
- Avatar สร้างจาก SVG ชิ้นส่วน (ทรงผม สีผิว เสื้อ อุปกรณ์) ให้ผู้ใช้เลือกเองตอน onboarding **ห้ามใช้ตัวละครที่มีลิขสิทธิ์**

## 3.8 Badges (3 ระดับ: Bronze / Silver / Gold)

| Badge | Bronze | Silver | Gold |
|---|---|---|---|
| First Leadership Mission | ทำ Leadership quest แรก | 3 quests | 6 quests |
| Recruitment Builder | 10 รายชื่อ | 20 รายชื่อ | 40 รายชื่อ |
| Interview Pro | สัมภาษณ์ 3 คน | 8 คน | 15 คน |
| First Recruit | Onboard 1 คน | 3 คน | 5 คน |
| Coaching Starter | โค้ชทีม 1 ครั้ง | 10 ครั้ง | 25 ครั้ง |
| Evidence Champion | หลักฐานยืนยัน 5 ชิ้น | 15 ชิ้น | 30 ชิ้น |
| Streak Keeper | streak 7 วัน | 30 วัน | 60 วัน |
| Reflective Leader | Weekly Review 4 ครั้ง | 12 ครั้ง | 24 ครั้ง |
| Gate Breaker | ผ่าน 1 Gate | 3 Gates | 6 Gates |
| Target Hunter | FYP ถึงเป้า 1 เดือน | 3 เดือน | 6 เดือน |

Badge ที่ยังไม่ได้แสดงเป็นเงา พร้อมบอกว่าเหลืออีกเท่าไร ("อีก 2 คนจะได้ Silver")

## 3.9 Team Features (co-op มากกว่าแข่ง)
- **Team Expedition**: ภารกิจร่วมรายเดือนของทั้ง cohort เช่น "ทั้งทีมสัมภาษณ์รวม 20 คน" มี progress bar รวม และ XP ให้ทุกคนเมื่อสำเร็จ
- **Leaderboard** (เลือกเปิด/ปิดได้โดย AL)
  - จัดอันดับจาก **XP ประจำสัปดาห์** (ความพยายาม) ไม่ใช่ยอดขายหรือ Readiness
  - รีเซ็ตทุกวันจันทร์ ให้ทุกคนมีโอกาสใหม่
  - แสดง Top 5 + อันดับของตัวเอง ไม่แสดงรายชื่ออันดับท้าย
- **Kudos**: โค้ช/AL/เพื่อนร่วม cohort ส่งการ์ดชื่นชมพร้อมข้อความสั้น (จำกัด 3 ใบ/วัน/คน)
- **Share Card**: สร้างภาพการ์ดความสำเร็จ (Level up, ผ่าน Gate, ได้ Badge) สำหรับแชร์ลง LINE — ต้องไม่มีข้อมูลลูกค้า/ผู้สมัคร/ตัวเลขรายได้ เว้นแต่ผู้ใช้เลือกใส่เอง

---

# 4. ใช้งานง่ายขึ้น (UX Simplification)

## 4.1 หน้าแรก Future UM (มือถือ) — เรียงจากบนลงล่าง
1. Header: avatar, Level, XP bar, 🔥 streak, กระดิ่ง
2. **ปุ่มใหญ่ "ภารกิจถัดไป"** — 1 ภารกิจที่สำคัญที่สุด แตะแล้วเข้าไปทำทันที
3. Daily Missions 3 ข้อ (ติ๊กได้)
4. Mini World Map (แตะเพื่อเปิดเต็มจอ)
5. Boss Gate HP ของ Phase ปัจจุบัน
6. Kudos / Feedback ล่าสุดจากโค้ช

## 4.2 Quick Log (ปุ่ม + ลอยกลางเมนูล่าง)
Bottom sheet ที่บันทึกได้ใน 2 แตะ:
- 📞 บันทึกการติดต่อผู้สมัคร → เลือกชื่อ → เลือกผล (ติดต่อได้ / นัดสัมภาษณ์ / ไม่ว่าง)
- 📊 บันทึก KPI วันนี้ → ปุ่ม +/− สำหรับ Activity, Appointment, Case
- 📸 ส่งหลักฐาน → เปิดกล้องทันที
- 🤝 บันทึกโค้ชชิ่ง/1-on-1 → ฟอร์มสั้น 3 ช่อง

## 4.3 เมนูล่าง (มือถือ)
`หน้าแรก · แผนที่ · [+] Quick Log · ทีม · ฉัน`

## 4.4 Onboarding ครั้งแรก (ไม่เกิน 60 วินาที)
1. สร้าง avatar (3 ขั้น)
2. เขียน "ทำไมฉันอยากเป็น UM" 1 ประโยค (ใช้เป็นส่วนแรกของ Vision)
3. Tutorial 3 หน้า: แผนที่ → ภารกิจ → Boss Gate
4. รับ Daily Mission ชุดแรก + XP 50 ต้อนรับ

## 4.5 ภาษาและข้อความ
- ใช้ภาษาพูด สั้น เป็นมิตร เช่น "เยี่ยม! อีกนิดเดียวจะชนะ Recruit Gate"
- ปุ่มบอกสิ่งที่จะเกิดขึ้นจริง: "ส่งให้โค้ชดู" แทน "Submit"
- ข้อความผิดพลาดบอกวิธีแก้เสมอ
- Empty state ชวนลงมือทำ พร้อมปุ่ม

---

# 5. Graphics & Art Direction

## 5.1 โทนภาพ
- **Premium adventure** — ไม่ใช่การ์ตูนเด็ก คิดถึงภาพประกอบแบบ flat-illustration มีมิติด้วยเลเยอร์และแสง
- คงแบรนด์: ดำ `#111111` · ขาว · ส้ม PRIME `#FF6B00`
- เพิ่มสีเกม (ใช้เฉพาะองค์ประกอบเกม):
  - XP / Gold `#FFB800`
  - Silver `#B8C2CC`
  - Bronze `#C47A3A`
  - Sky gradient สำหรับแผนที่: `#1A1D2E → #3B2A4A → #FF8A3D` (ยามเช้าบนภูเขา)
- ส้มยังเป็นสีของ "การลงมือทำ" (ปุ่มหลัก, ตำแหน่งปัจจุบัน)

## 5.2 Motion
- Level up: ตัวเลขนับขึ้น + แสงวงรอบ avatar (≤ 1.2 วินาที)
- ได้ XP: ตัวเลข "+80 XP" ลอยขึ้นจากปุ่มที่กด
- Victory Gate: confetti สีส้ม/ทอง + ธงปักบนโซน
- Boss HP ลด: แถบสั่นเล็กน้อย
- **ต้องเคารพ `prefers-reduced-motion`** — ถ้าเปิดไว้ให้แสดงผลแบบไม่มี animation
- เสียงประกอบ: ปิดเป็นค่าเริ่มต้น เปิดได้ในการตั้งค่า
- Haptic feedback บนมือถือ (navigator.vibrate) สำหรับ Level up / Victory เท่านั้น

## 5.3 Asset rules
- วาดทั้งหมดด้วย SVG/React components ใน repo — ไม่ดึงรูปจากเว็บภายนอก
- ห้ามใช้ตัวละคร โลโก้ หรือภาพที่มีลิขสิทธิ์
- ต้องดูดีบนจอ 360px และโหลดเร็วบนมือถือ Android ระดับกลาง
- ทดสอบใน LINE in-app browser (ผู้ใช้ส่วนใหญ่เปิดลิงก์จาก LINE)

---

# 6. ฝั่ง Coach / AL (Guild View)

- **Guild Dashboard**: การ์ดของ Future UM แต่ละคนแสดง avatar, Level, โซนปัจจุบัน, streak, Boss HP, สัญญาณความเสี่ยง
- **Risk Radar ยังคงจริงจัง** — ไม่ใส่องค์ประกอบเกมในหน้านี้ ใช้สี Green/Amber/Red ตามเดิม
- **Assign Coach Quest**: มอบหมายภารกิจพร้อมกำหนด XP โบนัส (0–100) และกำหนดส่ง
- **Kudos**: ปุ่มส่งชื่นชมจากทุกหน้าที่เห็น Future UM
- **Review Queue** แบบ swipe บนมือถือ: ปัดขวา = Verified, ปัดซ้าย = ขอแก้ (ต้องพิมพ์ความเห็นก่อนยืนยัน)
- **Team Expedition** สร้างและติดตามได้จาก AL

---

# 7. Admin เพิ่มเติม

- ตั้งค่า XP Table, เพดานต่อวัน/สัปดาห์, สูตร Level
- จัดการ Badge (ชื่อ, เงื่อนไข, ระดับ)
- เปิด/ปิด Leaderboard, Team Expedition, Kudos ราย cohort
- ตั้ง Season (รอบ 180 วันของแต่ละ cohort)
- ปุ่ม **Recalculate XP** จาก event log (กรณีแก้ XP Table ย้อนหลัง) พร้อม audit log

---

# 8. Data Model ที่เพิ่มจาก spec v1

```prisma
model XpEvent {
  id         String   @id @default(cuid())
  userId     String
  type       String   // mission_done, evidence_verified, funnel_move, gate_won, kudos, reversal ...
  amount     Int      // ติดลบได้ (กรณีหักคืน)
  sourceType String   // action | evidence | candidate | coaching | weekly | gate | kudos | mission
  sourceId   String
  reason     String?
  createdAt  DateTime @default(now())
  @@unique([userId, type, sourceType, sourceId]) // กันได้ XP ซ้ำจาก source เดียว
}

model UserProgress {       // ค่าที่คำนวณแล้ว (cache) — ต้อง rebuild ได้จาก XpEvent
  userId          String @id
  xp              Int
  level           Int
  streak          Int
  bestStreak      Int
  shieldsLeft     Int
  lastActiveDate  DateTime?
  avatarConfig    Json
}

model DailyMission {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  kind      String   // call_candidates, log_kpi, quest_step, read_feedback ...
  title     String
  target    Int
  progress  Int      @default(0)
  xp        Int
  doneAt    DateTime?
  link      String?
}

model Badge      { id String @id; key String @unique; name String; tiers Json; icon String }
model UserBadge  { id String @id @default(cuid()); userId String; badgeId String; tier String; earnedAt DateTime @default(now()) }
model Kudos      { id String @id @default(cuid()); fromId String; toId String; message String; createdAt DateTime @default(now()) }
model TeamChallenge { id String @id @default(cuid()); cohortId String; title String; metric String; target Int; startAt DateTime; endAt DateTime; xpReward Int }
model GameSettings  { id String @id; xpTable Json; caps Json; levelCurve Json; leaderboardOn Boolean; kudosOn Boolean }
```

Action (v1) เพิ่ม field: `questType` (main | side | coach), `bonusXp Int?`

---

# 9. Professional Mode

- สวิตช์ในโปรไฟล์ (และค่าเริ่มต้นระดับ cohort ที่ Admin ตั้งได้)
- เมื่อเปิด: ซ่อน XP, Level, Streak, Leaderboard, animation ฉลอง, คำศัพท์เกม
- เปลี่ยนคำกลับเป็นแบบ v1: Mission → Action, Boss Gate → Gate Checklist, World Map → Journey
- ข้อมูลเบื้องหลังยังเก็บตามปกติ
- ใช้ตอนนำเสนอผู้บริหาร หรือสำหรับผู้ใช้ที่ไม่ชอบรูปแบบเกม

---

# 10. Tech Additions

- `framer-motion` — animation (ใช้ `useReducedMotion`)
- `canvas-confetti` — Victory
- `html-to-image` — สร้าง Share Card เป็น PNG
- Recharts (radar chart ค่าสถานะ) — มีอยู่แล้วใน stack v1
- ไม่เพิ่ม game engine (Phaser/Pixi) — ไม่จำเป็นและหนักเกินไปสำหรับมือถือ
- XP/Badge/Streak engine เป็น **service layer ฝั่ง server** (`lib/game/`) เรียกจาก server actions ทุกครั้งที่มีเหตุการณ์ต้นทาง
- เขียน unit test สำหรับ `lib/game/*` ทั้งหมด (XP, cap, reversal, streak, level)

---

# 11. Build Order

## Sprint A — Foundation (ถ้ายังไม่มี v1 บน Next.js)
- ตั้งโปรเจกต์ตาม spec v1 ข้อ 31 และ 44 Sprint 1–2
- Port business logic จาก prototype (ข้อ 12) + seed data เดิม

## Sprint B — Game Engine
- XpEvent, UserProgress, Level, Streak, anti-gaming caps, reversal
- Unit tests

## Sprint C — Home ใหม่ + Quick Log + Daily Missions
- หน้าแรกตามข้อ 4.1, Quick Log ตามข้อ 4.2, generator ของ Daily Missions

## Sprint D — World Map + Boss Gate + Character Sheet
- SVG แผนที่, avatar builder, Boss HP, Victory screen, radar

## Sprint E — Badges + Kudos + Team Expedition + Leaderboard
## Sprint F — Coach Guild View + swipe review + Professional Mode
## Sprint G — QA, performance, accessibility, LINE in-app browser, Share Card

---

# 12. Business Logic ที่ต้อง port จาก prototype

ใน `prototype/prime-um-ascend.html` (ส่วน `<script>`) ฟังก์ชันเหล่านี้ผ่านการทดสอบ flow แล้ว ให้ย้ายไปเป็น TypeScript ใน `lib/domain/` โดยคงผลลัพธ์เดิม:

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `defaultPhases()`, `defaultActions()`, `defaultCompetencies()`, `defaultSettings()` | ข้อมูลโปรแกรมตั้งต้น 6 Phase, 30+ Actions, 24 Competencies |
| `seed()` | Demo data (Future UM 01–03, Coach 01, AL 01, Admin 01) |
| `readiness(uid)` | Internal UM Readiness 5 มิติ + น้ำหนักที่ Admin ตั้ง |
| `gateRequirements(u, p)`, `gateStatus()` | เงื่อนไข Gate (Required actions + funnel metrics) |
| `funnelCounts(uid)` | นับผู้สมัครที่ถึงแต่ละขั้น |
| `risks(uid)`, `riskLevel()` | Risk Radar 9 สัญญาณ |
| `todayItems(u)`, `weeklyPriorities(u)` | ฐานสำหรับ Daily Missions |
| `badges(uid)` | Badge เดิม 6 อัน (ขยายเป็นแบบมี tier ตามข้อ 3.8) |

**ห้ามย้ายส่วนนี้:** ระบบ login แบบ demo (`DEMO_PASSWORD`), การเก็บข้อมูลใน localStorage, การตรวจสิทธิ์ฝั่ง client — ทั้งหมดต้องทำใหม่ฝั่ง server ตาม spec v1 ข้อ 33 และ 41

---

# 13. Acceptance Criteria (เพิ่มจาก spec v1 ข้อ 45)

- ผู้ใช้ใหม่ทำ onboarding เสร็จภายใน 60 วินาที
- จากหน้าแรก เริ่มภารกิจถัดไปได้ใน **1 แตะ**
- บันทึกการติดต่อผู้สมัครหรือ KPI ผ่าน Quick Log ได้ใน **≤ 2 แตะ** (ไม่นับการพิมพ์)
- XP ถูกต้องตาม XP Table, ไม่ได้ซ้ำจาก source เดียว, หักคืนเมื่อ revision/ย้อนขั้น
- Level, Streak, Shield คำนวณถูกต้องข้ามวันและข้ามสัปดาห์ (มี unit test ครอบคลุม timezone Asia/Bangkok)
- Boss HP ตรงกับ `gateRequirements()` ทุกกรณี
- Victory screen แสดงครั้งเดียวต่อ Gate
- Professional Mode ซ่อนองค์ประกอบเกมครบทุกหน้า
- `prefers-reduced-motion` ปิด animation ได้ครบ
- หน้าแรกโหลด < 2.5 วินาทีบน 4G กลาง ๆ, Lighthouse mobile performance ≥ 85
- ใช้งานได้ใน LINE in-app browser (iOS และ Android)
- Share Card ไม่มีข้อมูลลูกค้า/ผู้สมัคร
- ไม่มี console error ใน flow ปกติ

---

# 14. Prompt แรกสำหรับวางใน Claude Code

```
อ่าน PRIME_UM_ASCEND_V2_GAME_MODE.md และ PRIME_UM_ASCEND_CLAUDE_CODE.md ในโฟลเดอร์นี้
แล้วเปิด prototype/prime-um-ascend.html เพื่อดู UX และ business logic ที่ทำงานได้แล้ว

ขั้นแรก:
1. ตรวจ repository ปัจจุบัน ถ้ายังไม่มีโปรเจกต์ ให้สร้างตาม stack ใน spec v1 ข้อ 31
2. เขียนแผนการทำงานสั้น ๆ ตาม Build Order ข้อ 11 ให้ฉันอนุมัติก่อนเริ่มเขียนโค้ด
3. เริ่มจาก Sprint A และ B: port business logic ตามข้อ 12 และสร้าง Game Engine พร้อม unit tests

หลังจบแต่ละ Sprint ให้รัน typecheck, lint, test และสรุปสิ่งที่เสร็จ/ยังค้างให้ฉันดู
```
