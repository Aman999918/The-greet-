// استيراد مكتبات Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/esm-browser/v4.js';

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**
const firebaseConfig = {
  // يرجى التأكد من أن هذه الإعدادات مطابقة للإعدادات الفعلية
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg", 
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  messagingSenderId: "16880858",
  appId: "1:168805958858:web:bccc84abcf58aa180132033",
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUserId = null; 

// العناصر الأساسية للـ DOM
const productIdSelect = document.getElementById('productIdSelect'); 
const unitPriceInput = document.getElementById('unitPrice');
const discountInput = document.getElementById('discount');
const finalPriceDisplay = document.getElementById('finalPriceDisplay');
const finalPriceHiddenInput = document.getElementById('finalPrice');
const dynamicSectionsContainer = document.getElementById('dynamicSectionsContainer');
const addSectionButton = document.getElementById('addSectionButton');
const closingArgumentsContainer = document.getElementById('closingArgumentsContainer');
const addClosingArgumentButton = document.getElementById('addClosingArgumentButton');
const offerForm = document.getElementById('offer-form');
const saveOfferButton = document.getElementById('saveOfferButton');
const statusMessage = document.getElementById('statusMessage');
const offerLinkDisplay = document.getElementById('offerLinkDisplay');
const generatedLink = document.getElementById('generatedLink');
const copyLinkButton = document.getElementById('copyLinkButton');


/* ========================================================= */
/* دالة جلب المنتجات لملء القائمة المنسدلة (مُعدّلة باستخدام المسار الصحيح) */
/* ========================================================= */

async function populateProductSelect() {
    productIdSelect.innerHTML = '<option value="" disabled selected>... جاري تحميل المنتجات ...</option>';
    statusMessage.classList.add('hidden'); 

    if (!currentUserId) {
        // في حال عدم انتهاء المصادقة بعد
        productIdSelect.innerHTML = '<option value="" disabled selected>جاري المصادقة...</option>';
        return; 
    }

    try {
        // **الإصلاح الجذري:** استخدام مسار الـ Sub-Collection: artifacts/[appId]/users/[userId]/products
        const productsCol = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);
        const productSnapshot = await getDocs(productsCol);

        if (productSnapshot.empty) {
            productIdSelect.innerHTML = '<option value="" disabled selected>لا توجد منتجات متاحة</option>';
            statusMessage.textContent = 'تنبيه: لا توجد منتجات مُضافة في حسابك الخاص.';
            statusMessage.className = 'text-center mt-3 error';
            statusMessage.classList.remove('hidden');
            return;
        }

        let optionsHtml = '<option value="" disabled selected>اختر المنتج المستهدف</option>';
        productSnapshot.forEach(doc => {
            const product = doc.data();
            const productName = product.name || 'منتج غير مسمى';
            optionsHtml += `<option value="${doc.id}">${productName} (ID: ${doc.id.substring(0, 8)}...)</option>`;
        });
        
        productIdSelect.innerHTML = optionsHtml;
        
        // إظهار رسالة نجاح مؤقتة (إحساس سمعي بالانتهاء)
        statusMessage.textContent = 'تم تحميل قائمة المنتجات بنجاح.';
        statusMessage.className = 'text-center mt-3 success';
        setTimeout(() => statusMessage.classList.add('hidden'), 2000);

    } catch (error) {
        console.error("خطأ حاسم في جلب المنتجات:", error);
        productIdSelect.innerHTML = '<option value="" disabled selected>فشل تحميل المنتجات (راجع الأذونات)</option>';
        // تذكير المستخدم بضرورة فحص قوانين الأمان
        statusMessage.textContent = `فشل تحميل المنتجات: ${error.message}. (تحقق من قوانين أمان Firebase).`;
        statusMessage.className = 'text-center mt-3 error';
        statusMessage.classList.remove('hidden');
    }
}


/* ========================================================= */
/* دالة حساب السعر الديناميكي */
/* ========================================================= */

function calculateFinalPrice() {
    const price = parseFloat(unitPriceInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    
    let finalPrice = price * (1 - discount / 100);

    finalPriceDisplay.textContent = `${finalPrice.toFixed(2).toLocaleString('ar-SA')} ر.س`;
    finalPriceHiddenInput.value = finalPrice.toFixed(2);
}


/* ========================================================= */
/* دوال إدارة الحجج الإقناعية (بناء اليقين) */
/* ========================================================= */

let argumentCounter = 0;

function addClosingArgument() {
    argumentCounter++;
    const argumentId = `argument-${argumentCounter}`;

    const initialMessage = closingArgumentsContainer.querySelector('p.text-gray-500');
    if (initialMessage) {
        initialMessage.remove();
    }
    
    const argumentHtml = `
        <div id="${argumentId}" class="dynamic-section-card relative bg-white border-l-4 border-red-400">
            <h4 class="flex items-center gap-2 text-red-700">
                <span class="material-symbols-outlined">psychology_alt</span>
                حجة إقناعية #${argumentCounter}
            </h4>
            
            <button type="button" data-argument-id="${argumentId}" 
                    class="delete-argument-btn absolute top-3 left-3">حذف</button>
            
            <div class="mt-3">
                <label for="arg-title-${argumentId}" class="input-label">العنوان (الخطاف)</label>
                <input type="text" id="arg-title-${argumentId}" name="title" required 
                       placeholder="مثال: سوف تخترق السماء" class="input-field p-2 text-sm">
            </div>

            <div class="mt-3">
                 <label for="arg-details-${argumentId}" class="input-label">التفاصيل (بناء اليقين/القصة)</label>
                 <textarea id="arg-details-${argumentId}" name="details" rows="3" 
                           placeholder="هنا تسرد القصة أو التفاصيل التي تبني اليقين والدافع الوجداني." class="input-field p-2 text-sm"></textarea>
            </div>
            
            <input type="hidden" name="order" value="${argumentCounter}">
        </div>
    `;

    closingArgumentsContainer.insertAdjacentHTML('beforeend', argumentHtml);

    document.querySelector(`#${argumentId} .delete-argument-btn`).addEventListener('click', deleteClosingArgument);
}

function deleteClosingArgument(event) {
    const argumentId = event.currentTarget.dataset.argumentId;
    const argumentElement = document.getElementById(argumentId);
    
    if (argumentElement) {
        // تأثير حسي: اختفاء ناعم قبل الحذف
        argumentElement.style.opacity = 0;
        setTimeout(() => {
            argumentElement.remove();
            if (closingArgumentsContainer.children.length === 0) {
                closingArgumentsContainer.innerHTML = '<p class="text-gray-500 italic text-center">أضف النقاط الإقناعية التي تسبق كشف السعر.</p>';
            }
        }, 200); 
    }
}


/* ========================================================= */
/* دوال إدارة الأقسام الإضافية (الشروط/المزايا) */
/* ========================================================= */

let sectionCounter = 0; 

function addDynamicSection() {
    sectionCounter++;
    const sectionId = `section-${sectionCounter}`;

    const initialMessage = dynamicSectionsContainer.querySelector('p.text-gray-500');
    if (initialMessage) {
        initialMessage.remove();
    }
    
    const sectionHtml = `
        <div id="${sectionId}" class="dynamic-section-card relative">
            <h4 class="flex items-center gap-2">
                <span class="material-symbols-outlined text-red-600">tune</span>
                قسم مخصص #${sectionCounter}
            </h4>
            
            <button type="button" data-section-id="${sectionId}" class="delete-section-btn absolute top-3 left-3">حذف</button>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div class="col-span-2">
                    <label for="title-${sectionId}" class="input-label">عنوان القسم</label>
                    <input type="text" id="title-${sectionId}" name="title" required placeholder="مثال: أهم شروط العرض" class="input-field p-2 text-sm">
                </div>
                <div>
                    <label for="icon-${sectionId}" class="input-label">أيقونة (مثل payment)</label>
                    <input type="text" id="icon-${sectionId}" name="icon" value="info" placeholder="اسم الأيقونة" class="input-field p-2 text-sm">
                </div>
            </div>

            <div class="mt-3">
                 <label for="content-${sectionId}" class="input-label">المحتوى التفصيلي (نص أو قائمة مفصولة بـ '؛')</label>
                 <textarea id="content-${sectionId}" name="content" rows="3" placeholder="أدخل نصًا طويلاً، أو عدة نقاط مفصولة بعلامة (؛) لتصبح قائمة." class="input-field p-2 text-sm"></textarea>
            </div>
            
            <input type="hidden" name="order" value="${sectionCounter}">
        </div>
    `;

    dynamicSectionsContainer.insertAdjacentHTML('beforeend', sectionHtml);

    document.querySelector(`#${sectionId} .delete-section-btn`).addEventListener('click', deleteSection);
}

function deleteSection(event) {
    const sectionId = event.currentTarget.dataset.sectionId;
    const sectionElement = document.getElementById(sectionId);
    
    if (sectionElement) {
        sectionElement.style.opacity = 0;
        sectionElement.style.height = 0;
        sectionElement.style.margin = 0;
        sectionElement.style.overflow = 'hidden';
        
        setTimeout(() => {
            sectionElement.remove();
            if (dynamicSectionsContainer.children.length === 0) {
                dynamicSectionsContainer.innerHTML = '<p class="text-gray-500 italic text-center">لا توجد أقسام إضافية حتى الآن.</p>';
            }
        }, 300);
    }
}


/* ========================================================= */
/* دالة تجميع البيانات وحفظ العرض */
/* ========================================================= */

function collectOfferData() {
    const offerData = {
        productId: productIdSelect.value, 
        title: document.getElementById('offerTitle').value,
        tagline: document.getElementById('offerTagline').value,
        unitPrice: parseFloat(unitPriceInput.value) || 0,
        discount: parseFloat(discountInput.value) || 0,
        finalPrice: parseFloat(finalPriceHiddenInput.value) || 0,
        timestamp: new Date().toISOString(),
        status: 'Active',
        sections: [],
        closingArguments: [] 
    };

    // 1. تجميع الأقسام الإضافية (الشروط والمزايا)
    const sectionCards = dynamicSectionsContainer.querySelectorAll('.dynamic-section-card');
    sectionCards.forEach(card => {
        const title = card.querySelector('input[name="title"]').value;
        const icon = card.querySelector('input[name="icon"]').value;
        const contentRaw = card.querySelector('textarea[name="content"]').value;
        const order = parseInt(card.querySelector('input[name="order"]').value);

        let content = contentRaw;
        let items = [];
        if (contentRaw.includes('؛')) {
            items = contentRaw.split('؛').map(item => item.trim()).filter(item => item.length > 0);
            content = ''; 
        }
        
        offerData.sections.push({
            order: order,
            title: title,
            icon: icon,
            content: content,
            items: items
        });
    });

    // 2. تجميع الحجج الإقناعية النهائية (بناء اليقين)
    const argumentCards = closingArgumentsContainer.querySelectorAll('.dynamic-section-card');
    argumentCards.forEach(card => {
        const title = card.querySelector('input[name="title"]').value;
        const details = card.querySelector('textarea[name="details"]').value;
        const order = parseInt(card.querySelector('input[name="order"]').value);
        
        offerData.closingArguments.push({
            order: order,
            title: title,
            details: details
        });
    });

    return offerData;
}

// دالة إرسال العرض إلى Firebase
async function saveOffer(event) {
    event.preventDefault();

    if (!productIdSelect.value) {
        statusMessage.textContent = 'يجب اختيار المنتج المستهدف أولاً.';
        statusMessage.className = 'text-center mt-3 text-red-600';
        statusMessage.classList.remove('hidden');
        return;
    }
    
    if (!currentUserId) {
        statusMessage.textContent = 'يرجى تسجيل الدخول أولاً.';
        statusMessage.className = 'text-center mt-3 text-red-600';
        statusMessage.classList.remove('hidden');
        return;
    }

    saveOfferButton.disabled = true;
    statusMessage.textContent = 'جاري حفظ العرض... (إحساس بالترقب) ⏳';
    statusMessage.className = 'text-center mt-3 loading';
    statusMessage.classList.remove('hidden');
    offerLinkDisplay.classList.add('hidden');

    try {
        const offerData = collectOfferData();
        const offerId = uuidv4(); 
        offerData.offerId = offerId; 

        // المسار الفريد: artifacts/[appId]/users/[userId]/offers/[offerId]
        const offerDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/offers`, offerId);

        await setDoc(offerDocRef, offerData);

        const offerLink = `${window.location.origin}/Checkout.html?id=${offerId}`;
        
        generatedLink.href = offerLink;
        generatedLink.textContent = offerLink;
        offerLinkDisplay.classList.remove('hidden');

        statusMessage.textContent = 'تم حفظ العرض بنجاح! يمكنك الآن مشاركة الرابط. (إحساس بالانجاز) 🎉';
        statusMessage.className = 'text-center mt-3 success';
        
    } catch (error) {
        console.error("خطأ في حفظ العرض:", error);
        statusMessage.textContent = `فشل الحفظ: ${error.message}`;
        statusMessage.className = 'text-center mt-3 error';
    } finally {
        saveOfferButton.disabled = false;
    }
}


/* ========================================================= */
/* الأحداث والمصادقة (بما في ذلك ربط الزر الصحيح) */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. حساب السعر
    unitPriceInput.addEventListener('input', calculateFinalPrice);
    discountInput.addEventListener('input', calculateFinalPrice);
    calculateFinalPrice(); 

    // 2. إدارة الأقسام
    addSectionButton.addEventListener('click', addDynamicSection);
    
    // **ربط زر الحجج الإقناعية (الإصلاح السابق)**
    const addArgumentButton = document.getElementById('addClosingArgumentButton');
    if (addArgumentButton) {
        addArgumentButton.addEventListener('click', addClosingArgument);
    }

    // 3. حفظ النموذج
    offerForm.addEventListener('submit', saveOffer);
    
    // 4. نسخ الرابط
    copyLinkButton.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedLink.href).then(() => {
            const originalText = copyLinkButton.textContent;
            copyLinkButton.textContent = ' (تم النسخ!) ';
            copyLinkButton.style.color = 'var(--success-green)';
            setTimeout(() => {
                copyLinkButton.textContent = originalText;
                copyLinkButton.style.color = '#d90429';
            }, 1500);
        });
    });

    // 5. مصادقة Firebase وجلب المنتجات
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
        } else {
            try {
                const credential = await signInAnonymously(auth);
                currentUserId = credential.user.uid;
            } catch (authError) {
                console.error("فشل المصادقة المجهولة:", authError);
                statusMessage.textContent = 'تعذر المصادقة. لن تتمكن من حفظ العرض.';
                statusMessage.className = 'text-center mt-3 error';
                saveOfferButton.disabled = true;
            }
        }
        // بعد المصادقة، قم بتحميل قائمة المنتجات
        populateProductSelect();
    });
});
