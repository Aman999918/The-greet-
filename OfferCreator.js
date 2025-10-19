// استيراد مكتبات Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
// تم إضافة getDoc لجلب بيانات عرض واحد
import { getFirestore, doc, setDoc, collection, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"; 
import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/esm-browser/v4.js';

// **التعديل الحاسم لتطابق البيئة:** استخدام هوية التطبيق الديناميكية
const defaultAppId = '1:168805958858:web:bccc84abcf58aa180132033';
const appId = typeof __app_id !== 'undefined' ? __app_id : defaultAppId;

const firebaseConfig = {
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg", 
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  messagingSenderId: "16880858",
  appId: appId, // استخدام هوية التطبيق المصححة
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUserId = null; 

// عناصر الـ DOM الرئيسية (بناءً على HTML الجديد)
const productsContainer = document.getElementById('productsContainer');
const loadingMessage = document.getElementById('loadingMessage');
const offerModal = document.getElementById('offerModal');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.querySelector('.close-modal-btn');
const offerForm = document.getElementById('offer-form');

// عناصر نموذج العرض داخل الـ Modal
const offerTitleInput = document.getElementById('offerTitle');
const offerTaglineInput = document.getElementById('offerTagline');
const unitPriceInput = document.getElementById('unitPrice');
const discountInput = document.getElementById('discount');
const finalPriceDisplay = document.getElementById('finalPriceDisplay');
const finalPriceHiddenInput = document.getElementById('finalPrice');
const selectedProductIdInput = document.getElementById('selectedProductId');
const selectedProductNameDisplay = document.getElementById('selectedProductName');
const dynamicSectionsContainer = document.getElementById('dynamicSectionsContainer');
const addSectionButton = document.getElementById('addSectionButton');
const closingArgumentsContainer = document.getElementById('closingArgumentsContainer');
const addClosingArgumentButton = document.getElementById('addClosingArgumentButton');
const saveOfferButton = document.getElementById('saveOfferButton');
const statusMessage = document.getElementById('statusMessage');
const offerLinkDisplay = document.getElementById('offerLinkDisplay');
const generatedLink = document.getElementById('generatedLink');
const copyLinkButton = document.getElementById('copyLinkButton');


/* ========================================================= */
/* دالة جلب المنتجات ورسمها كبطاقات (باستخدام onSnapshot) */
/* ========================================================= */

function populateProductCards() {
    productsContainer.innerHTML = ''; 
    loadingMessage.classList.remove('hidden');

    if (!currentUserId) return; 

    try {
        // المسار الذي يعمل: artifacts/{appId}/users/{userId}/products
        const productsCol = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);
        const offersCol = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/offers`);

        // استخدام onSnapshot لجلب المنتجات ورسمها
        onSnapshot(productsCol, async (snapshot) => {
            productsContainer.innerHTML = ''; 
            loadingMessage.classList.add('hidden');
            
            if (snapshot.empty) {
                productsContainer.innerHTML = '<p class="col-span-full text-center text-red-500 text-lg mt-10">لا توجد منتجات لعرضها. (قم بإضافة منتج أولاً)</p>';
                return;
            }

            // جلب حالة العروض بشكل متزامن
            const promises = snapshot.docs.map(async (productDoc) => {
                const product = { id: productDoc.id, ...productDoc.data() };
                
                // البحث عن عرض بنفس ID المنتج (كما في الفكرة الجديدة)
                const offerRef = doc(offersCol, product.id);
                const offerSnap = await getDoc(offerRef);
                product.hasOffer = offerSnap.exists();
                
                // رسم البطاقة
                renderProductCard(product);
            });

            await Promise.all(promises);

            // ربط أحداث النقر بالبطاقات
            document.querySelectorAll('.edit-offer-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.currentTarget.dataset.productId;
                    const productName = e.currentTarget.dataset.productName;
                    const hasOffer = e.currentTarget.dataset.hasOffer === 'true'; // تمرير حالة العرض
                    
                    // فتح النافذة المنبثقة وتحميل بيانات العرض
                    openOfferModal(productId, productName, hasOffer);
                });
            });

        }, (error) => {
            console.error("خطأ حاسم في جلب المنتجات:", error);
            productsContainer.innerHTML = '<p class="col-span-full text-center text-red-600 text-lg mt-10">فشل تحميل المنتجات. تحقق من القواعد والاتصال.</p>';
        });

    } catch (error) {
        console.error("خطأ في إعداد مستمع onSnapshot:", error);
    }
}

/* ========================================================= */
/* دالة رسم بطاقة المنتج */
/* ========================================================= */

function renderProductCard(product) {
    const statusText = product.hasOffer ? 'يوجد عرض' : 'لا يوجد عرض';
    const statusClass = product.hasOffer ? 'bg-green-100 text-green-700 border-green-400' : 'bg-yellow-100 text-yellow-700 border-yellow-400';
    const actionText = product.hasOffer ? 'تعديل العرض' : 'إضافة عرض';

    const cardHtml = `
        <div class="product-card bg-white rounded-lg shadow-lg overflow-hidden border-2 ${product.hasOffer ? 'border-green-300' : 'border-gray-300'}">
            <div class="p-4">
                <h4 class="text-xl font-bold text-gray-800">${product.name || 'منتج غير مسمى'}</h4>
                <p class="text-sm text-gray-500 mt-1">${product.description ? product.description.substring(0, 50) + '...' : 'لا يوجد وصف.'}</p>
            </div>
            
            <div class="p-4 ${statusClass} border-t-2">
                <p class="font-semibold">${statusText}</p>
            </div>
            
            <div class="bg-gray-800 p-2 text-center">
                <button data-product-id="${product.id}" 
                        data-product-name="${product.name}" 
                        data-has-offer="${product.hasOffer}"
                        class="edit-offer-btn w-full flex items-center justify-center text-white hover:bg-gray-700 transition duration-150">
                    <span class="material-symbols-outlined align-middle mr-2">${product.hasOffer ? 'edit' : 'add_circle'}</span> 
                    <span class="font-semibold">${actionText}</span>
                </button>
            </div>
        </div>
    `;
    productsContainer.insertAdjacentHTML('beforeend', cardHtml);
}

/* ========================================================= */
/* دوال إدارة النافذة المنبثقة (Modal) */
/* ========================================================= */

async function openOfferModal(productId, productName, hasOffer) {
    // إعداد النموذج
    offerForm.reset(); 
    statusMessage.classList.add('hidden');
    offerLinkDisplay.classList.add('hidden');
    
    // إعادة تهيئة الأقسام والحجج إلى حالتها الأولية
    dynamicSectionsContainer.innerHTML = '<p class="text-gray-500 italic text-center">لا توجد أقسام إضافية حتى الآن.</p>';
    closingArgumentsContainer.innerHTML = '<p class="text-gray-500 italic text-center">أضف النقاط الإقناعية التي تسبق كشف السعر.</p>';

    // تعيين بيانات المنتج
    selectedProductIdInput.value = productId;
    selectedProductNameDisplay.textContent = productName;
    modalTitle.textContent = hasOffer ? `تعديل عرض: ${productName}` : `إنشاء عرض جديد: ${productName}`;

    // جلب بيانات العرض الحالي (إن وجدت)
    if (hasOffer) {
        const offerRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/offers`, productId);
        const offerSnap = await getDoc(offerRef);
        
        if (offerSnap.exists()) {
            const offerData = offerSnap.data();
            
            // تعبئة حقول النموذج
            offerTitleInput.value = offerData.title || '';
            offerTaglineInput.value = offerData.tagline || '';
            unitPriceInput.value = offerData.unitPrice || 0;
            discountInput.value = offerData.discount || 0;
            
            calculateFinalPrice(); // إعادة حساب السعر
            
            // **تعبئة الأقسام الإضافية**
            if (offerData.sections && offerData.sections.length > 0) {
                dynamicSectionsContainer.innerHTML = ''; // تفريغ الـ placeholder
                offerData.sections.sort((a, b) => a.order - b.order).forEach(section => {
                    addDynamicSection(section); // إعادة رسم القسم ببياناته
                });
            }
            
            // **تعبئة الحجج الإقناعية**
            if (offerData.closingArguments && offerData.closingArguments.length > 0) {
                closingArgumentsContainer.innerHTML = ''; // تفريغ الـ placeholder
                offerData.closingArguments.sort((a, b) => a.order - b.order).forEach(argument => {
                    addClosingArgument(argument); // إعادة رسم الحجة ببياناتها
                });
            }
        }
    } else {
        // إعداد نموذج جديد (تصفير الأسعار)
        unitPriceInput.value = 0;
        discountInput.value = 0;
        calculateFinalPrice();
    }

    offerModal.classList.remove('hidden'); // إظهار النافذة المنبثقة
}

function closeOfferModal() {
    offerModal.classList.add('hidden'); // إخفاء النافذة المنبثقة
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

let argumentCounter = 0; // يتم استخدام هذا لتوليد IDs مؤقتة عند الإضافة وليس لترتيب الحفظ

function addClosingArgument(initialData = {}) {
    argumentCounter++;
    const argumentId = `argument-${argumentCounter}`;

    const initialMessage = closingArgumentsContainer.querySelector('p.text-gray-500');
    if (initialMessage) {
        initialMessage.remove();
    }
    
    const titleValue = initialData.title || '';
    const detailsValue = initialData.details || '';
    const orderValue = initialData.order || argumentCounter;
    
    const argumentHtml = `
        <div id="${argumentId}" class="dynamic-section-card relative bg-white border-l-4 border-red-400 p-4 mb-4 rounded-lg shadow-sm">
            <h4 class="flex items-center gap-2 text-red-700 font-semibold">
                <span class="material-symbols-outlined">psychology_alt</span>
                حجة إقناعية
            </h4>
            
            <button type="button" data-argument-id="${argumentId}" 
                    class="delete-argument-btn absolute top-3 left-3 text-sm text-gray-500 hover:text-red-600">حذف</button>
            
            <div class="mt-3">
                <label for="arg-title-${argumentId}" class="input-label">العنوان (الخطاف)</label>
                <input type="text" id="arg-title-${argumentId}" name="title" required 
                       value="${titleValue}" placeholder="مثال: سوف تخترق السماء" class="input-field p-2 text-sm">
            </div>

            <div class="mt-3">
                 <label for="arg-details-${argumentId}" class="input-label">التفاصيل (بناء اليقين/القصة)</label>
                 <textarea id="arg-details-${argumentId}" name="details" rows="3" 
                           placeholder="هنا تسرد القصة أو التفاصيل التي تبني اليقين والدافع الوجداني." class="input-field p-2 text-sm">${detailsValue}</textarea>
            </div>
            
            <input type="hidden" name="order" value="${orderValue}">
        </div>
    `;

    closingArgumentsContainer.insertAdjacentHTML('beforeend', argumentHtml);

    document.querySelector(`#${argumentId} .delete-argument-btn`).addEventListener('click', deleteClosingArgument);
}

function deleteClosingArgument(event) {
    const argumentId = event.currentTarget.dataset.argumentId;
    const argumentElement = document.getElementById(argumentId);
    
    if (argumentElement) {
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

function addDynamicSection(initialData = {}) {
    sectionCounter++;
    const sectionId = `section-${sectionCounter}`;

    const initialMessage = dynamicSectionsContainer.querySelector('p.text-gray-500');
    if (initialMessage) {
        initialMessage.remove();
    }
    
    const titleValue = initialData.title || '';
    const iconValue = initialData.icon || 'info';
    const contentValue = initialData.content || (initialData.items ? initialData.items.join('؛ ') : '');
    const orderValue = initialData.order || sectionCounter;
    
    const sectionHtml = `
        <div id="${sectionId}" class="dynamic-section-card relative p-4 mb-4 border-l-4 border-blue-400 rounded-lg shadow-sm bg-white">
            <h4 class="flex items-center gap-2 font-semibold text-blue-700">
                <span class="material-symbols-outlined text-red-600">tune</span>
                قسم مخصص
            </h4>
            
            <button type="button" data-section-id="${sectionId}" class="delete-section-btn absolute top-3 left-3 text-sm text-gray-500 hover:text-red-600">حذف</button>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div class="col-span-2">
                    <label for="title-${sectionId}" class="input-label">عنوان القسم</label>
                    <input type="text" id="title-${sectionId}" name="title" required value="${titleValue}" 
                           placeholder="مثال: أهم شروط العرض" class="input-field p-2 text-sm">
                </div>
                <div>
                    <label for="icon-${sectionId}" class="input-label">أيقونة (مثل payment)</label>
                    <input type="text" id="icon-${sectionId}" name="icon" value="${iconValue}" 
                           placeholder="اسم الأيقونة" class="input-field p-2 text-sm">
                </div>
            </div>

            <div class="mt-3">
                 <label for="content-${sectionId}" class="input-label">المحتوى التفصيلي (نص أو قائمة مفصولة بـ '؛')</label>
                 <textarea id="content-${sectionId}" name="content" rows="3" 
                           placeholder="أدخل نصًا طويلاً، أو عدة نقاط مفصولة بعلامة (؛) لتصبح قائمة." class="input-field p-2 text-sm">${contentValue}</textarea>
            </div>
            
            <input type="hidden" name="order" value="${orderValue}">
        </div>
    `;

    dynamicSectionsContainer.insertAdjacentHTML('beforeend', sectionHtml);

    document.querySelector(`#${sectionId} .delete-section-btn`).addEventListener('click', deleteSection);
}

function deleteSection(event) {
    const sectionId = event.currentTarget.dataset.sectionId;
    const sectionElement = document.getElementById(sectionId);
    
    if (sectionElement) {
        // تأثير حسي: اختفاء ناعم
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
        // جلب ID المنتج من الحقل المخفي الخاص بالـ Modal
        productId: selectedProductIdInput.value, 
        title: offerTitleInput.value,
        tagline: offerTaglineInput.value,
        unitPrice: parseFloat(unitPriceInput.value) || 0,
        discount: parseFloat(discountInput.value) || 0,
        finalPrice: parseFloat(finalPriceHiddenInput.value) || 0,
        timestamp: new Date().toISOString(),
        status: 'Active',
        sections: [],
        closingArguments: [] 
    };

    // 1. تجميع الأقسام الإضافية
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

    // 2. تجميع الحجج الإقناعية النهائية
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

    const productId = selectedProductIdInput.value;
    
    if (!productId || !currentUserId) {
        statusMessage.textContent = 'خطأ: يجب اختيار المنتج والمصادقة أولاً.';
        statusMessage.className = 'text-center mt-3 error';
        statusMessage.classList.remove('hidden');
        return;
    }

    saveOfferButton.disabled = true;
    statusMessage.textContent = 'جاري حفظ العرض... ⏳';
    statusMessage.className = 'text-center mt-3 loading';
    statusMessage.classList.remove('hidden');
    offerLinkDisplay.classList.add('hidden');

    try {
        const offerData = collectOfferData();
        // **ملاحظة:** نستخدم productId كـ ID لوثيقة العرض لسهولة الربط بين المنتج وعرضه.
        const offerDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/offers`, productId);

        await setDoc(offerDocRef, offerData);

        const offerLink = `${window.location.origin}/Checkout.html?id=${productId}`;
        
        generatedLink.href = offerLink;
        generatedLink.textContent = offerLink;
        offerLinkDisplay.classList.remove('hidden');

        statusMessage.textContent = 'تم حفظ العرض بنجاح! 🎉';
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
/* الأحداث والمصادقة */
/* ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. حساب السعر
    unitPriceInput.addEventListener('input', calculateFinalPrice);
    discountInput.addEventListener('input', calculateFinalPrice);
    calculateFinalPrice(); 

    // 2. إدارة الأقسام والحجج
    addSectionButton.addEventListener('click', () => addDynamicSection());
    addClosingArgumentButton.addEventListener('click', () => addClosingArgument());

    // 3. إدارة الـ Modal
    closeModalBtn.addEventListener('click', closeOfferModal);
    offerModal.addEventListener('click', (e) => {
        if (e.target === offerModal) {
            closeOfferModal();
        }
    });

    // 4. حفظ النموذج
    offerForm.addEventListener('submit', saveOffer);
    
    // 5. نسخ الرابط
    copyLinkButton.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedLink.href).then(() => {
            const originalText = copyLinkButton.textContent;
            copyLinkButton.textContent = ' (تم النسخ!) ';
            setTimeout(() => {
                copyLinkButton.textContent = originalText;
            }, 1500);
        });
    });

    // 6. مصادقة Firebase وجلب المنتجات
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
        } else {
            try {
                // تسجيل الدخول المجهول لضمان وجود currentUserId
                const credential = await signInAnonymously(auth);
                currentUserId = credential.user.uid;
            } catch (authError) {
                console.error("فشل المصادقة المجهولة:", authError);
                statusMessage.textContent = 'تعذر المصادقة. لن تتمكن من حفظ العرض.';
                statusMessage.className = 'text-center mt-3 error';
                saveOfferButton.disabled = true;
                currentUserId = null;
                return;
            }
        }
        // إطلاق دالة الجلب فقط بعد التأكد من وجود currentUserId
        if (currentUserId) {
             populateProductCards();
        }
    });
});
