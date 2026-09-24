// Ported 1:1 from prototype/prime-um-ascend.html (defaultPhases/defaultActions/
// defaultCompetencies/defaultSettings, lines 609-669). Values, ids and copy are kept
// byte-identical to the validated prototype — this is the seed source of truth for
// the 6-phase / 30+ action / 24-competency program.
import type { ActionDef, Competency, Phase, Settings } from "./types";

export function defaultPhases(): Phase[] {
  return [
    {
      id: "p1", no: 1, key: "DISCOVER", th: "รู้จักตัวเอง", startDay: 1, endDay: 14,
      objective: "เข้าใจแรงจูงใจ วิสัยทัศน์ ความสามารถปัจจุบัน และช่องว่างที่ต้องพัฒนา",
      mission: 'ตอบให้ได้ว่า "ทำไมต้องเป็น UM" และวางแผนพัฒนาตัวเองที่ทำได้จริงร่วมกับโค้ช',
      gate: { name: "Discover Gate", metrics: [] },
    },
    {
      id: "p2", no: 2, key: "BUILD", th: "สร้างทักษะ", startDay: 15, endDay: 45,
      objective: "สร้างทักษะหลักของ UM: Sales Management, Recruitment, Coaching, Leadership และ Management",
      mission: "ฝึกทุกทักษะในสถานการณ์จริงอย่างน้อยหนึ่งครั้ง และให้โค้ชเห็นการฝึกของคุณ",
      gate: { name: "Build Gate", metrics: [] },
    },
    {
      id: "p3", no: 3, key: "PRODUCE", th: "พิสูจน์ผลงาน", startDay: 46, endDay: 75,
      objective: "แสดงวินัยด้านผลงานส่วนตัวและวิธีคิดแบบผู้บริหาร",
      mission: "ทำผลงานตามเป้า วิเคราะห์ Target vs Actual และแก้ช่องว่างได้ด้วยตัวเอง",
      gate: { name: "Produce Gate", metrics: [] },
    },
    {
      id: "p4", no: 4, key: "RECRUIT", th: "สร้างทีม", startDay: 76, endDay: 120,
      objective: "สร้าง Recruitment pipeline ที่ต่อเนื่องและยั่งยืน",
      mission: "เติมรายชื่อผู้สมัครให้เต็ม pipeline และพาผู้สมัครอย่างน้อยหนึ่งคนเริ่มงานจริง",
      gate: {
        name: "Recruit Gate",
        metrics: [
          { id: "gm_contacts", metric: "contact", min: 10, title: "10 Candidate Contacts" },
          { id: "gm_interviews", metric: "interview", min: 3, title: "3 Interviews" },
        ],
      },
    },
    {
      id: "p5", no: 5, key: "LEAD", th: "นำทีม", startDay: 121, endDay: 150,
      objective: "บริหาร Mini-team 3–5 คนและแสดงภาวะผู้นำ",
      mission: "นำทีมเล็กให้มีแผน มีกิจกรรมทุกวัน และมีการโค้ชอย่างสม่ำเสมอ",
      gate: { name: "Lead Gate", metrics: [] },
    },
    {
      id: "p6", no: 6, key: "PROVE", th: "พิสูจน์ความพร้อม", startDay: 151, endDay: 180,
      objective: "แสดงให้เห็นว่าพร้อมทำงานในบทบาทผู้นำ",
      mission: "นำเสนอแผนธุรกิจ แผนสรรหา และแผน 90 วันต่อ AL พร้อมแฟ้มหลักฐานครบถ้วน",
      gate: { name: "Promotion Gate", metrics: [] },
    },
  ];
}

function A(
  id: string,
  phaseId: string,
  title: string,
  category: string,
  dueOffset: number,
  o: Partial<ActionDef> = {}
): ActionDef {
  return {
    id, phaseId, title, category, dueOffset,
    priority: "high", required: true, evidence: true, evidenceHint: "",
    desc: "", why: "", steps: [], success: [], competencyId: null,
    ...o,
  };
}

export function defaultActions(): ActionDef[] {
  return [
    A("a101", "p1", "เขียน UM Vision Statement", "Vision", 3, { priority: "critical", competencyId: "c_lead_mot", desc: "เขียนวิสัยทัศน์ว่าคุณอยากเป็น UM แบบไหน และทีมของคุณจะเป็นอย่างไรใน 12 เดือน", why: "วิสัยทัศน์ที่ชัดคือแรงขับเมื่อเจอช่วงยาก และเป็นสิ่งที่ทีมในอนาคตจะเชื่อตาม", steps: ["ตอบคำถาม: ทำไมฉันอยากเป็น UM", "เขียนภาพทีมในอีก 12 เดือน (จำนวนคน รายได้ วัฒนธรรม)", "สรุปเป็นข้อความไม่เกิน 5 บรรทัด"], success: ["มีเหตุผลส่วนตัวที่ชัดเจน", "มีตัวเลขเป้าหมายอย่างน้อย 2 ตัว"], evidenceHint: "ไฟล์หรือภาพถ่าย Vision Statement" }),
    A("a102", "p1", "ตั้ง Career Goal 12 เดือน", "Vision", 5, { competencyId: "c_mgt_plan", desc: "กำหนดเป้าหมายอาชีพและรายได้ 12 เดือน แยกเป็นรายไตรมาส", why: "เป้าหมายที่วัดได้ทำให้โค้ชช่วยคุณได้ตรงจุด", steps: ["กำหนดเป้าหมายรายได้และตำแหน่ง", "แตกเป็นเป้ารายไตรมาส", "ระบุสิ่งที่ต้องเปลี่ยนในพฤติกรรมการทำงาน"], success: ["เป้าหมายวัดผลได้และมีกรอบเวลา"], evidenceHint: "เอกสาร Career Goal" }),
    A("a103", "p1", "Current Assessment ประเมินตัวเอง 5 ด้าน", "Development", 8, { competencyId: "c_prod_anal", desc: "ประเมินความสามารถปัจจุบันด้าน Production, Recruitment, Coaching, Leadership และ Management", why: "ต้องรู้จุดเริ่มต้นก่อน จึงวัดการเติบโตได้จริง", steps: ["ให้คะแนนตัวเอง 1–5 ในแต่ละด้าน", "เขียนตัวอย่างสถานการณ์จริงประกอบ"], success: ["ครบทั้ง 5 ด้านพร้อมตัวอย่าง"], evidenceHint: "แบบประเมินตนเอง" }),
    A("a104", "p1", "Gap Analysis ร่วมกับโค้ช", "Coaching", 11, { competencyId: "c_dev_plan", desc: "นั่งคุยกับโค้ชเพื่อเทียบผลประเมินตัวเองกับมุมมองโค้ช และสรุปช่องว่าง 3 อันดับแรก", why: "มุมมองจากภายนอกช่วยเห็นจุดบอดที่เรามองไม่เห็นเอง", steps: ["นัดโค้ช 45 นาที", "เทียบคะแนนตัวเองกับโค้ช", "สรุป Top 3 gaps"], success: ["มี Top 3 gaps ที่โค้ชเห็นด้วย"], evidenceHint: "บันทึกการคุยหรือภาพสรุป" }),
    A("a105", "p1", "จัดทำ Personal Development Plan (PDP)", "Management", 14, { priority: "critical", competencyId: "c_dev_plan", desc: "แผนพัฒนาตัวเอง 180 วันที่ผูกกับ Gap ทั้ง 3 ข้อ", why: "PDP คือสัญญาระหว่างคุณกับโค้ชว่าจะพัฒนาอะไร เมื่อไร และวัดผลอย่างไร", steps: ["เลือกกิจกรรมพัฒนาต่อ gap", "กำหนดตัวชี้วัดและวันที่", "ขอโค้ชยืนยันแผน"], success: ["ทุก gap มีกิจกรรมและตัวชี้วัด"], evidenceHint: "ไฟล์ PDP" }),
    A("a201", "p2", "Shadowing UM ตัวจริง 2 ครั้ง", "Leadership", 22, { competencyId: "c_lead_comm", desc: "ติดตาม UM ที่ประสบความสำเร็จ 2 ครั้ง ในการประชุมทีมหรือการโค้ช", why: "การเห็นของจริงทำให้เข้าใจงาน UM เร็วกว่าการอ่าน", steps: ["นัด UM ต้นแบบ", "สังเกตวิธีสื่อสารและตั้งคำถาม", "สรุป 3 สิ่งที่จะนำไปใช้"], success: ["มีบันทึกการสังเกต 2 ครั้ง"], evidenceHint: "บันทึก Shadowing" }),
    A("a202", "p2", "ฝึก 1-on-1 กับเพื่อนร่วมทีม", "Coaching", 28, { competencyId: "c_dev_coach", desc: "ฝึกทำ 1-on-1 ตาม framework Observe → Question → Feedback → Action Plan", why: "1-on-1 คือเครื่องมือหลักของ UM ในการพัฒนาคน", steps: ["เลือกเพื่อนร่วมทีม 1 คน", "ทำ 1-on-1 30 นาที", "ขอ feedback กลับ"], success: ["ใช้ framework ครบทุกขั้น"], evidenceHint: "บันทึก 1-on-1" }),
    A("a203", "p2", "ฝึกนำ Team Meeting", "Leadership", 34, { priority: "critical", competencyId: "c_lead_fac", desc: "นำประชุมทีม 1 ครั้ง ภายใต้การสังเกตของโค้ช", why: "Team meeting คือเวทีที่ทีมจะตัดสินว่าจะเดินตามคุณหรือไม่", steps: ["เตรียม agenda 30 นาที", "นำประชุมจริง", "ขอ feedback จากโค้ช"], success: ["ประชุมตรงเวลาและมี action ต่อ"], evidenceHint: "Agenda และภาพการประชุม" }),
    A("a204", "p2", "Recruitment Interview Practice", "Recruitment", 38, { competencyId: "c_rec_int", desc: "ซ้อมสัมภาษณ์ผู้สมัคร (role-play) กับโค้ช 2 รอบ", why: "การสัมภาษณ์ที่ดีช่วยคัดคนที่ใช่ตั้งแต่ต้น", steps: ["เตรียมคำถามสัมภาษณ์ 8 ข้อ", "role-play 2 รอบ", "ปรับคำถามตาม feedback"], success: ["โค้ชให้คะแนนการสัมภาษณ์ ≥ 3/5"], evidenceHint: "ชุดคำถามและ feedback" }),
    A("a205", "p2", "Coaching Practice", "Coaching", 42, { competencyId: "c_dev_fb", desc: "โค้ชเพื่อนร่วมทีม 1 เรื่องจนเห็นผล", why: "UM ที่ดีวัดจากการเติบโตของคนในทีม", steps: ["เลือกหัวข้อ 1 เรื่อง", "โค้ช 2 ครั้ง ห่างกัน 1 สัปดาห์", "วัดผลการเปลี่ยนแปลง"], success: ["มีผลลัพธ์ที่วัดได้"], evidenceHint: "บันทึกโค้ชชิ่ง" }),
    A("a206", "p2", "สรุปบทเรียน Build Phase", "Development", 45, { priority: "medium", required: false, evidence: false, competencyId: "c_dev_fu", desc: "เขียนสรุปสิ่งที่ได้เรียนรู้และสิ่งที่จะปรับใน Phase ถัดไป", why: "การสะท้อนคิดทำให้การเรียนรู้ติดตัว", steps: ["สรุป 3 สิ่งที่ได้เรียนรู้", "สรุป 2 สิ่งที่จะปรับ"], success: ["ส่งสรุปก่อนเข้า Produce"] }),
    A("a301", "p3", "วางแผนผลงานรายเดือน (Target Plan)", "Production", 50, { priority: "critical", competencyId: "c_prod_tgt", desc: "แตกเป้า FYP และจำนวนเคสเป็นกิจกรรมรายสัปดาห์", why: "ผู้นำต้องทำผลงานให้ทีมเห็นก่อนจะขอให้ทีมทำ", steps: ["กำหนด FYP และ Case", "แตกเป็น Activity, Appointment, Presentation", "ใส่ในปฏิทิน"], success: ["มีเป้ารายสัปดาห์ครบ 4 สัปดาห์"], evidenceHint: "Target Plan" }),
    A("a302", "p3", "Activity Tracking 4 สัปดาห์", "Production", 70, { competencyId: "c_prod_act", desc: "บันทึก Activity, Appointment และ Presentation ทุกสัปดาห์ต่อเนื่อง 4 สัปดาห์", why: "ตัวเลขกิจกรรมบอกผลงานล่วงหน้าได้ดีกว่ายอดขาย", steps: ["บันทึก KPI ทุกสิ้นสัปดาห์", "ทบทวนกับโค้ชทุก 2 สัปดาห์"], success: ["บันทึกครบ 4 สัปดาห์"], evidenceHint: "ภาพหน้าจอ Activity log" }),
    A("a303", "p3", "Target vs Actual Review", "Management", 72, { competencyId: "c_mgt_kpi", desc: "วิเคราะห์ผลงานจริงเทียบเป้า หา root cause ของ gap", why: "การอ่านตัวเลขให้เป็นคือทักษะ Management ที่ UM ใช้ทุกสัปดาห์", steps: ["เทียบ Target vs Actual ทุก KPI", "หา root cause 2 ข้อ"], success: ["ระบุ root cause ได้ชัดเจน"], evidenceHint: "สรุป Review" }),
    A("a304", "p3", "Corrective Action Plan", "Management", 75, { competencyId: "c_mgt_prob", desc: "แผนแก้ไขจาก gap ที่พบ พร้อมตัวชี้วัด", why: "Gap ที่ไม่มีแผนแก้ จะกลับมาซ้ำอีก", steps: ["กำหนด 3 corrective actions", "กำหนดวันที่และตัวชี้วัด"], success: ["โค้ชเห็นชอบแผน"], evidenceHint: "Corrective Action Plan" }),
    A("a305", "p3", "ปิดเคสอย่างน้อย 4 เคส", "Production", 75, { priority: "critical", competencyId: "c_prod_disc", desc: "ปิดการขายอย่างน้อย 4 เคสภายใน Produce phase", why: "ผลงานส่วนตัวคือความน่าเชื่อถือแรกของผู้นำ", steps: ["ติดตาม pipeline ลูกค้า", "ปิดเคสและบันทึก KPI"], success: ["Case ≥ 4 ใน Phase นี้"], evidenceHint: "หลักฐานการปิดเคส (ปิดข้อมูลลูกค้า)" }),
    A("a401", "p4", "Candidate Mapping 20 รายชื่อ", "Recruitment", 82, { priority: "critical", competencyId: "c_rec_src", desc: "ทำแผนที่รายชื่อผู้มีศักยภาพอย่างน้อย 20 คนจากทุกแหล่ง", why: "Pipeline ที่เต็มคือหัวใจของการสร้างทีมอย่างยั่งยืน", steps: ["ไล่รายชื่อจาก Natural market", "จัดกลุ่มตามศักยภาพ A/B/C", "บันทึกใน Recruitment"], success: ["มีรายชื่อ ≥ 20 คน"], evidenceHint: "Candidate map (ปิดข้อมูลติดต่อ)" }),
    A("a402", "p4", "ติดต่อผู้สมัคร 10 คน", "Recruitment", 95, { required: false, priority: "medium", evidence: false, competencyId: "c_rec_app", desc: "ติดต่อผู้สมัครอย่างน้อย 10 คนและบันทึกผลใน Recruitment", why: "การติดต่อสม่ำเสมอทำให้ funnel เคลื่อน", steps: ["โทรหรือนัดพบ", "บันทึกผลการติดต่อทุกครั้ง"], success: ["Contact ≥ 10 ในระบบ"] }),
    A("a403", "p4", "สัมภาษณ์ผู้สมัคร 3 คน", "Recruitment", 105, { required: false, evidence: false, competencyId: "c_rec_int", desc: "สัมภาษณ์ผู้สมัครอย่างน้อย 3 คนตามแบบฟอร์มที่ฝึกไว้", why: "การสัมภาษณ์คือจุดคัดกรองคุณภาพของทีม", steps: ["นัดสัมภาษณ์", "ใช้ชุดคำถามมาตรฐาน", "บันทึกผลใน Recruitment"], success: ["Interview ≥ 3 ในระบบ"] }),
    A("a404", "p4", "Career Presentation", "Recruitment", 112, { priority: "critical", competencyId: "c_rec_pres", desc: "นำเสนอโอกาสอาชีพต่อผู้สมัครอย่างน้อย 1 ครั้ง", why: "ผู้สมัครตัดสินใจจากภาพอนาคตที่คุณเล่าได้ชัด", steps: ["เตรียม deck อาชีพ", "นำเสนอจริง", "ขอ feedback จากผู้สมัคร"], success: ["นำเสนอจริง 1 ครั้ง"], evidenceHint: "Deck หรือภาพการนำเสนอ" }),
    A("a405", "p4", "Onboard ตัวแทนใหม่ 1 คน", "Recruitment", 120, { priority: "critical", competencyId: "c_rec_onb", desc: "พาผู้สมัครอย่างน้อย 1 คนเริ่มงานและวางแผน 30 วันแรก", why: "ตัวแทนใหม่คนแรกคือจุดเริ่มต้นของทีมคุณ", steps: ["ช่วยเตรียมสอบและเอกสาร", "วางแผน 30 วันแรก"], success: ["ตัวแทนใหม่เริ่มงาน 1 คน"], evidenceHint: "แผน 30 วันแรกของตัวแทนใหม่" }),
    A("a406", "p4", "อัปเดต Recruitment Pipeline ทุกสัปดาห์", "Management", 118, { priority: "medium", required: false, evidence: false, competencyId: "c_mgt_rev", desc: "อัปเดตสถานะผู้สมัครทุกวันศุกร์", why: "ข้อมูลที่เป็นปัจจุบันทำให้โค้ชช่วยได้ทันเวลา", steps: ["ทบทวนทุก candidate", "กำหนด next action"], success: ["ทุก candidate มี next action"] }),
    A("a501", "p5", "จัดตั้ง Mini-team 3–5 คน", "Leadership", 125, { priority: "critical", competencyId: "c_lead_acc", desc: "รวมทีมเล็ก 3–5 คนที่คุณจะดูแลใน Lead phase", why: "การนำทีมจริงคือการพิสูจน์ที่ดีที่สุด", steps: ["เลือกสมาชิก", "ตกลงบทบาทและความคาดหวัง"], success: ["มีสมาชิก 3–5 คน"], evidenceHint: "รายชื่อและข้อตกลงทีม" }),
    A("a502", "p5", "Team Planning", "Management", 130, { competencyId: "c_mgt_plan", desc: "วางแผนเป้าหมายทีมรายเดือน", why: "ทีมที่ไม่มีแผนจะวิ่งตามเหตุการณ์", steps: ["กำหนดเป้าทีม", "แตกเป้าต่อคน"], success: ["ทุกคนมีเป้า"], evidenceHint: "Team plan" }),
    A("a503", "p5", "Weekly 1-on-1 กับทีม", "Coaching", 145, { competencyId: "c_dev_coach", desc: "ทำ 1-on-1 กับสมาชิกทุกคนทุกสัปดาห์", why: "ความสม่ำเสมอสร้างความไว้วางใจ", steps: ["นัด 1-on-1 ประจำ", "บันทึกทุกครั้ง"], success: ["ครบทุกคนทุกสัปดาห์"], evidenceHint: "บันทึก 1-on-1" }),
    A("a504", "p5", "นำ Team Meeting 4 ครั้ง", "Leadership", 148, { competencyId: "c_lead_fac", desc: "นำประชุมทีมประจำสัปดาห์ 4 ครั้ง", why: "ประชุมทีมที่ดีสร้างพลังและวินัย", steps: ["เตรียม agenda", "นำประชุม", "ติดตาม action"], success: ["ครบ 4 ครั้ง"], evidenceHint: "Agenda/ภาพการประชุม" }),
    A("a505", "p5", "KPI Review ของทีม", "Management", 148, { competencyId: "c_mgt_kpi", desc: "ทบทวน KPI ทีมและกำหนด action แก้ gap", why: "ผู้นำต้องเห็นปัญหาก่อนที่มันจะใหญ่", steps: ["รวม KPI ทีม", "ทบทวนกับทีม"], success: ["มี action ต่อ gap"], evidenceHint: "สรุป KPI Review" }),
    A("a506", "p5", "Team Development Plan", "Development", 150, { competencyId: "c_dev_plan", desc: "แผนพัฒนารายบุคคลของสมาชิกทีม", why: "การพัฒนาคนคือหน้าที่หลักของ UM", steps: ["ประเมินสมาชิก", "กำหนดแผนพัฒนา"], success: ["ทุกคนมีแผน"], evidenceHint: "Team Development Plan" }),
    A("a601", "p6", "Team Business Plan", "Management", 160, { priority: "critical", competencyId: "c_mgt_fc", desc: "แผนธุรกิจทีม 12 เดือน พร้อม forecast", why: "แสดงว่าคุณคิดแบบเจ้าของธุรกิจ", steps: ["กำหนดเป้า", "forecast รายไตรมาส", "ระบุความเสี่ยง"], success: ["แผนมีตัวเลขและเหตุผลรองรับ"], evidenceHint: "Business Plan" }),
    A("a602", "p6", "Recruitment Plan", "Recruitment", 163, { competencyId: "c_rec_src", desc: "แผนสรรหา 12 เดือนที่ต่อเนื่อง", why: "ทีมที่โตต้องมี pipeline ต่อเนื่อง", steps: ["กำหนดเป้าสรรหา", "ระบุแหล่งและกิจกรรม"], success: ["แผนรายเดือนครบ"], evidenceHint: "Recruitment Plan" }),
    A("a603", "p6", "90-Day Team Plan", "Leadership", 168, { competencyId: "c_lead_del", desc: "สิ่งที่จะทำใน 90 วันแรกหลังเป็น UM", why: "90 วันแรกกำหนดวัฒนธรรมทีม", steps: ["กำหนด 3 เป้าหมายหลัก", "แผนรายเดือน"], success: ["แผนชัดเจนวัดผลได้"], evidenceHint: "90-Day Plan" }),
    A("a604", "p6", "Leadership Presentation", "Leadership", 175, { priority: "critical", competencyId: "c_lead_comm", desc: "นำเสนอแผนทั้งหมดต่อ AL และผู้บริหาร", why: "เวทีที่ผู้บริหารเห็นความพร้อมของคุณ", steps: ["เตรียม deck", "ซ้อมกับโค้ช", "นำเสนอจริง"], success: ["นำเสนอครบภายในเวลา"], evidenceHint: "Presentation deck" }),
    A("a605", "p6", "Evidence Portfolio ครบถ้วน", "Management", 178, { competencyId: "c_mgt_rev", desc: "รวบรวมหลักฐานทุก Phase ให้ครบและได้รับการยืนยัน", why: "หลักฐานคือสิ่งที่ทำให้ความพร้อมตรวจสอบได้", steps: ["ตรวจทุกหมวด", "ส่งหลักฐานที่ขาด"], success: ["หลักฐานได้รับการยืนยัน ≥ 80%"] }),
    A("a606", "p6", "Final Assessment กับ AL", "Leadership", 180, { priority: "critical", evidence: false, competencyId: "c_lead_acc", desc: "การประเมินสุดท้ายโดย AL ตามเกณฑ์ที่กำหนด", why: "สรุปความพร้อมทั้งหมดก่อนเข้า Promotion Gate", steps: ["นัด AL", "ประเมินตามเกณฑ์"], success: ["ผ่านเกณฑ์ภายในที่ตั้งไว้"] }),
  ];
}

export function defaultCompetencies(): Competency[] {
  const c = (id: string, category: string, name: string, description = ""): Competency => ({ id, category, name, description });
  return [
    c("c_prod_disc", "production", "Personal discipline", "ทำกิจกรรมสม่ำเสมอโดยไม่ต้องมีคนตาม"),
    c("c_prod_act", "production", "Activity management", "บริหารกิจกรรมให้ได้ผลลัพธ์"),
    c("c_prod_tgt", "production", "Target management", "ตั้งและติดตามเป้าหมาย"),
    c("c_prod_anal", "production", "Performance analysis", "อ่านและวิเคราะห์ตัวเลขผลงาน"),
    c("c_rec_src", "recruitment", "Candidate sourcing"),
    c("c_rec_app", "recruitment", "Approach"),
    c("c_rec_int", "recruitment", "Interview"),
    c("c_rec_pres", "recruitment", "Career presentation"),
    c("c_rec_fu", "recruitment", "Follow-up"),
    c("c_rec_onb", "recruitment", "Onboarding"),
    c("c_dev_coach", "development", "Coaching"),
    c("c_dev_fb", "development", "Feedback"),
    c("c_dev_plan", "development", "Development planning"),
    c("c_dev_fu", "development", "Follow-up"),
    c("c_lead_comm", "leadership", "Communication"),
    c("c_lead_mot", "leadership", "Motivation"),
    c("c_lead_del", "leadership", "Delegation"),
    c("c_lead_acc", "leadership", "Accountability"),
    c("c_lead_fac", "leadership", "Team facilitation"),
    c("c_mgt_plan", "management", "Planning"),
    c("c_mgt_kpi", "management", "KPI management"),
    c("c_mgt_fc", "management", "Forecasting"),
    c("c_mgt_prob", "management", "Problem solving"),
    c("c_mgt_rev", "management", "Business review"),
  ];
}

export function defaultSettings(): Settings {
  return {
    weights: { production: 20, recruitment: 25, development: 20, leadership: 20, management: 15 },
    readyThreshold: 75,
    kpiTargets: {
      fyp: 60000, nbc: 40, cases: 4, activity: 80, appointments: 16,
      training: 2, oneOnOne: 4, teamMeetings: 4, teamActivity: 200, teamFyp: 150000,
    },
    recruitTargets: { contact: 10, interview: 3, presentation: 2, onboard: 1 },
    coachingTarget: 6,
    finalCriteria: [
      { id: "fc1", name: "Business Plan", max: 20 },
      { id: "fc2", name: "Recruitment Plan", max: 20 },
      { id: "fc3", name: "90-Day Team Plan", max: 20 },
      { id: "fc4", name: "Leadership Presentation", max: 20 },
      { id: "fc5", name: "Competency Assessment", max: 20 },
    ],
    finalPass: 70,
  };
}
