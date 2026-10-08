/**
 * Role mapping: the participant's role (from the "الدور" column in the sheet,
 * usually chosen in the Google Form) → the verb printed on the certificate.
 *
 *   الشطر طلاب   → male   form:  "قد شارك في ورشة عمل بعنوان"
 *   الشطر طالبات → female form:  "قد شاركت في ورشة عمل بعنوان"
 *
 * Each role has:
 *   key       stable id (used in the code and for defaults)
 *   labels    words accepted in the sheet. The FIRST one is shown on the website.
 *             Matching ignores spaces, letter case, diacritics/shadda and أ/إ/ا, ة/ه variants.
 *   male / female  the verb for طلاب / طالبات
 *   after     words between the verb and the event type:
 *               ''          → "قد نظّمت ورشة عمل بعنوان"
 *               'في'        → "قد شاركت في ورشة عمل بعنوان"
 *               'لـ'        → joined to the noun: "قد خطّطت لورشة عمل بعنوان"
 *
 * To add a role: add one line below. No other file needs to change.
 */
export interface RoleDefinition {
  key: string;
  labels: string[];
  male: string;
  female: string;
  after: string;
}

export const roles: RoleDefinition[] = [
  // Attendance & participation
  { key: 'attendance', labels: ['حضور', 'الحضور', 'حاضر', 'حاضرة', 'attendance', 'attendee'], male: 'حضر', female: 'حضرت', after: '' },
  { key: 'participation', labels: ['مشاركة', 'المشاركة', 'مشارك', 'مشاركه', 'participation', 'participant'], male: 'شارك', female: 'شاركت', after: 'في' },
  { key: 'interaction', labels: ['تفاعل', 'التفاعل'], male: 'تفاعل', female: 'تفاعلت', after: 'في' },
  { key: 'contribution', labels: ['مساهمة', 'المساهمة'], male: 'ساهم', female: 'ساهمت', after: 'في' },
  { key: 'benefit', labels: ['استفادة', 'الاستفادة'], male: 'استفاد', female: 'استفادت', after: 'من' },

  // Organising team
  { key: 'organizing', labels: ['تنظيم', 'التنظيم', 'منظم', 'منظمة', 'organizer', 'organizing'], male: 'نظّم', female: 'نظّمت', after: '' },
  { key: 'coordination', labels: ['تنسيق', 'التنسيق', 'منسق', 'منسقة'], male: 'نسّق', female: 'نسّقت', after: '' },
  { key: 'management', labels: ['إدارة', 'الإدارة'], male: 'أدار', female: 'أدارت', after: '' },
  { key: 'supervision', labels: ['إشراف', 'الإشراف', 'مشرف', 'مشرفة'], male: 'أشرف', female: 'أشرفت', after: 'على' },
  { key: 'leadership', labels: ['قيادة', 'القيادة'], male: 'قاد', female: 'قادت', after: '' },
  { key: 'team-leadership', labels: ['قيادة فريق', 'قائد فريق', 'قائدة فريق'], male: 'قاد', female: 'قادت', after: 'فريقًا في' },
  { key: 'assistance', labels: ['مساعدة', 'المساعدة'], male: 'ساعد', female: 'ساعدت', after: 'في' },
  { key: 'preparation', labels: ['تجهيز', 'التجهيز'], male: 'جهّز', female: 'جهّزت', after: '' },
  { key: 'setup', labels: ['إعداد', 'الإعداد'], male: 'أعدّ', female: 'أعدّت', after: '' },
  { key: 'reception', labels: ['استقبال', 'الاستقبال'], male: 'استقبل', female: 'استقبلت', after: 'الضيوف في' },
  { key: 'registration', labels: ['تسجيل', 'التسجيل'], male: 'سجّل', female: 'سجّلت', after: 'الحضور في' },

  // Volunteering & support
  { key: 'volunteering', labels: ['تطوع', 'التطوع', 'متطوع', 'متطوعة'], male: 'تطوّع', female: 'تطوّعت', after: 'في' },
  { key: 'support', labels: ['دعم', 'الدعم'], male: 'دعم', female: 'دعمت', after: '' },
  { key: 'service', labels: ['خدمة', 'الخدمة'], male: 'خدم', female: 'خدمت', after: 'في' },
  { key: 'cooperation', labels: ['تعاون', 'التعاون'], male: 'تعاون', female: 'تعاونت', after: 'في' },

  // Presenting & teaching
  { key: 'presenting', labels: ['تقديم', 'التقديم', 'مقدم', 'مقدمة', 'presenter'], male: 'قدّم', female: 'قدّمت', after: '' },
  { key: 'training', labels: ['تدريب', 'التدريب', 'مدرب', 'مدربة', 'trainer'], male: 'درّب', female: 'درّبت', after: 'في' },
  { key: 'teaching', labels: ['تدريس', 'التدريس'], male: 'درّس', female: 'درّست', after: 'في' },
  { key: 'explaining', labels: ['شرح', 'الشرح'], male: 'شرح', female: 'شرحت', after: 'في' },
  { key: 'lecturing', labels: ['إلقاء', 'الإلقاء', 'ملقي', 'ملقية'], male: 'ألقى', female: 'ألقت', after: 'محاضرة في' },
  { key: 'directing', labels: ['توجيه', 'التوجيه'], male: 'وجّه', female: 'وجّهت', after: 'المشاركين في' },
  { key: 'mentoring', labels: ['إرشاد', 'الإرشاد', 'مرشد', 'مرشدة', 'mentor'], male: 'أرشد', female: 'أرشدت', after: 'المشاركين في' },
  { key: 'facilitation', labels: ['تيسير', 'التيسير', 'ميسر', 'ميسرة', 'facilitator'], male: 'يسّر', female: 'يسّرت', after: '' },
  { key: 'qualifying-others', labels: ['تأهيل', 'التأهيل'], male: 'أهّل', female: 'أهّلت', after: 'المشاركين في' },

  // Competitions & building
  { key: 'judging', labels: ['تحكيم', 'التحكيم', 'محكم', 'محكمة', 'judge'], male: 'حكّم', female: 'حكّمت', after: '' },
  { key: 'evaluation', labels: ['تقييم', 'التقييم', 'مقيم', 'مقيمة'], male: 'قيّم', female: 'قيّمت', after: 'المشاركات في' },
  { key: 'competing', labels: ['منافسة', 'المنافسة', 'متسابق', 'متسابقة'], male: 'نافس', female: 'نافست', after: 'في' },
  { key: 'challenge', labels: ['تحدي', 'التحدي'], male: 'تحدّى', female: 'تحدّت', after: 'في' },
  { key: 'development', labels: ['تطوير', 'التطوير', 'مطور', 'مطورة'], male: 'طوّر', female: 'طوّرت', after: 'مشروعًا في' },
  { key: 'programming', labels: ['برمجة', 'البرمجة', 'مبرمج', 'مبرمجة'], male: 'برمج', female: 'برمجت', after: 'مشروعًا في' },
  { key: 'design', labels: ['تصميم', 'التصميم', 'مصمم', 'مصممة', 'designer'], male: 'صمّم', female: 'صمّمت', after: 'في' },
  { key: 'execution', labels: ['تنفيذ', 'التنفيذ'], male: 'نفّذ', female: 'نفّذت', after: '' },
  { key: 'innovation', labels: ['ابتكار', 'الابتكار'], male: 'ابتكر', female: 'ابتكرت', after: 'حلًّا في' },
  { key: 'winning', labels: ['فوز', 'الفوز', 'فائز', 'فائزة', 'winner'], male: 'فاز', female: 'فازت', after: 'في' },
  { key: 'qualification', labels: ['تأهل', 'التأهل', 'متأهل', 'متأهلة'], male: 'تأهّل', female: 'تأهّلت', after: 'في' },

  // Media & content
  { key: 'photography', labels: ['تصوير', 'التصوير', 'مصور', 'مصورة'], male: 'صوّر', female: 'صوّرت', after: '' },
  { key: 'coverage', labels: ['تغطية', 'التغطية'], male: 'غطّى', female: 'غطّت', after: '' },
  { key: 'documentation', labels: ['توثيق', 'التوثيق'], male: 'وثّق', female: 'وثّقت', after: '' },
  { key: 'writing', labels: ['كتابة', 'الكتابة', 'كاتب', 'كاتبة'], male: 'كتب', female: 'كتبت', after: 'محتوى' },
  { key: 'editing', labels: ['تحرير', 'التحرير', 'محرر', 'محررة'], male: 'حرّر', female: 'حرّرت', after: 'محتوى' },
  { key: 'production', labels: ['إنتاج', 'الإنتاج'], male: 'أنتج', female: 'أنتجت', after: 'محتوى' },
  { key: 'tech-support', labels: ['دعم تقني', 'الدعم التقني'], male: 'دعم', female: 'دعمت', after: 'تقنيًا' },

  // Representation & planning
  { key: 'representation', labels: ['تمثيل', 'التمثيل'], male: 'مثّل', female: 'مثّلت', after: 'النادي في' },
  { key: 'follow-up', labels: ['متابعة', 'المتابعة'], male: 'تابع', female: 'تابعت', after: '' },
  { key: 'planning', labels: ['تخطيط', 'التخطيط'], male: 'خطّط', female: 'خطّطت', after: 'لـ' },
  { key: 'review', labels: ['مراجعة', 'المراجعة'], male: 'راجع', female: 'راجعت', after: 'محتوى' },
  { key: 'approval', labels: ['اعتماد', 'الاعتماد'], male: 'اعتمد', female: 'اعتمدت', after: '' },
];
