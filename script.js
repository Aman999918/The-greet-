// استيراد Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// إعدادات Firebase

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

// متغيرات عامة

let currentUserId = null, isDarkMode = false;

let createdProductId = null, createdProductName = '', editingProductId = null;

let productDetailsSections = [];

let productsListData = [];

let productsWithDetails = {}; // لتخزين المنتجات التي لها تفاصيل

// DOM elements

let modeToggleButton, modeToggleIcon, userIdDisplay;

let universalModal, modalTitle, modalContent, modalActions, loadingIndicator;

let menuDropdownButton, menuDropdown, menuDropdownIcon, manageAccountLink;

let pageTitle, welcomeMessage, progressBar;

let productIdSelect, addNewProductBtn, deleteProductBtn;

let productForm, productNameInput, productDescriptionInput, productPriceInput, productDiscountInput, productCategoryInput, productImageInput, imagePreviewContainer, imagePreview, imageFileName, productRatingInput, submitButton;

let dynamicDetailsBuilderSection, selectedProductNameDisplay, sectionsContainer, addSectionButton, addSectionOptions, saveProductDetailsButton;

// نافذة منبثقة عامة

function openModal(title, message, buttons = [], is_loading = false) {

    if (!modalTitle || !modalContent || !modalActions || !loadingIndicator || !universalModal) return;

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

    if (!universalModal || !modalTitle || !modalContent || !modalActions || !loadingIndicator) return;

    universalModal.classList.remove('active');

    document.body.classList.remove('no-scroll');

    modalTitle.textContent = '';

    modalContent.innerHTML = '';

    modalActions.innerHTML = '';

    loadingIndicator.classList.add('hidden');

}

// شريط التقدم

function showProgress(percent = 60) {

    if (progressBar) {

        progressBar.style.width = percent + "%";

        progressBar.style.display = "block";

    }

}

function hideProgress() {

    if (progressBar) {

        progressBar.style.width = "0";

        setTimeout(() => { progressBar.style.display = "none"; }, 500);

    }

}

// الوضع الليلي

function toggleDarkMode() {

    isDarkMode = !isDarkMode;

    localStorage.setItem('darkMode', isDarkMode);

    applyTheme();

}

function applyTheme() {

    if (!document.body || !modeToggleIcon || !menuDropdownIcon) {

        setTimeout(applyTheme, 50);

        return;

    }

    document.body.classList.toggle('dark-mode', isDarkMode);

    modeToggleIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';

    const headerIcons = document.querySelectorAll('header .material-symbols-outlined');

    headerIcons.forEach(icon => {

        if (!icon) return;

        if (icon.id !== 'modeToggleIcon') {

            icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';

        }

    });

    const dropdownItems = document.querySelectorAll('#menuDropdown a .material-symbols-outlined');

    dropdownItems.forEach(icon => {

        if (!icon) return;

        icon.style.color = isDarkMode ? 'var(--light-red)' : 'var(--primary-red)';

    });

}

// القائمة المنسدلة في الهيدر

function setupMenuDropdown() {

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

    if (manageAccountLink) {

        manageAccountLink.addEventListener('click', (e) => {

            e.preventDefault();

            closeModal();

            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        });

    }

}

// معاينة الصورة

function resetImagePreview() {

    imagePreview.src = '#';

    imagePreview.alt = "معاينة الصورة";

    imageFileName.textContent = '';

    imagePreviewContainer.classList.add('hidden');

    productImageInput.value = '';

}

// تحديث رسالة الترحيب

function updateWelcomeMessage(state = "welcome") {

    if (!welcomeMessage) return;

    if (state === "new") welcomeMessage.textContent = "✨ أنت في وضع إضافة منتج جديد. أضف التفاصيل وابدأ البناء!";

    else if (state === "edit") welcomeMessage.textContent = "🛠️ يمكنك تعديل بيانات المنتج وبناء تفاصيله هنا.";

    else if (state === "delete") welcomeMessage.textContent = "⚠️ تم حذف المنتج بنجاح.";

    else if (state === "saved") welcomeMessage.textContent = "✅ تم حفظ المنتج بنجاح!";

    else welcomeMessage.textContent = "مرحبًا بك 👋، يمكنك إضافة أو تعديل المنتجات هنا!";

    welcomeMessage.classList.add("fade-in");

    setTimeout(() => { welcomeMessage.classList.remove("fade-in"); }, 700);

}

// رسم قائمة المنتجات المنسدلة مع Badge

function renderProductsSelect() {

    productIdSelect.innerHTML = '<option value="">-- اختر منتجًا للتعديل --</option>';

    productsListData.forEach(product => {

        const option = document.createElement('option');

        option.value = product.id;

        option.textContent = product.name || `منتج بدون اسم (${product.id.substring(0, 5)}...)`;

        // Badge: هل المنتج له تفاصيل ديناميكية؟

        let badgeClass = productsWithDetails[product.id] ? 'badge-green' : 'badge-yellow';

        let badgeTitle = productsWithDetails[product.id] ? 'يحتوي تفاصيل ديناميكية' : 'بدون تفاصيل ديناميكية';

        option.innerHTML = `<span>${option.textContent}</span> <span class="badge-detail ${badgeClass}" title="${badgeTitle}"></span>`;

        productIdSelect.appendChild(option);

    });

}

// ----------------- بناء تفاصيل المنتج الديناميكية ------------------

function createSectionElement(sectionData, index) {

    const sectionItem = document.createElement('div');

    sectionItem.className = 'section-item fade-in';

    sectionItem.dataset.index = index;

    let sectionContentHtml = '';

    let sectionTitle = '';

    let sectionIcon = '';

    switch (sectionData.type) {

        case 'description':

            sectionTitle = 'قسم الوصف';

            sectionIcon = 'description';

            sectionContentHtml = `

                <div class="description-lines-container" data-index="${index}">

                    ${(sectionData.lines || []).map((line, lineIdx) => `

                        <div class="description-line-item flex items-center gap-2 mb-2">

                            <select class="line-type-select border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-32">

                                <option value="paragraph" ${line.type === 'paragraph' ? 'selected' : ''}>فقرة عادية</option>

                                <option value="heading" ${line.type === 'heading' ? 'selected' : ''}>عنوان رئيسي</option>

                                <option value="highlight" ${line.type === 'highlight' ? 'selected' : ''}>نص مميز</option>

                            </select>

                            <textarea class="line-content-textarea flex-grow border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" rows="1" placeholder="النص">${line.content || ''}</textarea>

                            <button type="button" class="remove-line-btn text-red-500 hover:text-red-700" data-line-index="${lineIdx}">

                                <span class="material-symbols-outlined">delete</span>

                            </button>

                        </div>

                    `).join('')}

                </div>

                <button type="button" class="add-description-line-btn mt-2 bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">

                    <span class="material-symbols-outlined text-sm ml-1 align-middle">add</span> إضافة سطر جديد

                </button>

            `;

            break;

        case 'images':

            sectionTitle = 'معرض الصور';

            sectionIcon = 'image';

            sectionContentHtml = `

                <input type="file" multiple accept="image/*" class="mt-2 block w-full text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:file:bg-primary-red file:file:text-white">

                <div class="image-upload-preview" data-index="${index}">

                    ${(sectionData.images || []).map((img, imgIdx) => `

                        <div class="image-preview-item">

                            <img src="${img}" alt="صورة منتج">

                            <button type="button" class="remove-image-btn" data-image-index="${imgIdx}"><span class="material-symbols-outlined text-xs">close</span></button>

                        </div>

                    `).join('')}

                </div>

            `;

            break;

        case 'info_card':

            sectionTitle = 'بطاقة معلومات';

            sectionIcon = 'info';

            sectionContentHtml = `

                <div class="info-card-items-container" data-index="${index}">

                    ${(sectionData.items || []).map((item, itemIdx) => `

                        <div class="info-card-item">

                            <input type="text" placeholder="المفتاح (مثلاً: اللون)" value="${item.key || ''}" class="border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">

                            <input type="text" placeholder="القيمة (مثلاً: أحمر)" value="${item.value || ''}" class="border border-gray-300 rounded p-2 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">

                            <button type="button" class="remove-info-item-btn" data-item-index="${itemIdx}"><span class="material-symbols-outlined">delete</span></button>

                        </div>

                    `).join('')}

                </div>

                <button type="button" class="add-info-item-btn mt-2 bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">

                    <span class="material-symbols-outlined text-sm ml-1 align-middle">add</span> إضافة بند جديد

                </button>

            `;

            break;

    }

    sectionItem.innerHTML = `

        <div class="section-header">

            <h4><span class="material-symbols-outlined ml-2 align-middle">${sectionIcon}</span> ${sectionTitle}</h4>

            <div class="section-controls">

                <button type="button" class="delete-section-btn" title="حذف القسم"><span class="material-symbols-outlined">delete</span></button>

            </div>

        </div>

        <div class="section-body">

            ${sectionContentHtml}

        </div>

    `;

    sectionsContainer.appendChild(sectionItem);

    addSectionEventListeners(sectionItem, index);

    applyTheme();

}

function addSectionEventListeners(sectionElement, index) {

    sectionElement.querySelector('.delete-section-btn').addEventListener('click', () => {

        openModal('تأكيد الحذف', 'هل أنت متأكد أنك تريد حذف هذا القسم؟', [

            { text: 'إلغاء', className: 'bg-gray-300 text-gray-800', onClick: closeModal },

            { text: 'حذف', className: 'bg-red-500 text-white', onClick: () => {

                closeModal();

                deleteSection(index);

            }}

        ]);

    });

    const sectionData = productDetailsSections[index];

    switch (sectionData.type) {

        case 'description':

            if (!sectionData.lines || sectionData.lines.length === 0) {

                sectionData.lines = [{ type: 'paragraph', content: '' }];

            }

            sectionElement.querySelectorAll('.line-type-select, .line-content-textarea').forEach(input => {

                input.addEventListener('input', (e) => {

                    const lineItem = e.target.closest('.description-line-item');

                    const allLineItems = Array.from(sectionElement.querySelectorAll('.description-line-item'));

                    const lineIdx = allLineItems.indexOf(lineItem);

                    if (lineIdx === -1) return;

                    if (e.target.classList.contains('line-type-select')) {

                        productDetailsSections[index].lines[lineIdx].type = e.target.value;

                    } else {

                        productDetailsSections[index].lines[lineIdx].content = e.target.value;

                    }

                    updateSaveButtonState();

                });

            });

            sectionElement.querySelector('.add-description-line-btn').addEventListener('click', () => {

                if (!productDetailsSections[index].lines) productDetailsSections[index].lines = [];

                productDetailsSections[index].lines.push({ type: 'paragraph', content: '' });

                renderSections();

                updateSaveButtonState();

            });

            sectionElement.querySelectorAll('.remove-line-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const lineItem = e.target.closest('.description-line-item');

                    const allLineItems = Array.from(sectionElement.querySelectorAll('.description-line-item'));

                    const lineIdx = allLineItems.indexOf(lineItem);

                    if (lineIdx === -1) return;

                    if (productDetailsSections[index].lines && productDetailsSections[index].lines.length > lineIdx) {

                        productDetailsSections[index].lines.splice(lineIdx, 1);

                        renderSections();

                        updateSaveButtonState();

                    }

                });

            });

            break;

        case 'images':

            const imageInput = sectionElement.querySelector('input[type="file"]');

            imageInput.addEventListener('change', async (e) => {

                const files = Array.from(e.target.files);

                for (const file of files) {

                    if (file) {

                        const reader = new FileReader();

                        reader.onload = (event) => {

                            if (!productDetailsSections[index].images) productDetailsSections[index].images = [];

                            productDetailsSections[index].images.push(event.target.result);

                            renderSections();

                            updateSaveButtonState();

                        };

                        reader.readAsDataURL(file);

                    }

                }

            });

            sectionElement.querySelectorAll('.remove-image-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const imgIdx = parseInt(e.currentTarget.dataset.imageIndex);

                    if (productDetailsSections[index].images && productDetailsSections[index].images.length > imgIdx) {

                        productDetailsSections[index].images.splice(imgIdx, 1);

                        renderSections();

                        updateSaveButtonState();

                    }

                });

            });

            break;

        case 'info_card':

            sectionElement.querySelectorAll('.info-card-item input').forEach(input => {

                input.addEventListener('input', (e) => {

                    const infoItem = e.target.closest('.info-card-item');

                    const allInfoItems = Array.from(sectionElement.querySelectorAll('.info-card-item'));

                    const itemIdx = allInfoItems.indexOf(infoItem);

                    if (itemIdx === -1) return;

                    if (e.target.placeholder.includes('المفتاح')) {

                        productDetailsSections[index].items[itemIdx].key = e.target.value;

                    } else {

                        productDetailsSections[index].items[itemIdx].value = e.target.value;

                    }

                    updateSaveButtonState();

                });

            });

            sectionElement.querySelector('.add-info-item-btn').addEventListener('click', () => {

                if (!productDetailsSections[index].items) productDetailsSections[index].items = [];

                productDetailsSections[index].items.push({ key: '', value: '' });

                renderSections();

                updateSaveButtonState();

            });

            sectionElement.querySelectorAll('.remove-info-item-btn').forEach(btn => {

                btn.addEventListener('click', (e) => {

                    const infoItem = e.target.closest('.info-card-item');

                    const allInfoItems = Array.from(sectionElement.querySelectorAll('.info-card-item'));

                    const itemIdx = allInfoItems.indexOf(infoItem);

                    if (itemIdx === -1) return;

                    if (productDetailsSections[index].items && productDetailsSections[index].items.length > itemIdx) {

                        productDetailsSections[index].items.splice(itemIdx, 1);

                        renderSections();

                        updateSaveButtonState();

                    }

                });

            });

            break;

    }

}

function renderSections() {

    sectionsContainer.innerHTML = '';

    productDetailsSections.forEach((section, index) => {

        createSectionElement(section, index);

    });

    updateSaveButtonState();

}

function addSection(type) {

    let newSection = { type: type, order: productDetailsSections.length };

    if (type === 'description') {

        newSection.lines = [{ type: 'paragraph', content: '' }];

    } else if (type === 'images') {

        newSection.images = [];

    } else if (type === 'info_card') {

        newSection.items = [{ key: '', value: '' }];

    }

    productDetailsSections.push(newSection);

    renderSections();

}

function deleteSection(index) {

    productDetailsSections.splice(index, 1);

    productDetailsSections.forEach((section, idx) => { section.order = idx; });

    renderSections();

}

function updateSaveButtonState() {

    if (createdProductId && productDetailsSections.length > 0) {

        const hasContent = productDetailsSections.some(section => {

            if (section.type === 'description' && section.lines) {

                return section.lines.some(line => line.content && line.content.trim() !== '');

            }

            if (section.type === 'images' && section.images) {

                return section.images.length > 0;

            }

            if (section.type === 'info_card' && section.items) {

                return section.items.some(item => item.key && item.value);

            }

            return false;

        });

        saveProductDetailsButton.disabled = !hasContent;

    } else {

        saveProductDetailsButton.disabled = true;

    }

}

async function saveDynamicProductDetails() {

    if (!createdProductId) {

        openModal('خطأ', 'يجب حفظ المنتج الأساسي أولاً.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

        return;

    }

    showProgress(80);

    openModal('جاري الحفظ', 'جاري حفظ تفاصيل المنتج...', [], true);

    try {

        const cleanedSections = productDetailsSections.map(section => {

            if (section.type === 'info_card' && section.items) {

                section.items = section.items.filter(item => item.key && item.value);

            }

            if (section.type === 'description' && section.lines) {

                section.lines = section.lines.filter(line => line.content && line.content.trim() !== '');

            }

            return section;

        }).filter(section => {

            if (section.type === 'description') return section.lines && section.lines.length > 0;

            if (section.type === 'images') return section.images && section.images.length > 0;

            if (section.type === 'info_card') return section.items && section.items.length > 0;

            return false;

        });

        const docRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, createdProductId);

        await setDoc(docRef, { sections: cleanedSections || [] });

        openModal('نجاح', `<span style="font-size:2em;" class="success-pop">🎉</span> تم حفظ تفاصيل المنتج بنجاح!`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

        updateWelcomeMessage("saved");

    } catch (error) {

        openModal('خطأ', `فشل حفظ التفاصيل: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    }

    hideProgress();

}

// جلب المنتجات وعرضها في القائمة المنسدلة مع Badge

function fetchProductsForSelection() {

    if (!currentUserId) return;

    const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

    onSnapshot(productsCollectionRef, (snapshot) => {

        productsListData = [];

        snapshot.forEach(doc => {

            productsListData.push({ id: doc.id, ...doc.data() });

        });

        // جلب تفاصيل المنتجات لمعرفة من لديه أقسام

        fetchProductsDetailsForBadges();

    });

}

// جلب تفاصيل المنتجات لمعرفة من لديه أقسام (للبادج)

function fetchProductsDetailsForBadges() {

    productsWithDetails = {};

    if (!currentUserId) return;

    const detailsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`);

    onSnapshot(detailsCollectionRef, (snapshot) => {

        snapshot.forEach(doc => {

            const data = doc.data();

            productsWithDetails[doc.id] = data.sections && data.sections.length > 0;

        });

        renderProductsSelect();

    });

}

// عند اختيار منتج من القائمة

async function onSelectProduct(selectedId) {

    if (!selectedId) {

        productForm.reset();

        resetImagePreview();

        dynamicDetailsBuilderSection.classList.remove('active');

        editingProductId = null;

        createdProductId = null;

        createdProductName = '';

        deleteProductBtn.classList.add('hidden');

        updateWelcomeMessage("new");

        return;

    }

    const product = productsListData.find(p => p.id === selectedId);

    if (product) {

        editingProductId = selectedId;

        createdProductId = selectedId;

        createdProductName = product.name || "";

        // ملء النموذج

        productNameInput.value = product.name || '';

        productDescriptionInput.value = product.description || '';

        productPriceInput.value = product.price || '';

        productDiscountInput.value = product.discountPercentage || '';

        productCategoryInput.value = product.category || '';

        productRatingInput.value = product.rating || '';

        if (product.image) {

            imagePreview.src = product.image;

            imagePreviewContainer.classList.remove('hidden');

        } else {

            resetImagePreview();

        }

        // جلب تفاصيل المنتج الديناميكية

        await fetchDynamicProductDetails(selectedId);

        dynamicDetailsBuilderSection.classList.add('active');

        selectedProductNameDisplay.textContent = `المنتج: ${createdProductName}`;

        deleteProductBtn.classList.remove('hidden');

        updateWelcomeMessage("edit");

    }

}

async function fetchDynamicProductDetails(productId) {

    productDetailsSections = [];

    sectionsContainer.innerHTML = '';

    if (!productId) {

        updateSaveButtonState();

        return;

    }

    showProgress(60);

    openModal('جاري التحميل', 'جاري جلب تفاصيل المنتج...', [], true);

    try {

        const docRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

            const data = docSnap.data();

            productDetailsSections = data.sections || [];

            productDetailsSections.sort((a, b) => (a.order || 0) - (b.order || 0));

        }

        renderSections();

    } catch (error) {

        openModal('خطأ', `فشل جلب التفاصيل: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    } finally {

        closeModal();

        updateSaveButtonState();

        hideProgress();

    }

}

// إضافة أو تعديل المنتج

async function saveOrUpdateProduct(imageToSave) {

    showProgress(60);

    try {

        const productData = {

            name: productNameInput.value.trim(),

            description: productDescriptionInput.value.trim() || null,

            price: parseFloat(productPriceInput.value) || null,

            discountPercentage: parseFloat(productDiscountInput.value) || null,

            category: productCategoryInput.value || null,

            image: imageToSave,

            rating: parseFloat(productRatingInput.value) || null

        };

        if (productData.discountPercentage === 0) delete productData.discountPercentage;

        if (productData.description === null) delete productData.description;

        if (productData.price === null) delete productData.price;

        if (productData.rating === null) delete productData.rating;

        if (productData.category === null) delete productData.category;

        if (editingProductId) {

            const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, editingProductId);

            await updateDoc(productDocRef, productData);

            createdProductId = editingProductId;

            createdProductName = productData.name;

            openModal('نجاح', `<span style="font-size:2em;" class="success-pop">🛠️</span> تم تحديث المنتج بنجاح! يمكنك تعديل تفاصيله.`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: () => { closeModal(); dynamicDetailsBuilderSection.classList.add('active'); selectedProductNameDisplay.textContent = `المنتج: ${createdProductName}`; }}]);

            updateWelcomeMessage("edit");

        } else {

            const productsCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`);

            const docRef = await addDoc(productsCollectionRef, productData);

            createdProductId = docRef.id;

            createdProductName = productData.name;

            openModal('نجاح', `<span style="font-size:2em;" class="success-pop">🎉</span> تم حفظ المنتج بنجاح! يمكنك الآن بناء تفاصيله.`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: () => { closeModal(); dynamicDetailsBuilderSection.classList.add('active'); selectedProductNameDisplay.textContent = `المنتج: ${createdProductName}`; productForm.reset(); resetImagePreview(); }}]);

            updateWelcomeMessage("saved");

        }

    } catch (e) {

        openModal('خطأ', `فشل حفظ المنتج: ${e.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

    }

    hideProgress();

}

// زر حذف المنتج

function confirmDeleteProduct(productId) {

    openModal(

        'تأكيد الحذف',

        'هل أنت متأكد أنك تريد حذف هذا المنتج وجميع تفاصيله؟',

        [

            { text: 'إلغاء', className: 'bg-gray-300 text-gray-800', onClick: closeModal },

            { text: 'حذف', className: 'bg-red-500 text-white', onClick: async () => {

                closeModal();

                showProgress(80);

                openModal('جاري الحذف', 'الرجاء الانتظار...', [], true);

                try {

                    const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);

                    await deleteDoc(productDocRef);

                    const detailDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);

                    await deleteDoc(detailDocRef);

                    openModal('تم الحذف', `<span style="font-size:2em;" class="success-pop">🗑️</span> تم حذف المنتج وكل تفاصيله بنجاح!`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

                    productForm.reset();

                    resetImagePreview();

                    dynamicDetailsBuilderSection.classList.remove('active');

                    editingProductId = null;

                    createdProductId = null;

                    createdProductName = '';

                    deleteProductBtn.classList.add('hidden');

                    productIdSelect.value = "";

                    updateWelcomeMessage("delete");

                } catch (error) {

                    openModal('خطأ', `فشل حذف المنتج: ${error.message}`, [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                }

                hideProgress();

            }}

        ]

    );

}

// مشاركة رابط المنتج

function shareProduct(productId) {

    const url = window.location.origin + window.location.pathname + `?product=${productId}`;

    navigator.clipboard.writeText(url);

    openModal('تم النسخ!', `<span style="font-size:2em;" class="success-pop">🔗</span> تم نسخ رابط المنتج إلى الحافظة!`, [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);

}

// ---------------------- DOMContentLoaded ------------------------

document.addEventListener('DOMContentLoaded', () => {

    // تعيين عناصر DOM

    modeToggleButton = document.getElementById('modeToggleButton');

    modeToggleIcon = document.getElementById('modeToggleIcon');

    userIdDisplay = document.getElementById('userIdDisplay');

    universalModal = document.getElementById('universalModal');

    modalTitle = document.getElementById('modalTitle');

    modalContent = document.getElementById('modalContent');

    modalActions = document.getElementById('modalActions');

    loadingIndicator = document.getElementById('loadingIndicator');

    menuDropdownButton = document.getElementById('menuDropdownButton');

    menuDropdown = document.getElementById('menuDropdown');

    menuDropdownIcon = document.getElementById('menuDropdownIcon');

    manageAccountLink = document.getElementById('manageAccountLink');

    pageTitle = document.getElementById('pageTitle');

    welcomeMessage = document.getElementById('welcomeMessage');

    progressBar = document.getElementById('progressBar');

    productIdSelect = document.getElementById('productIdSelect');

    addNewProductBtn = document.getElementById('addNewProductBtn');

    deleteProductBtn = document.getElementById('deleteProductBtn');

    productForm = document.getElementById('productForm');

    productNameInput = document.getElementById('productName');

    productDescriptionInput = document.getElementById('productDescription');

    productPriceInput = document.getElementById('productPrice');

    productDiscountInput = document.getElementById('productDiscount');

    productCategoryInput = document.getElementById('productCategory');

    productImageInput = document.getElementById('productImageInput');

    imagePreviewContainer = document.getElementById('imagePreviewContainer');

    imagePreview = document.getElementById('imagePreview');

    imageFileName = document.getElementById('imageFileName');

    productRatingInput = document.getElementById('productRating');

    submitButton = document.getElementById('submitButton');

    dynamicDetailsBuilderSection = document.getElementById('dynamicDetailsBuilderSection');

    selectedProductNameDisplay = document.getElementById('selectedProductName');

    sectionsContainer = document.getElementById('sectionsContainer');

    addSectionButton = document.getElementById('addSectionButton');

    addSectionOptions = document.getElementById('addSectionOptions');

    saveProductDetailsButton = document.getElementById('saveProductDetails');

    // الوضع الليلي

    const storedDarkMode = localStorage.getItem('darkMode');

    if (storedDarkMode === 'true') isDarkMode = true;

    applyTheme();

    // تفعيل القائمة المنسدلة

    setupMenuDropdown();

    // زر تغيير الوضع الليلي

    if (modeToggleButton) modeToggleButton.addEventListener('click', toggleDarkMode);

    // معاينة الصورة

    if (productImageInput) {

        productImageInput.addEventListener('change', (event) => {

            const file = event.target.files[0];

            if (file) {

                imageFileName.textContent = file.name;

                const reader = new FileReader();

                reader.onload = (e) => {

                    imagePreview.src = e.target.result;

                    imagePreviewContainer.classList.remove('hidden');

                };

                reader.readAsDataURL(file);

            } else {

                resetImagePreview();

            }

        });

    }

    // زر إضافة منتج جديد

    if (addNewProductBtn) {

        addNewProductBtn.addEventListener('click', () => {

            productIdSelect.value = "";

            editingProductId = null;

            createdProductId = null;

            createdProductName = '';

            productForm.reset();

            resetImagePreview();

            dynamicDetailsBuilderSection.classList.remove('active');

            deleteProductBtn.classList.add('hidden');

            updateWelcomeMessage("new");

        });

    }

    // زر حذف المنتج

    if (deleteProductBtn) {

        deleteProductBtn.addEventListener('click', () => {

            if (createdProductId) confirmDeleteProduct(createdProductId);

        });

    }

    // اختيار منتج من القائمة

    if (productIdSelect) {

        productIdSelect.addEventListener('change', (e) => {

            onSelectProduct(e.target.value);

        });

    }

    // جلب المنتجات مع التفاصيل

    onAuthStateChanged(auth, async (user) => {

        if (user) {

            currentUserId = user.uid;

            if (userIdDisplay) userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;

            fetchProductsForSelection();

        } else {

            try {

                await signInAnonymously(auth);

            } catch (authError) {

                if (userIdDisplay) userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;

            }

        }

    });

    // نموذج إدخال المنتج الأساسي وحفظه

    if (productForm) {

        productForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            if (!productNameInput.value.trim()) {

                openModal('خطأ', 'الرجاء إدخال اسم المنتج، فهو حقل إلزامي.', [{ text: 'حسناً', className: 'bg-red-500 text-white', onClick: closeModal }]);

                return;

            }

            showProgress(40);

            let imageToSave = null;

            if (productImageInput.files.length > 0) {

                const file = productImageInput.files[0];

                const reader = new FileReader();

                reader.onload = async (e) => {

                    imageToSave = e.target.result;

                    await saveOrUpdateProduct(imageToSave);

                };

                reader.readAsDataURL(file);

            } else {

                await saveOrUpdateProduct(imageToSave);

            }

        });

    }

    // أقسام التفاصيل الديناميكية

    if (addSectionButton) {

        addSectionButton.addEventListener('click', (event) => {

            event.stopPropagation();

            addSectionOptions.classList.toggle('show');

        });

        document.addEventListener('click', (event) => {

            if (addSectionOptions && addSectionButton && !addSectionOptions.contains(event.target) && !addSectionButton.contains(event.target)) {

                addSectionOptions.classList.remove('show');

            }

        });

    }

    if (addSectionOptions) {

        addSectionOptions.querySelectorAll('button').forEach(button => {

            button.addEventListener('click', (e) => {

                const type = e.currentTarget.dataset.type;

                addSection(type);

                addSectionOptions.classList.remove('show');

            });

        });

    }

    if (saveProductDetailsButton) {

        saveProductDetailsButton.addEventListener('click', saveDynamicProductDetails);

    }

    // نافذة منبثقة الإغلاق عند الضغط خارجها

    if (universalModal) {

        universalModal.addEventListener('click', (e) => {

            if (e.target === universalModal) closeModal();

        });

    }

    // زر نسخ رابط المنتج (ميزة عظيمة إضافية)

    selectedProductNameDisplay.addEventListener('click', () => {

        if (createdProductId) shareProduct(createdProductId);

    });

});