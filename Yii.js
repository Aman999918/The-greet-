// استيراد مكتبات Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
// تم إضافة getDoc لجلب تفاصيل المنتج و doc لاستخدامه في setDoc و batch
import { getFirestore, doc, getDocs, getDoc, collection, query, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"; 
import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/esm-browser/v4.js';

// **الإصلاح الحاسم لمشكلة App ID**
const defaultAppId = '1:168805958858:web:bccc84abcf58a180132033'; // القيمة الافتراضية الثابتة
// استخدام __app_id الديناميكي إذا كان متوفراً (مسار التطبيق الصحيح)
const dynamicAppId = typeof __app_id !== 'undefined' ? __app_id : defaultAppId;


const firebaseConfig = {
  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",
  authDomain: "aman-safety.firebaseapp.com",
  projectId: "aman-safety",
  messagingSenderId: "16880858",
  appId: dynamicAppId, // <-- استخدام القيمة المصححة هنا
  measurementId: "G-N6DDZ6N7GW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null;
let isDarkMode = false;
let selectedProductId = null;
let currentProductsList = []; // لتخزين قائمة المنتجات لجلب اسم المنتج في الحفظ

// عناصر DOM الرئيسية (يجب التأكد من تعريفها في DOMContentLoaded)
let modeToggleButton;
let modeToggleIcon;
let userIdDisplay;
let universalModal;
let modalTitle;
let modalContent;
let modalActions;
let loadingIndicator;
let mainHeader;

// عناصر DOM لصفحة إنشاء العرض
let createPitchContent;
let loadingMessage;
let errorMessage;
let productSelector;
let step1Section;
let step2Section;
let createPitchForm;
let pitchTitleInput;
let pitchTaglineInput;
let callToActionTextInput;
let dynamicSectionsContainer;
let addDescriptionBtn;
let addImagesBtn;
let addInfoCardBtn;

// دوال النافذة المنبثقة العامة (Universal Modal) - لم يتم تعديلها
function openModal(title, message, buttons = [], is_loading = false) {
    if (!modalTitle || !modalContent || !modalActions || !loadingIndicator || !universalModal) {
        console.error("Modal elements not found. Cannot open modal.");
        return;
    }
    modalTitle.textContent = title;
    modalContent.innerHTML = message;
    modalActions.innerHTML = '';
    buttons.forEach(btn => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = btn.text;
        buttonElement.className = `py-2 px-4 rounded font-bold ${btn.className || 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`;
        buttonElement.onclick = () => { btn.onClick(); };
        modalActions.appendChild(buttonElement);
    });
    if (is_loading) {
        loadingIndicator.classList.remove('hidden');
        modalActions.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
        modalActions.classList.remove('hidden');
    }
    universalModal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeModal() {
    if (!universalModal || !modalTitle || !modalContent || !modalActions || !loadingIndicator) {
        console.error("Modal elements not found. Cannot close modal.");
        return;
    }
    universalModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
    modalTitle.textContent = '';
    modalContent.innerHTML = '';
    modalActions.innerHTML = '';
    loadingIndicator.classList.add('hidden');
}

// دوال الثيم (الوضع الليلي/النهاري) - لم يتم تعديلها
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
}

// دالة لجلب المنتجات من Firestore (مع المسار المصحح)
async function fetchProducts() {
    if (!currentUserId) {
        errorMessage.classList.remove('hidden');
        loadingMessage.classList.add('hidden');
        return;
    }
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    try {
        // المسار المصحح: artifacts/{appId}/users/{userId}/products
        const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);
        const productSnap = await getDocs(productsCollectionRef);

        if (productSnap.empty) {
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            errorMessage.querySelector('p').textContent = 'لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.';
            return;
        }

        currentProductsList = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        productSelector.innerHTML = '<option value="">-- اختر منتجًا --</option>';

        currentProductsList.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelector.appendChild(option);
        });

        loadingMessage.classList.add('hidden');
        createPitchContent.classList.remove('hidden');
        applyTheme();

    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
        loadingMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorMessage.querySelector('p').textContent = `حدث خطأ أثناء تحميل المنتجات. (راجع المسار: ${error.message})`;
    }
}

// دالة لإضافة قسم ديناميكي - تم التعديل على نوع البطاقة ليتطابق مع الحفظ
function addDynamicSection(type) {
    const sectionId = `section-${Date.now()}`;
    
    // إنشاء العنصر الرئيسي وربط حدث الحذف
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'dynamic-section-item';
    sectionDiv.dataset.sectionId = sectionId;
    sectionDiv.dataset.sectionType = type;

    let title = '';
    let contentHtml = '';

    // بناء المحتوى حسب النوع
    switch (type) {
        case 'description':
            title = 'الوصف';
            contentHtml = `
                <p class="text-sm text-gray-500 mb-2">اكتب الأسطر، واستخدم سطر فارغ للفصل.</p>
                <textarea class="w-full h-24 p-2 border rounded-md" data-type="content" placeholder="أدخل محتوى الوصف هنا..."></textarea>
            `;
            break;
        case 'images':
            title = 'الصور';
            contentHtml = `
                <p class="text-sm text-gray-500 mb-2">أدخل روابط الصور، رابط في كل سطر.</p>
                <textarea class="w-full h-24 p-2 border rounded-md" data-type="content" placeholder="مثال: https://example.com/image1.jpg"></textarea>
            `;
            break;
        case 'info_card': // تم تغييرها لتطابق الحفظ
            title = 'المعلومات/المميزات (نقاط القوة)';
            contentHtml = `
                <p class="text-sm text-gray-500 mb-2">أدخل نقاط القوة (المفتاح والقيمة)، كل نقطة في سطر جديد (مثل: المفتاح: القيمة).</p>
                <textarea class="w-full h-24 p-2 border rounded-md" data-type="content" placeholder="مثال: الفعالية: 99.9% في..."></textarea>
            `;
            break;
        default:
            return;
    }
    
    sectionDiv.innerHTML = `
        <button type="button" class="remove-btn">
            <span class="material-symbols-outlined">close</span>
        </button>
        <h4 class="font-bold mb-2">قسم ${title}</h4>
        ${contentHtml}
    `;
    
    // ربط الحدث مباشرة بالعنصر (أكثر كفاءة)
    sectionDiv.querySelector('.remove-btn').addEventListener('click', () => {
        sectionDiv.remove();
    });

    dynamicSectionsContainer.appendChild(sectionDiv);
}

// دالة لمعالجة إرسال النموذج (تم مراجعتها وتأكيد آلية الحفظ المزدوجة)
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!selectedProductId) {
        openModal('خطأ', 'الرجاء اختيار منتج أولاً.', [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);
        return;
    }

    const currentProduct = currentProductsList.find(p => p.id === selectedProductId);

    if (!currentProduct) {
        openModal('خطأ', 'لم يتم العثور على بيانات المنتج.', [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);
        return;
    }

    const pitchData = {
        title: pitchTitleInput.value.trim(),
        tagline: pitchTaglineInput.value.trim(),
        callToActionText: callToActionTextInput.value.trim(),
        productId: selectedProductId,
        productName: currentProduct.name, // حفظ اسم المنتج لتسهيل العرض
        createdAt: new Date(),
        // لم تعد تحتاج sections هنا، لأنها في dynamicDetails
    };

    if (!pitchData.title || !pitchData.callToActionText) {
        openModal('خطأ', 'الرجاء ملء الحقول الإجبارية: العنوان ونص زر الإجراء.', [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);
        return;
    }

    const dynamicSections = dynamicSectionsContainer.querySelectorAll('.dynamic-section-item');
    let dynamicDetails = { sections: [] };

    dynamicSections.forEach((section, index) => {
        const type = section.dataset.sectionType;
        // نستخدم data-type="content" للعثور على حقل النص
        const content = section.querySelector('textarea[data-type="content"]').value.trim(); 
        
        let sectionData = {
            type: type,
            order: index
        };

        if (type === 'description') {
            sectionData.lines = content.split('\n').filter(line => line.trim() !== '').map(line => ({ type: 'paragraph', content: line.trim() }));
        } else if (type === 'images') {
            sectionData.images = content.split('\n').filter(line => line.trim() !== '');
        } else if (type === 'info_card') {
            sectionData.items = content.split('\n').filter(line => line.trim() !== '').map(line => {
                const parts = line.split(':');
                return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
            });
        }

        dynamicDetails.sections.push(sectionData);
    });

    openModal('جاري الحفظ', 'جاري إنشاء صفحة العرض، يرجى الانتظار...', [], true);

    try {
        const batch = writeBatch(db);

        // 1. إنشاء وثيقة جديدة في مجموعة pitches (لمعلومات العرض الأساسية)
        const pitchDocRef = doc(collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/pitches`));
        batch.set(pitchDocRef, pitchData);

        // 2. حفظ تفاصيل الأقسام الديناميكية في وثيقة productDetails الخاصة بالمنتج
        // (ملاحظة: هذا يمسح الأقسام القديمة لنفس المنتج عند الحفظ الجديد)
        const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, selectedProductId);
        
        // يجب أن نحفظ تفاصيل العرض الأساسية (title, tagline) في ProductDetails أيضاً
        // لكي يسهل على صفحة العرض قراءة كل شيء من مكان واحد
        batch.set(dynamicDetailsDocRef, {
            ...pitchData, // دمج البيانات الأساسية
            pitchId: pitchDocRef.id, // حفظ الـ pitchId في الـ productDetails
            dynamicSections: dynamicDetails.sections // حفظ الأقسام
        }, { merge: true }); 

        await batch.commit();

        closeModal();

        // رابط العرض يعتمد على pitchId
        const pitchUrl = `DealCloser.html?pitchId=${pitchDocRef.id}`;

        openModal('تم الحفظ بنجاح! 🎉', `تم إنشاء صفحة العرض بنجاح. <br><br> <strong>رابط الصفحة:</strong> <a href="${pitchUrl}" target="_blank" class="text-blue-500 hover:underline break-all">${pitchUrl}</a>`, [{ text: 'موافق', className: 'bg-green-600 text-white', onClick: closeModal }]);

    } catch (error) {
        console.error("خطأ في حفظ صفحة العرض:", error);
        closeModal();
        openModal('خطأ', `حدث خطأ أثناء حفظ صفحة العرض: ${error.message}`, [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);
    }
}

// DOMContentLoaded Listener (تهيئة العناصر وربط الأحداث)
document.addEventListener('DOMContentLoaded', () => {
    // تعيين عناصر DOM الرئيسية
    modeToggleButton = document.getElementById('modeToggleButton');
    modeToggleIcon = document.getElementById('modeToggleIcon');
    userIdDisplay = document.getElementById('userIdDisplay');
    universalModal = document.getElementById('universalModal');
    modalTitle = document.getElementById('modalTitle');
    modalContent = document.getElementById('modalContent');
    modalActions = document.getElementById('modalActions');
    loadingIndicator = document.getElementById('loadingIndicator');
    mainHeader = document.getElementById('mainHeader');

    // تعيين عناصر DOM لصفحة إنشاء العرض
    createPitchContent = document.getElementById('createPitchContent');
    loadingMessage = document.getElementById('loadingMessage');
    errorMessage = document.getElementById('errorMessage');
    productSelector = document.getElementById('productSelector');
    step1Section = document.getElementById('step1');
    step2Section = document.getElementById('step2');
    createPitchForm = document.getElementById('createPitchForm');
    pitchTitleInput = document.getElementById('pitchTitle');
    pitchTaglineInput = document.getElementById('pitchTagline');
    callToActionTextInput = document.getElementById('callToActionText');
    dynamicSectionsContainer = document.getElementById('dynamicSectionsContainer');
    addDescriptionBtn = document.getElementById('addDescriptionBtn');
    addImagesBtn = document.getElementById('addImagesBtn');
    addInfoCardBtn = document.getElementById('addInfoCardBtn');
    
    // ... (بقية تهيئة عناصر القائمة المنسدلة والثيم) ...
    // العناصر المتعلقة بالقائمة المنسدلة في الهيدر
    const menuDropdownButton = document.getElementById('menuDropdownButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuDropdownIcon = document.getElementById('menuDropdownIcon');

    // Initial theme application
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
        isDarkMode = true;
    }
    applyTheme();

    // Event Listeners for Modals
    if (universalModal) {
        universalModal.addEventListener('click', (e) => {
            if (e.target === universalModal) {
                closeModal();
            }
        });
    }

    // Event Listeners for Header Icons
    if (modeToggleButton) {
        modeToggleButton.addEventListener('click', toggleDarkMode);
    }
    
    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {
        menuDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menuDropdown.classList.toggle('show');
            menuDropdownIcon.textContent = isShowing ? 'arrow_drop_up' : 'arrow_drop_down';
        });
        document.addEventListener('click', (event) => {
            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {
                menuDropdown.classList.remove('show');
                menuDropdownIcon.textContent = 'arrow_drop_down';
            }
        });
    }

    const manageAccountLink = document.getElementById('manageAccountLink');
    if (manageAccountLink) {
        manageAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        });
    }

    // معالج تغيير المنتج (يظهر الخطوة الثانية)
    if (productSelector) {
        productSelector.addEventListener('change', (e) => {
            selectedProductId = e.target.value;
            if (selectedProductId) {
                step2Section.classList.remove('hidden');
                // ابحث عن المنتج المختار وعيّن عنوانه في حقل الـ pitchTitle
                const selectedProduct = currentProductsList.find(p => p.id === selectedProductId);
                if (selectedProduct) {
                    pitchTitleInput.value = selectedProduct.name || '';
                }
                
                // جلب بيانات العرض المحفوظة مسبقاً (مهمة إضافية لكنها ضرورية للتعديل)
                fetchExistingPitchData(selectedProductId);

                step1Section.scrollIntoView({ behavior: 'smooth' });
            } else {
                step2Section.classList.add('hidden');
            }
        });
    }

    // دوال جلب بيانات العرض السابق (لمسة احترافية)
    async function fetchExistingPitchData(productId) {
        try {
            const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);
            const docSnap = await getDoc(dynamicDetailsDocRef);

            dynamicSectionsContainer.innerHTML = ''; // تنظيف الأقسام الحالية
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // تعبئة الحقول الأساسية
                pitchTitleInput.value = data.title || '';
                pitchTaglineInput.value = data.tagline || '';
                callToActionTextInput.value = data.callToActionText || '';

                // تعبئة الأقسام الديناميكية
                if (data.dynamicSections && Array.isArray(data.dynamicSections)) {
                    data.dynamicSections.forEach(section => {
                        addDynamicSectionWithData(section);
                    });
                }
            }
        } catch (error) {
            console.error("خطأ في جلب بيانات العرض السابق:", error);
        }
    }
    
    // دالة مساعدة لإضافة القسم مع البيانات الموجودة (للتعديل)
    function addDynamicSectionWithData(sectionData) {
        const type = sectionData.type;
        const sectionId = `section-${Date.now()}-${sectionData.order}`; // توليد ID مؤقت
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'dynamic-section-item';
        sectionDiv.dataset.sectionId = sectionId;
        sectionDiv.dataset.sectionType = type;

        let title = '';
        let contentValue = '';
        
        switch (type) {
            case 'description':
                title = 'الوصف';
                contentValue = sectionData.lines ? sectionData.lines.map(line => line.content).join('\n') : '';
                break;
            case 'images':
                title = 'الصور';
                contentValue = sectionData.images ? sectionData.images.join('\n') : '';
                break;
            case 'info_card':
                title = 'المعلومات/المميزات';
                contentValue = sectionData.items ? sectionData.items.map(item => `${item.key}: ${item.value}`).join('\n') : '';
                break;
            default:
                return;
        }

        sectionDiv.innerHTML = `
            <button type="button" class="remove-btn">
                <span class="material-symbols-outlined">close</span>
            </button>
            <h4 class="font-bold mb-2">قسم ${title}</h4>
            <p class="text-sm text-gray-500 mb-2">${type === 'description' ? 'اكتب الأسطر، واستخدم سطر فارغ للفصل.' : type === 'images' ? 'أدخل روابط الصور، رابط في كل سطر.' : 'أدخل نقاط القوة (المفتاح والقيمة)، كل نقطة في سطر جديد (مثل: المفتاح: القيمة).'}</p>
            <textarea class="w-full h-24 p-2 border rounded-md" data-type="content" placeholder="أدخل المحتوى هنا...">${contentValue}</textarea>
        `;
        
        sectionDiv.querySelector('.remove-btn').addEventListener('click', () => {
            sectionDiv.remove();
        });

        dynamicSectionsContainer.appendChild(sectionDiv);
    }
    
    // معالجات أزرار إضافة الأقسام الديناميكية
    if (addDescriptionBtn) {
        addDescriptionBtn.addEventListener('click', () => addDynamicSection('description'));
    }
    if (addImagesBtn) {
        addImagesBtn.addEventListener('click', () => addDynamicSection('images'));
    }
    if (addInfoCardBtn) {
        addInfoCardBtn.addEventListener('click', () => addDynamicSection('info_card'));
    }

    // معالج إرسال النموذج
    if (createPitchForm) {
        createPitchForm.addEventListener('submit', handleFormSubmit);
    }

    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                currentUserId = user.uid;
                if (userIdDisplay) {
                    userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;
                }
                await fetchProducts();
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (authError) {
                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);
                    if (userIdDisplay) {
                        userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;
                    }
                   errorMessage.classList.remove('hidden');
                   loadingMessage.classList.add('hidden');
                   errorMessage.querySelector('p').textContent = `تعذر تسجيل الدخول للمتابعة: ${authError.message}`;
                }
            }
        } catch (initialError) {
            console.error("خطأ عام في تهيئة الصفحة:", initialError);
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            errorMessage.querySelector('p').textContent = `حدث خطأ غير متوقع: ${initialError.message}`;
        }
    });
});
