<!--
title: 'Serverless Framework Node Express API service backed by DynamoDB on AWS'
description: 'This template demonstrates how to develop and deploy a simple Node Express API service backed by DynamoDB running on AWS Lambda using the Serverless Framework.'
layout: Doc
framework: v4
platform: AWS
language: nodeJS
priority: 1
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, Inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

## mazen-poll — Serverless Polls API

خدمة صغيرة مبنية بـ Serverless على AWS لتخزين وإدارة استطلاعات رأي بسيطة في DynamoDB.

هذا المشروع يعرّف مجموعة من الـ Lambda handlers في `src/poll` وتُعرّف في [serverless.yml](serverless.yml) لتوفير واجهة HTTP بسيطة لإدارة الاستطلاعات.

**مميزات المشروع**:
- إنشاء استطلاع جديد
- استرجاع واستعراض الاستطلاعات
- تصويت على خيار داخل استطلاع
- حساب النتائج (نسب مئوية)
- توليد رابط وQR للاستطلاع
- إرسال النتائج إلى ClickUp (اختياري)

**مهم — المتغيرات البيئية**
- `POLLS_TABLE` : اسم جدول DynamoDB (مكوّن في `serverless.yml` كـ `polls-table-dev`).
- `FRONTEND_URL` : رابط الواجهة الأمامية المستخدم لتوليد روابط الاستطلاع وQR.
- `CLICKUP_TOKEN`, `CLICKUP_WORKSPACE_ID`, `CLICKUP_CHANNEL_ID` : مطلوبة فقط لو أردت استخدام endpoint إرسال النتائج إلى ClickUp.

### الوظائف وطرق الـ HTTP

الطرق مضبوطة في [serverless.yml](serverless.yml). المسارات الأساسية:

- `POST /poll` — `createPoll` — إنشاء استطلاع جديد
  - Body (JSON): `{ "question": "...", "options": ["opt1", "opt2", ...] }`
  - يستجيب بـ `201` ويعيد كائن الاستطلاع مع `id`, `options` (كل خيار له `id` و`votes`).

- `GET /poll` — `listPolls` — استرجاع كل الاستطلاعات

- `GET /poll/{id}` — `getPoll` — استرجاع تفاصيل استطلاع معين

- `POST /poll/{id}/vote` — `votePoll` — تسجيـل تصويت
  - Body (JSON): `{ "optionId": "<option-id>" }`
  - يستجيب بـ `200` عند النجاح.

- `GET /poll/{id}/results` — `getResults` — حساب النتائج والنسب المئوية

- `GET /poll/{id}/link` — `getPollLink` — إرجاع رابط واجهة المستخدم للموضوع وبيانات QR (Data URL)

- `POST /poll/{id}/send` — `sendResults` — إرسال نتائج الاستطلاع إلى قناة ClickUp (يحتاج متغيرات ClickUp)

### أمثلة سريعّة

إنشاء استطلاع:

```bash
curl -X POST https://<api>/poll \
  -H "Content-Type: application/json" \
  -d '{"question":"ما هو أفضل لغة؟","options":["JavaScript","Python","Go"]}'
```

التصويت لخيار:

```bash
curl -X POST https://<api>/poll/<pollId>/vote \
  -H "Content-Type: application/json" \
  -d '{"optionId":"<optionId>"}'
```

جلب النتائج:

```bash
curl https://<api>/poll/<pollId>/results
```

جلب رابط وQR:

```bash
curl https://<api>/poll/<pollId>/link
```

### الإعداد والتشغيل

1. تثبيت الحزم:

```bash
npm install
```

2. تشغيل محليًا (Serverless Framework dev):

```bash
npx serverless dev
```

3. نشر إلى AWS:

```bash
npx serverless deploy
```

4. إعداد متغيرات البيئة (`.env`)

نسخة مثال لملف المتغيرات موجودة في `.env.example`. أنسخ الملف واملأ القيم المطلوبة قبل النشر أو التشغيل المحلي:

```bash
# copy on Windows PowerShell
Copy-Item .env.example .env

# copy on macOS / Linux
cp .env.example .env
```

ستحتاج على الأقل إلى ملء:

- `POLLS_TABLE` — اسم جدول DynamoDB (افتراضي: `polls-table-dev`)
- `FRONTEND_URL` — رابط الواجهة الأمامية لتوليد روابط الاستطلاع وQR
- ClickUp vars (اختياري): `CLICKUP_TOKEN`, `CLICKUP_WORKSPACE_ID`, `CLICKUP_CHANNEL_ID`

لتعيين متغيرات بيئة لجلسة PowerShell مؤقتًا قبل النشر، مثلاً:

```powershell
$env:CLICKUP_TOKEN = "your_token_here"
$env:CLICKUP_WORKSPACE_ID = "your_workspace_id"
$env:CLICKUP_CHANNEL_ID = "your_channel_id"
npx serverless deploy
```

أو على macOS / Linux:

```bash
export CLICKUP_TOKEN="your_token_here"
export CLICKUP_WORKSPACE_ID="your_workspace_id"
export CLICKUP_CHANNEL_ID="your_channel_id"
npx serverless deploy
```

ملاحظة: لا تقم بضغط أو تخزين مفاتيح حساسة في نظام التحكم بالإصدارات.

### ملاحظات تنفيذية
- جدول DynamoDB معرف في `serverless.yml` باسم `polls-table-dev` ويحتوي على المفتاح الأساسي `id`.
- عملية إنشاء الاستطلاع تُنشئ `id` عشوائي لكل استطلاع ولكل خيار، وتبدأ الأصوات (`votes`) من صفر.
- نقطة إرسال النتائج (`/poll/{id}/send`) تتطلب إعداد متغيرات ClickUp في بيئة النشر.
- مسار توليد الـ QR يستخدم `FRONTEND_URL` لبناء رابط الواجهة الأمامية.

إذا تحب، أقدر أضيف أمثلة استجابة فعلية، أو أعدّل ملف الـ README بالعربية أو الإنجليزية بشكل أوضح حسب رغبتك.
