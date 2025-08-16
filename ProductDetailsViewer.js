// استيراد مكتبات Firebase (إصدار 10.12.5)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
let productId = null;

// عناصر DOM الرئيسية (للتيم والمودال)
let modeToggleButton;
let modeToggleIcon;
let userIdDisplay;
let universalModal;
let modalTitle;
let modalContent;
let modalActions;
let loadingIndicator;
let mainHeader;

// عناصر DOM لصفحة عرض خطاب المبيعات
let productDetailsContent;
let loadingMessage;
let errorMessage;
let goToHomePageButton;
let productNameElement;
let productPriceElement;
let productCategoryElement;
let productDescriptionShortElement;
let dynamicSectionsContainer;

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

// دالة لجلب وعرض خطاب المبيعات
async function fetchAndDisplaySalesPitch(productId) {
    if (!currentUserId || !productId) {
        errorMessage.classList.remove('hidden');
        loadingMessage.classList.add('hidden');
        productDetailsContent.classList.add('hidden');
        return;
    }
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    productDetailsContent.classList.add('hidden');
    try {
        const productDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/products`, productId);
        const productSnap = await getDoc(productDocRef);
        if (!productSnap.exists()) {
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            return;
        }
        const pitchData = productSnap.data();
        
        productNameElement.textContent = pitchData.name || 'خطاب مبيعات غير معروف';
        productDescriptionShortElement.textContent = pitchData.description || 'لا يوجد عبارة تسويقية.';
        productPriceElement.textContent = `السعر: ${pitchData.price || 'لا يوجد سعر'} $`;
        productCategoryElement.textContent = `الفئة: ${pitchData.category || 'لا يوجد'}`;

        const dynamicDetailsDocRef = doc(db, `artifacts/${firebaseConfig.appId}/users/${currentUserId}/productDetails`, productId);
        const dynamicDetailsSnap = await getDoc(dynamicDetailsDocRef);
        dynamicSectionsContainer.innerHTML = '';
        if (dynamicDetailsSnap.exists()) {
            const dynamicData = dynamicDetailsSnap.data();
            const sections = dynamicData.sections || [];
            sections.sort((a, b) => (a.order || 0) - (b.order || 0));
            sections.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'dynamic-section';
                let sectionTitleText = '';
                let sectionIcon = '';
                let sectionContentHtml = '';

                switch (section.type) {
                    case 'description':
                        sectionTitleText = 'وصف المبيعات التفصيلي';
                        sectionIcon = 'description';
                        if (section.lines && section.lines.length > 0) {
                            section.lines.forEach(line => {
                                if (line.content && line.content.trim() !== '') {
                                    if (line.type === 'heading') {
                                        sectionContentHtml += `<h4 class="description-line-heading">${line.content}</h4>`;
                                    } else if (line.type === 'highlight') {
                                        sectionContentHtml += `<p class="description-line-highlight">${line.content}</p>`;
                                    } else { // paragraph
                                        sectionContentHtml += `<p>${line.content}</p>`;
                                    }
                                }
                            });
                        } else {
                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا يوجد وصف تفصيلي إضافي.</p>`;
                        }
                        break;
                    case 'images':
                        sectionTitleText = 'معرض الصور الإضافي';
                        sectionIcon = 'image';
                        if (section.images && section.images.length > 0) {
                            sectionContentHtml += `
