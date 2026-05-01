-- Seed v1 of Terms of Service and Privacy Policy in EN and TH.
-- Admins can publish later versions via /boss-office; existing users are
-- re-prompted to accept whenever the active version increments.

INSERT OR REPLACE INTO legal_documents (id, type, locale, version, content, effective_at, is_active) VALUES
('legal-terms-en-v1', 'terms', 'en', 1,
'# Manager.money — Terms of Service

**Version:** 1

By creating an account and using Manager.money ("the Service"), you agree to these Terms.

## 1. Account
You must provide an accurate email address. You are responsible for all activity on your account. You must be at least 13 years old to use the Service.

## 2. Your Content
You may submit EV charging records, including optional photos of charging slips. You retain ownership of your content. By submitting, you grant Manager.money a non-exclusive license to store and display this data to power the Service.

## 3. Public Sharing
You choose which of your records are public. Marking a record "public" lets its data contribute to community price comparisons on /ev and may appear on your public profile at /u/your-slug. You can change visibility per record at any time.

## 4. Accuracy
You warrant that records you submit reflect real charging sessions you completed. Knowingly submitting fabricated data may result in record rejection or account termination.

## 5. Admin Review
Public records are reviewed by Manager.money admins before being included in community statistics. We may reject records without giving a specific reason.

## 6. Your Rights
You may delete any record or your entire account at any time from /settings. Account deletion permanently removes your records, photos, and profile data.

## 7. Prohibited Use
You may not scrape the Service, attempt to access other users'' private data, or use the Service for any unlawful purpose.

## 8. Service Provided "As Is"
Charging price information is provided for guidance only. We do not guarantee accuracy. Verify prices with charging operators before transactions.

## 9. Changes
We may update these Terms. You will be asked to re-accept material changes before submitting new records.

## 10. Governing Law
These Terms are governed by the laws of Thailand. Disputes will be resolved in Thai courts.

## 11. Contact
support@manager.money',
unixepoch(), 1),

('legal-terms-th-v1', 'terms', 'th', 1,
'# Manager.money — ข้อกำหนดในการให้บริการ

**เวอร์ชัน:** 1

เมื่อคุณสร้างบัญชีและใช้บริการ Manager.money ("บริการ") ถือว่าคุณยอมรับข้อกำหนดเหล่านี้

## 1. บัญชีผู้ใช้
คุณต้องระบุอีเมลที่ถูกต้อง คุณรับผิดชอบในกิจกรรมทั้งหมดในบัญชีของคุณ และต้องมีอายุอย่างน้อย 13 ปี

## 2. เนื้อหาของคุณ
คุณสามารถบันทึกประวัติการชาร์จรถยนต์ไฟฟ้า รวมถึงรูปภาพสลิปการชาร์จ คุณยังคงเป็นเจ้าของเนื้อหาของคุณ การส่งข้อมูลถือเป็นการให้สิทธิ์ Manager.money ในการจัดเก็บและแสดงข้อมูลเพื่อให้บริการ

## 3. การแชร์สาธารณะ
คุณเลือกได้ว่าบันทึกใดจะเป็นสาธารณะ บันทึกที่ตั้งเป็น "สาธารณะ" จะนำไปคำนวณราคาเฉลี่ยใน /ev และอาจแสดงในหน้าโปรไฟล์ /u/slug-ของคุณ คุณสามารถเปลี่ยนการตั้งค่าได้ตลอดเวลา

## 4. ความถูกต้อง
คุณรับรองว่าบันทึกที่ส่งสะท้อนการชาร์จจริง การจงใจส่งข้อมูลปลอมอาจส่งผลให้บันทึกถูกปฏิเสธหรือบัญชีถูกระงับ

## 5. การตรวจสอบโดยผู้ดูแล
บันทึกสาธารณะจะได้รับการตรวจสอบโดยผู้ดูแลก่อนนำไปคำนวณสถิติของชุมชน เราอาจปฏิเสธบันทึกโดยไม่ระบุเหตุผล

## 6. สิทธิ์ของคุณ
คุณสามารถลบบันทึกหรือบัญชีของคุณได้ตลอดเวลาที่ /settings การลบบัญชีจะลบบันทึก รูปภาพ และข้อมูลโปรไฟล์ของคุณอย่างถาวร

## 7. การใช้ที่ต้องห้าม
ห้ามดึงข้อมูล (scraping) จากบริการ พยายามเข้าถึงข้อมูลส่วนตัวของผู้ใช้รายอื่น หรือใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย

## 8. บริการ "ตามสภาพ"
ข้อมูลราคาการชาร์จเป็นเพียงแนวทางอ้างอิง เราไม่รับประกันความถูกต้อง โปรดตรวจสอบราคากับผู้ให้บริการก่อนทำธุรกรรม

## 9. การเปลี่ยนแปลง
เราอาจปรับปรุงข้อกำหนดเหล่านี้ คุณจะถูกขอให้ยอมรับการเปลี่ยนแปลงสำคัญก่อนส่งบันทึกใหม่

## 10. กฎหมายที่ใช้บังคับ
ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย ข้อพิพาทจะระงับในศาลไทย

## 11. ติดต่อ
support@manager.money',
unixepoch(), 1),

('legal-privacy-en-v1', 'privacy', 'en', 1,
'# Manager.money — Privacy Policy

**Version:** 1

This Privacy Policy explains what data we collect and how we use it. We comply with Thailand''s Personal Data Protection Act (PDPA).

## 1. Data We Collect
- **Account data:** email, name, profile image (from Google or your input)
- **Charging records:** brand, kWh, cost, timestamps, mileage, optional notes, optional photos
- **Vehicle data:** car model and nickname (your choice)
- **Technical data:** IP address (used only for rate limiting), session tokens

## 2. How We Use Your Data
- To provide the Service (storing your records, showing your history)
- To compute community price comparisons (only from records you mark public AND that admins approve)
- To prevent abuse (rate limiting, fraud detection)

## 3. Sharing
- Records you mark "public" contribute anonymized aggregates to /ev community statistics. Your display name and slug appear on /u/your-slug only if you opt in to public sharing.
- Private records are visible only to you and authorized admins reviewing your other (public) submissions.
- We do not sell your data and do not share with third parties for marketing.

## 4. Photos
Photos you upload are stored on Cloudflare R2. Private slip photos are accessible only to you and admins. Photos attached to public records become accessible only after admin approval.

## 5. Retention
We keep your data while your account is active. When you delete records or your account, data is purged within 30 days.

## 6. Your Rights (PDPA)
You may at any time:
- **Access** your data via /settings
- **Correct** records by editing them
- **Delete** records or your account
- **Withdraw consent** by deleting your account
- **File a complaint** with Thailand''s PDPA office

## 7. Cookies
We use only essential cookies for authentication. We do not use tracking cookies.

## 8. Security
Passwords are hashed using PBKDF2-SHA256. All traffic is over HTTPS.

## 9. Changes
We may update this Policy. You will be asked to re-accept material changes before submitting new records.

## 10. Contact
**Data controller:** Manager.money
**Email:** privacy@manager.money',
unixepoch(), 1),

('legal-privacy-th-v1', 'privacy', 'th', 1,
'# Manager.money — นโยบายความเป็นส่วนตัว

**เวอร์ชัน:** 1

นโยบายความเป็นส่วนตัวนี้อธิบายข้อมูลที่เราเก็บและวิธีการใช้งาน เราปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย

## 1. ข้อมูลที่เราเก็บ
- **ข้อมูลบัญชี:** อีเมล ชื่อ รูปโปรไฟล์ (จาก Google หรือที่คุณกรอก)
- **ประวัติการชาร์จ:** แบรนด์ kWh ค่าใช้จ่าย เวลา ระยะทาง บันทึกย่อ และรูปภาพ (ถ้ามี)
- **ข้อมูลรถ:** รุ่นรถและชื่อเล่น (ตามที่คุณระบุ)
- **ข้อมูลเทคนิค:** IP address (ใช้เพื่อจำกัดอัตราการเข้าใช้งาน) และ session token

## 2. วิธีการใช้งาน
- เพื่อให้บริการ (จัดเก็บบันทึก แสดงประวัติของคุณ)
- เพื่อคำนวณราคาเฉลี่ยของชุมชน (เฉพาะบันทึกที่คุณตั้งเป็นสาธารณะและผ่านการอนุมัติจากผู้ดูแล)
- เพื่อป้องกันการใช้งานที่ผิดวัตถุประสงค์ (rate limiting, ตรวจจับการทุจริต)

## 3. การแชร์ข้อมูล
- บันทึกที่ตั้งเป็น "สาธารณะ" จะนำไปคำนวณค่าเฉลี่ยแบบไม่ระบุตัวตนใน /ev ชื่อแสดงและ slug ของคุณจะปรากฏที่ /u/slug-ของคุณ ก็ต่อเมื่อคุณเปิดการแชร์สาธารณะในตั้งค่า
- บันทึกส่วนตัวมองเห็นได้เฉพาะคุณและผู้ดูแลที่ตรวจบันทึกสาธารณะอื่น ๆ ของคุณ
- เราไม่ขายข้อมูลของคุณและไม่แชร์ข้อมูลกับบุคคลที่สามเพื่อการตลาด

## 4. รูปภาพ
รูปภาพที่คุณอัปโหลดจัดเก็บใน Cloudflare R2 รูปสลิปส่วนตัวเข้าถึงได้เฉพาะคุณและผู้ดูแล รูปที่แนบกับบันทึกสาธารณะจะเข้าถึงได้หลังจากผู้ดูแลอนุมัติแล้ว

## 5. การเก็บรักษา
เราเก็บข้อมูลของคุณตราบที่บัญชียังใช้งานอยู่ เมื่อคุณลบบันทึกหรือบัญชี ข้อมูลจะถูกลบภายใน 30 วัน

## 6. สิทธิ์ของคุณ (PDPA)
คุณสามารถ:
- **เข้าถึง** ข้อมูลของคุณที่ /settings
- **แก้ไข** บันทึก
- **ลบ** บันทึกหรือบัญชี
- **ถอนความยินยอม** โดยลบบัญชี
- **ร้องเรียน** ต่อสำนักงาน PDPA ของประเทศไทย

## 7. คุกกี้
เราใช้คุกกี้เฉพาะเพื่อการยืนยันตัวตนเท่านั้น ไม่ใช้คุกกี้สำหรับการติดตาม

## 8. ความปลอดภัย
รหัสผ่านถูกแฮชด้วย PBKDF2-SHA256 การส่งข้อมูลทั้งหมดผ่าน HTTPS

## 9. การเปลี่ยนแปลง
เราอาจปรับปรุงนโยบายนี้ คุณจะถูกขอให้ยอมรับการเปลี่ยนแปลงสำคัญก่อนส่งบันทึกใหม่

## 10. ติดต่อ
**ผู้ควบคุมข้อมูล:** Manager.money
**อีเมล:** privacy@manager.money',
unixepoch(), 1);
