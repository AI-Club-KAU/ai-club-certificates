import type { CertificateKind } from '../types';

/**
 * Role mapping: the participant's role (from the "الدور" column in the attendance sheet,
 * or the event's default role in the events tab) → the certificate kind and wording.
 *
 * Each role has:
 *   key       stable id (used in the code and for defaults)
 *   kind      which certificate it gets:
 *               'attendance'    → شهادة حضور         "قد حضرت ورشة عمل بعنوان"
 *               'participation' → شهادة مشاركة       "قد شاركت في مسابقة بعنوان"
 *               'thanks'        → شهادة شكر وتقدير   "تقديرًا لجهودها في تنظيم ورشة عمل بعنوان"
 *   labels    words accepted in the sheet. The FIRST one is shown on the website.
 *             Matching ignores spaces, letter case, diacritics/shadda and أ/إ/ا, ة/ه variants.
 *
 *   For attendance / participation (sentence "قد <verb> <after> <type> بعنوان"):
 *   male / female  the verb for طلاب / طالبات
 *   after     words between the verb and the event type:
 *               ''          → "قد حضرت ورشة عمل بعنوان"
 *               'في'        → "قد شاركت في ورشة عمل بعنوان"
 *               'لـ'        → joined to the noun: "قد خطّطت لورشة عمل بعنوان"
 *
 *   For thanks (sentence "تقديرًا لجهودها في <thanks> <type> بعنوان"):
 *   thanks    the words after "تقديرًا لجهوده/لجهودها في". When left out, the first label is used:
 *               (none)              → "تقديرًا لجهودها في تنظيم ورشة عمل بعنوان"
 *               'تمثيل النادي في'   → "تقديرًا لجهودها في تمثيل النادي في فعالية بعنوان"
 *               'التخطيط لـ'        → joined to the noun: "تقديرًا لجهودها في التخطيط لورشة عمل بعنوان"
 *
 * To add a role: add one line below. No other file needs to change.
 */
export interface RoleDefinition {
  key: string;
  kind: CertificateKind;
  labels: string[];
  male: string;
  female: string;
  after: string;
  thanks?: string;
}

export const roles: RoleDefinition[] = [
  // ── شهادة حضور ──
  { key: 'attendance', kind: 'attendance', labels: ['حضور', 'الحضور', 'حاضر', 'حاضرة', 'attendance', 'attendee'], male: 'حضر', female: 'حضرت', after: '' },
  { key: 'interaction', kind: 'attendance', labels: ['تفاعل', 'التفاعل'], male: 'تفاعل', female: 'تفاعلت', after: 'في' },
  { key: 'benefit', kind: 'attendance', labels: ['استفادة', 'الاستفادة'], male: 'استفاد', female: 'استفادت', after: 'من' },

  // ── شهادة مشاركة ──
  { key: 'participation', kind: 'participation', labels: ['مشاركة', 'المشاركة', 'مشارك', 'مشاركه', 'participation', 'participant'], male: 'شارك', female: 'شاركت', after: 'في' },
  { key: 'competing', kind: 'participation', labels: ['منافسة', 'المنافسة', 'متسابق', 'متسابقة'], male: 'نافس', female: 'نافست', after: 'في' },
  { key: 'challenge', kind: 'participation', labels: ['تحدي', 'التحدي'], male: 'تحدّى', female: 'تحدّت', after: 'في' },
  { key: 'qualification', kind: 'participation', labels: ['تأهل', 'التأهل', 'متأهل', 'متأهلة'], male: 'تأهّل', female: 'تأهّلت', after: 'في' },
  { key: 'winning', kind: 'participation', labels: ['فوز', 'الفوز', 'فائز', 'فائزة', 'winner'], male: 'فاز', female: 'فازت', after: 'في' },
  { key: 'development', kind: 'participation', labels: ['تطوير', 'التطوير', 'مطور', 'مطورة'], male: 'طوّر', female: 'طوّرت', after: 'مشروعًا في' },
  { key: 'programming', kind: 'participation', labels: ['برمجة', 'البرمجة', 'مبرمج', 'مبرمجة'], male: 'برمج', female: 'برمجت', after: 'مشروعًا في' },
  { key: 'innovation', kind: 'participation', labels: ['ابتكار', 'الابتكار'], male: 'ابتكر', female: 'ابتكرت', after: 'حلًّا في' },

  // ── شهادة شكر وتقدير: تنظيم وفريق العمل ──
  { key: 'organizing', kind: 'thanks', labels: ['تنظيم', 'التنظيم', 'منظم', 'منظمة', 'organizer', 'organizing'], male: 'نظّم', female: 'نظّمت', after: '' },
  { key: 'representation', kind: 'thanks', labels: ['تمثيل', 'التمثيل', 'تمثيل النادي', 'تمثيل نادي'], male: 'مثّل', female: 'مثّلت', after: 'النادي في', thanks: 'تمثيل النادي في' },
  { key: 'coordination', kind: 'thanks', labels: ['تنسيق', 'التنسيق', 'منسق', 'منسقة'], male: 'نسّق', female: 'نسّقت', after: '' },
  { key: 'management', kind: 'thanks', labels: ['إدارة', 'الإدارة'], male: 'أدار', female: 'أدارت', after: '' },
  { key: 'supervision', kind: 'thanks', labels: ['إشراف', 'الإشراف', 'مشرف', 'مشرفة'], male: 'أشرف', female: 'أشرفت', after: 'على', thanks: 'الإشراف على' },
  { key: 'leadership', kind: 'thanks', labels: ['قيادة', 'القيادة'], male: 'قاد', female: 'قادت', after: '' },
  { key: 'team-leadership', kind: 'thanks', labels: ['قيادة فريق', 'قائد فريق', 'قائدة فريق'], male: 'قاد', female: 'قادت', after: 'فريقًا في', thanks: 'قيادة الفريق في' },
  { key: 'assistance', kind: 'thanks', labels: ['مساعدة', 'المساعدة'], male: 'ساعد', female: 'ساعدت', after: 'في', thanks: 'المساعدة في' },
  { key: 'preparation', kind: 'thanks', labels: ['تجهيز', 'التجهيز'], male: 'جهّز', female: 'جهّزت', after: '' },
  { key: 'setup', kind: 'thanks', labels: ['إعداد', 'الإعداد'], male: 'أعدّ', female: 'أعدّت', after: '' },
  { key: 'reception', kind: 'thanks', labels: ['استقبال', 'الاستقبال'], male: 'استقبل', female: 'استقبلت', after: 'الضيوف في', thanks: 'استقبال الضيوف في' },
  { key: 'registration', kind: 'thanks', labels: ['تسجيل', 'التسجيل'], male: 'سجّل', female: 'سجّلت', after: 'الحضور في', thanks: 'تسجيل الحضور في' },
  { key: 'follow-up', kind: 'thanks', labels: ['متابعة', 'المتابعة'], male: 'تابع', female: 'تابعت', after: '' },
  { key: 'planning', kind: 'thanks', labels: ['تخطيط', 'التخطيط'], male: 'خطّط', female: 'خطّطت', after: 'لـ', thanks: 'التخطيط لـ' },
  { key: 'execution', kind: 'thanks', labels: ['تنفيذ', 'التنفيذ'], male: 'نفّذ', female: 'نفّذت', after: '' },

  // ── شهادة شكر وتقدير: تطوع ودعم ──
  { key: 'volunteering', kind: 'thanks', labels: ['تطوع', 'التطوع', 'متطوع', 'متطوعة'], male: 'تطوّع', female: 'تطوّعت', after: 'في', thanks: 'العمل التطوعي في' },
  { key: 'support', kind: 'thanks', labels: ['دعم', 'الدعم'], male: 'دعم', female: 'دعمت', after: '' },
  { key: 'service', kind: 'thanks', labels: ['خدمة', 'الخدمة'], male: 'خدم', female: 'خدمت', after: 'في', thanks: 'خدمة المشاركين في' },
  { key: 'cooperation', kind: 'thanks', labels: ['تعاون', 'التعاون'], male: 'تعاون', female: 'تعاونت', after: 'في', thanks: 'التعاون في' },
  { key: 'tech-support', kind: 'thanks', labels: ['دعم تقني', 'الدعم التقني'], male: 'دعم', female: 'دعمت', after: 'تقنيًا', thanks: 'الدعم التقني في' },

  // ── شهادة شكر وتقدير: تقديم وتدريب وتحكيم (غالبًا تُرسل يدويًا، لكنها مدعومة) ──
  { key: 'presenting', kind: 'thanks', labels: ['تقديم', 'التقديم', 'مقدم', 'مقدمة', 'presenter'], male: 'قدّم', female: 'قدّمت', after: '' },
  { key: 'training', kind: 'thanks', labels: ['تدريب', 'التدريب', 'مدرب', 'مدربة', 'trainer'], male: 'درّب', female: 'درّبت', after: 'في', thanks: 'تدريب المشاركين في' },
  { key: 'teaching', kind: 'thanks', labels: ['تدريس', 'التدريس'], male: 'درّس', female: 'درّست', after: 'في', thanks: 'التدريس في' },
  { key: 'explaining', kind: 'thanks', labels: ['شرح', 'الشرح'], male: 'شرح', female: 'شرحت', after: 'في', thanks: 'الشرح في' },
  { key: 'lecturing', kind: 'thanks', labels: ['إلقاء', 'الإلقاء', 'ملقي', 'ملقية'], male: 'ألقى', female: 'ألقت', after: 'محاضرة في', thanks: 'إلقاء محاضرة في' },
  { key: 'directing', kind: 'thanks', labels: ['توجيه', 'التوجيه'], male: 'وجّه', female: 'وجّهت', after: 'المشاركين في', thanks: 'توجيه المشاركين في' },
  { key: 'mentoring', kind: 'thanks', labels: ['إرشاد', 'الإرشاد', 'مرشد', 'مرشدة', 'mentor'], male: 'أرشد', female: 'أرشدت', after: 'المشاركين في', thanks: 'إرشاد المشاركين في' },
  { key: 'facilitation', kind: 'thanks', labels: ['تيسير', 'التيسير', 'ميسر', 'ميسرة', 'facilitator'], male: 'يسّر', female: 'يسّرت', after: '' },
  { key: 'qualifying-others', kind: 'thanks', labels: ['تأهيل', 'التأهيل'], male: 'أهّل', female: 'أهّلت', after: 'المشاركين في', thanks: 'تأهيل المشاركين في' },
  { key: 'judging', kind: 'thanks', labels: ['تحكيم', 'التحكيم', 'محكم', 'محكمة', 'judge'], male: 'حكّم', female: 'حكّمت', after: '' },
  { key: 'evaluation', kind: 'thanks', labels: ['تقييم', 'التقييم', 'مقيم', 'مقيمة'], male: 'قيّم', female: 'قيّمت', after: 'المشاركات في', thanks: 'تقييم المشاركات في' },

  // ── شهادة شكر وتقدير: الإعلام والمحتوى ──
  { key: 'design', kind: 'thanks', labels: ['تصميم', 'التصميم', 'مصمم', 'مصممة', 'designer'], male: 'صمّم', female: 'صمّمت', after: 'في', thanks: 'أعمال التصميم في' },
  { key: 'photography', kind: 'thanks', labels: ['تصوير', 'التصوير', 'مصور', 'مصورة'], male: 'صوّر', female: 'صوّرت', after: '' },
  { key: 'coverage', kind: 'thanks', labels: ['تغطية', 'التغطية'], male: 'غطّى', female: 'غطّت', after: '' },
  { key: 'documentation', kind: 'thanks', labels: ['توثيق', 'التوثيق'], male: 'وثّق', female: 'وثّقت', after: '' },
  { key: 'writing', kind: 'thanks', labels: ['كتابة', 'الكتابة', 'كاتب', 'كاتبة'], male: 'كتب', female: 'كتبت', after: 'محتوى', thanks: 'كتابة المحتوى في' },
  { key: 'editing', kind: 'thanks', labels: ['تحرير', 'التحرير', 'محرر', 'محررة'], male: 'حرّر', female: 'حرّرت', after: 'محتوى', thanks: 'تحرير المحتوى في' },
  { key: 'production', kind: 'thanks', labels: ['إنتاج', 'الإنتاج'], male: 'أنتج', female: 'أنتجت', after: 'محتوى', thanks: 'إنتاج المحتوى في' },
  { key: 'review', kind: 'thanks', labels: ['مراجعة', 'المراجعة'], male: 'راجع', female: 'راجعت', after: 'محتوى', thanks: 'مراجعة المحتوى في' },
  { key: 'approval', kind: 'thanks', labels: ['اعتماد', 'الاعتماد'], male: 'اعتمد', female: 'اعتمدت', after: '' },
];
