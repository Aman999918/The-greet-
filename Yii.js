import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, doc, getDocs, collection, addDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// **إعدادات Firebase الخاصة بمشروعك "aman-safety"**

const firebaseConfig = {

  apiKey: "AIzaSyBRMKKR7URejme05AJ9-ufnj9Ehcg67Pfg",

  authDomain: "aman-safety.firebaseapp.com",

  projectId: "aman-safety",

  messagingSenderId: "16880858",

  appId: "1:168805958858:web:bccc84abcf58a180132033",

  measurementId: "G-N6DDZ6N7GW"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

let currentUserId = null;

let isDarkMode = false;

let selectedProductId = null;

// عناصر DOM الرئيسية

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

// دوال النافذة المنبثقة العامة (Universal Modal)

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

// دوال الثيم (الوضع الليلي/النهاري)

function toggleDarkMode() {

    isDarkMode = !isDarkMode;

    localStorage.setItem('darkMode', isDarkMode);

    applyTheme();

}

function applyTheme() {

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

}

// دالة لجلب المنتجات من Firestore

async function fetchProducts() {

    if (!currentUserId) {

        errorMessage.classList.remove('hidden');

        loadingMessage.classList.add('hidden');

        return;

    }

    loadingMessage.classList.remove('hidden');

    errorMessage.classList.add('hidden');

    try {

        const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

        const productSnap = await getDocs(productsCollectionRef);

        if (productSnap.empty) {

            errorMessage.classList.remove('hidden');

            loadingMessage.classList.add('hidden');

            errorMessage.querySelector('p').textContent = 'لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.';

            return;

        }

        const products = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        productSelector.innerHTML = '<option value="">-- اختر منتجًا --</option>';

        products.forEach(product => {

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

        errorMessage.querySelector('p').textContent = `حدث خطأ أثناء تحميل المنتجات: ${error.message}`;

    }

}

// دالة لإضافة قسم ديناميكي

function addDynamicSection(type) {

    const sectionId = `section-${Date.now()}`;

    const sectionHtml = `

        <div class="dynamic-section-item" data-section-id="${sectionId}" data-section-type="${type}">

            <button type="button" class="remove-btn">

                <span class="material-symbols-outlined">close</span>

            </button>

            <h4 class="font-bold mb-2">قسم ${type === 'description' ? 'الوصف' : type === 'images' ? 'الصور' : 'المعلومات'}</h4>

            ${type === 'description' ? `

                <p class="text-sm text-gray-500 mb-2">اكتب الأسطر، واستخدم سطر فارغ للفصل.</p>

                <textarea class="w-full h-24 p-2 border rounded-md" placeholder="أدخل محتوى الوصف هنا..."></textarea>

            ` : type === 'images' ? `

                <p class="text-sm text-gray-500 mb-2">أدخل روابط الصور، رابط في كل سطر.</p>

                <textarea class="w-full h-24 p-2 border rounded-md" placeholder="مثال: https://example.com/image1.jpg"></textarea>

            ` : `

                <p class="text-sm text-gray-500 mb-2">أدخل نقاط القوة (المفتاح والقيمة)، كل نقطة في سطر جديد.</p>

                <textarea class="w-full h-24 p-2 border rounded-md" placeholder="مثال: الفعالية: 99.9% في..."></textarea>

            `}

        </div>

    `;

    dynamicSectionsContainer.insertAdjacentHTML('beforeend', sectionHtml);

}

// دالة لمعالجة إرسال النموذج

async function handleFormSubmit(event) {

    event.preventDefault();

    if (!selectedProductId) {

        openModal('خطأ', 'الرجاء اختيار منتج أولاً.', [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);

        return;

    }

    const pitchData = {

        title: pitchTitleInput.value.trim(),

        tagline: pitchTaglineInput.value.trim(),

        callToActionText: callToActionTextInput.value.trim(),

        productId: selectedProductId,

        createdAt: new Date(),

        sections: []

    };

    if (!pitchData.title || !pitchData.callToActionText) {

        openModal('خطأ', 'الرجاء ملء الحقول الإجبارية: العنوان ونص زر الإجراء.', [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);

        return;

    }

    const dynamicSections = dynamicSectionsContainer.querySelectorAll('.dynamic-section-item');

    let dynamicDetails = { sections: [] };

    dynamicSections.forEach((section, index) => {

        const type = section.dataset.sectionType;

        const content = section.querySelector('textarea').value.trim();

        let sectionData = {

            type: type,

            order: index

        };

        if (type === 'description') {

            sectionData.lines = content.split('\n').filter(line => line.trim() !== '').map(line => {

                const trimmedLine = line.trim();

                // يمكن إضافة منطق لتحديد نوع السطر هنا (عنوان، نص عادي، إلخ)

                return { type: 'paragraph', content: trimmedLine };

            });

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

        const pitchDocRef = doc(collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/pitches`));

        batch.set(pitchDocRef, pitchData);

        const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, selectedProductId);

        batch.set(dynamicDetailsDocRef, dynamicDetails, { merge: true });

        await batch.commit();

        closeModal();

        const pitchUrl = `DealCloser.html?pitchId=${pitchDocRef.id}`;

        openModal('تم الحفظ بنجاح!', `تم إنشاء صفحة العرض بنجاح. <br><br> <strong>رابط الصفحة:</strong> <a href="${pitchUrl}" target="_blank" class="text-blue-500 hover:underline break-all">${pitchUrl}</a>`, [{ text: 'موافق', className: 'bg-green-600 text-white', onClick: closeModal }]);

    } catch (error) {

        console.error("خطأ في حفظ صفحة العرض:", error);

        closeModal();

        openModal('خطأ', `حدث خطأ أثناء حفظ صفحة العرض: ${error.message}`, [{ text: 'موافق', className: 'bg-red-500 text-white', onClick: closeModal }]);

    }

}

// DOMContentLoaded Listener

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

    

    // عناصر DOM للقائمة المنسدلة

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

    // معالج تغيير المنتج

    if (productSelector) {

        productSelector.addEventListener('change', (e) => {

            selectedProductId = e.target.value;

            if (selectedProductId) {

                step2Section.classList.remove('hidden');

                step1Section.scrollIntoView({ behavior: 'smooth' }); // يمكن تعديلها

            } else {

                step2Section.classList.add('hidden');

            }

        });

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

    // معالج لإزالة الأقسام الديناميكية

    if (dynamicSectionsContainer) {

        dynamicSectionsContainer.addEventListener('click', (e) => {

            if (e.target.closest('.remove-btn')) {

                e.target.closest('.dynamic-section-item').remove();

            }

        });

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