// استيراد مكتبات Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"; 

// **إعدادات التطبيق:** يجب أن تتطابق مع الملفات الأخرى لضمان المسار الصحيح
const defaultAppId = '1:168805958858:web:bccc84abcf58a180132033';
const dynamicAppId = typeof __app_id !== 'undefined' ? __app_id : defaultAppId;

const firebaseConfig = {
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  messagingSenderId: "16880858",
  appId: dynamicAppId, // استخدام القيمة المصححة هنا
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null; // سيتم تعيينه بعد المصادقة المجهولة
let selectedPitchId = null;

// عناصر الـ DOM
const statusMessage = document.getElementById('statusMessage');
const pitchContent = document.getElementById('pitchContent');
const pitchTitleDisplay = document.getElementById('pitchTitleDisplay');
const pitchTaglineDisplay = document.getElementById('pitchTaglineDisplay');
const ctaButtonTop = document.getElementById('ctaButtonTop');
const ctaButtonBottom = document.getElementById('ctaButtonBottom');
const dynamicPitchBody = document.getElementById('dynamicPitchBody');
const pageTitle = document.getElementById('pageTitle');

/* ========================================================= */
/* دوال رسم الأقسام الديناميكية */
/* ========================================================= */

// دالة رسم قسم الوصف
function renderDescriptionSection(section) {
    if (!section.lines || section.lines.length === 0) return '';
    
    let linesHtml = section.lines.map(line => 
        // عرض الأسطر مع فواصل بينها (إحساس حسي-بصري بالقراءة المنظمة)
        `<p class="text-gray-700 leading-relaxed mb-3">${line.content}</p>`
    ).join('');
    
    return `
        <div class="p-6 bg-white rounded-xl shadow-md">
            <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">الوصف التفصيلي</h3>
            ${linesHtml}
        </div>
    `;
}

// دالة رسم قسم الصور
function renderImageSection(section) {
    if (!section.images || section.images.length === 0) return '';
    
    let imagesHtml = section.images.map(url => `
        <div class="overflow-hidden rounded-lg shadow-lg aspect-video">
            <img src="${url}" alt="صورة المنتج" class="w-full h-full object-cover transition duration-300 hover:scale-105" loading="lazy">
        </div>
    `).join('');
    
    return `
        <div class="p-6 bg-white rounded-xl shadow-md">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">معرض الصور</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${imagesHtml}
            </div>
        </div>
    `;
}

// دالة رسم بطاقة المعلومة/الميزة
function renderInfoCardSection(section) {
    if (!section.items || section.items.length === 0) return '';
    
    let itemsHtml = section.items.map(item => `
        <div class="info-card p-4 rounded-lg flex items-start space-x-4 space-x-reverse">
            <span class="material-symbols-outlined text-3xl text-red-600 mt-1">check_circle</span>
            <div>
                <p class="font-bold text-gray-800">${item.key}</p>
                <p class="text-sm text-gray-600">${item.value}</p>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="p-6 bg-white rounded-xl shadow-md">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">أبرز المميزات ونقاط القوة</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${itemsHtml}
            </div>
        </div>
    `;
}

/* ========================================================= */
/* دالة جلب البيانات الرئيسية وعرضها */
/* ========================================================= */

async function fetchAndRenderPitch(pitchId, userId) {
    if (!pitchId || !userId) {
        statusMessage.innerHTML = '<p class="text-red-500 font-bold">خطأ: لا يوجد معرف عرض أو مستخدم. تأكد من تهيئة الرابط والمصادقة.</p>';
        return;
    }

    // 1. جلب بيانات العرض الأساسية من مجموعة 'pitches'
    const pitchRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${userId}/pitches`, pitchId);
    const pitchSnap = await getDoc(pitchRef);

    if (!pitchSnap.exists()) {
        statusMessage.innerHTML = '<p class="text-red-500 font-bold">لم يتم العثور على هذا العرض. قد يكون محذوفًا.</p>';
        return;
    }

    const pitchData = pitchSnap.data();
    const productId = pitchData.productId;

    // 2. جلب التفاصيل الديناميكية من وثيقة 'productDetails' (كما تم حفظها)
    const detailsRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${userId}/productDetails`, productId);
    const detailsSnap = await getDoc(detailsRef);

    if (!detailsSnap.exists()) {
        statusMessage.innerHTML = '<p class="text-red-500 font-bold">تم العثور على العرض، ولكن تفاصيل المحتوى مفقودة. (حالة نادرة)</p>';
        return;
    }

    const detailsData = detailsSnap.data();
    
    // 3. تحديث عناصر الهيدر والعنوان (إحساس باليقين)
    pitchTitleDisplay.textContent = detailsData.title || 'عرض خاص';
    pitchTaglineDisplay.textContent = detailsData.tagline || 'فرصة لن تتكرر';
    pageTitle.textContent = detailsData.title || 'صفحة العرض الخاصة';
    
    const ctaText = detailsData.callToActionText || 'تواصل معنا الآن!';
    ctaButtonTop.textContent = ctaText;
    ctaButtonBottom.textContent = ctaText;
    
    // إضافة رابط وهمي لزر CTA (يمكن استبداله بآلية طلب حقيقية لاحقاً)
    const ctaLink = `#contact`;
    ctaButtonTop.parentElement.href = ctaLink; 
    ctaButtonBottom.parentElement.href = ctaLink; 
    ctaButtonTop.onclick = () => alert("سوف يتم توجيهك لنموذج الطلب/التواصل!");
    ctaButtonBottom.onclick = () => alert("سوف يتم توجيهك لنموذج الطلب/التواصل!");

    // 4. بناء المحتوى الديناميكي (Body)
    dynamicPitchBody.innerHTML = '';
    
    if (detailsData.dynamicSections && Array.isArray(detailsData.dynamicSections)) {
        detailsData.dynamicSections
            .sort((a, b) => a.order - b.order) // ترتيب الأقسام
            .forEach(section => {
                let sectionHtml = '';
                switch (section.type) {
                    case 'description':
                        sectionHtml = renderDescriptionSection(section);
                        break;
                    case 'images':
                        sectionHtml = renderImageSection(section);
                        break;
                    case 'info_card':
                        sectionHtml = renderInfoCardSection(section);
                        break;
                }
                if (sectionHtml) {
                    dynamicPitchBody.insertAdjacentHTML('beforeend', sectionHtml);
                }
            });
    }

    // 5. إخفاء رسالة التحميل وإظهار المحتوى
    statusMessage.classList.add('hidden');
    pitchContent.classList.remove('hidden');
}


/* ========================================================= */
/* التهيئة والمصادقة (Authentication) */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. استخراج pitchId من رابط URL
    const urlParams = new URLSearchParams(window.location.search);
    selectedPitchId = urlParams.get('pitchId');

    if (!selectedPitchId) {
        statusMessage.innerHTML = '<p class="text-red-500 font-bold">معرّف العرض مفقود في الرابط. لا يمكن تحميل الصفحة.</p>';
        return;
    }

    // 2. المصادقة المجهولة (ضرورية لقراءة البيانات من مسار artifacts)
    signInAnonymously(auth)
        .then((credential) => {
            currentUserId = credential.user.uid;
            // 3. بمجرد المصادقة، ابدأ بجلب البيانات
            fetchAndRenderPitch(selectedPitchId, currentUserId);
        })
        .catch((error) => {
            console.error("خطأ حاسم في المصادقة المجهولة:", error);
            statusMessage.innerHTML = '<p class="text-red-500 font-bold">فشل المصادقة. تعذر جلب محتوى العرض. (راجع قواعد الأمان).</p>';
        });
});
