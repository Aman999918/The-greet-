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
let pitchTitleElement;
let pitchTaglineElement;
let dynamicSectionsContainer;
let checkoutButton; 
let iconRocket; 
let iconArrow;  

// متغير لتخزين معرّف الدائرة الزمنية
let iconCycleIntervalId = null; 

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

// دالة لتحديث الرابط الديناميكي لزر الانتقال لصفحة العرض 
function updateCheckoutButton(productId) {
    if (!checkoutButton || !productId) {
        // إخفاء الزر إذا لم يتوفر معرف المنتج أو الزر نفسه
        if (checkoutButton) {
            checkoutButton.style.display = 'none'; 
        }
        return;
    }
    
    // بناء الرابط
    const checkoutUrl = `checkout.html?id=${productId}`;

    checkoutButton.href = checkoutUrl;
    // استخدام inline-flex ليتناسب مع التوسيط الدائري
    checkoutButton.style.display = 'inline-flex'; 
    console.log(`تم ربط زر العرض بنجاح: ${checkoutUrl}`);
}

// دالة تشغيل دائرة تبديل الأيقونات بشكل مستمر
function startIconCycle() {
    // 👈 جلب العناصر محلياً للتأكد من توافرها
    const rocket = document.getElementById('icon-rocket');
    const arrow = document.getElementById('icon-arrow');
    
    if (!rocket || !arrow) {
        console.error("فشل في العثور على أيقونات الحركة.");
        // إذا فشل، نوقف أي محاولة تشغيل لاحقة
        if (iconCycleIntervalId) {
            clearTimeout(iconCycleIntervalId);
            iconCycleIntervalId = null;
        }
        return;
    }
    
    // إيقاف أي دورة سابقة للتأكد من عدم التكرار المزدوج
    if (iconCycleIntervalId) {
        clearTimeout(iconCycleIntervalId);
    }

    let isRocketVisible = true; // الحالة الأولية: الصاروخ ظاهر (3 ثوانٍ)
    
    // دالة التبديل الفعلية
    const switchIcons = () => {
        if (isRocketVisible) {
            // الانتقال من الصاروخ إلى السهم
            
            // إخفاء الصاروخ
            rocket.classList.remove('icon-primary');
            rocket.classList.add('hidden-icon');

            // إظهار السهم
            arrow.classList.remove('hidden-icon');
            arrow.classList.add('icon-primary');

            isRocketVisible = false;
            // تعيين المهلة التالية (للسهم): 5 ثوانٍ
            iconCycleIntervalId = setTimeout(switchIcons, 5000); 
            console.log("التبديل: من الصاروخ (3s) إلى السهم. المهلة القادمة: 5 ثوانٍ.");

        } else {
            // الانتقال من السهم إلى الصاروخ
            
            // إخفاء السهم
            arrow.classList.remove('icon-primary');
            arrow.classList.add('hidden-icon');

            // إظهار الصاروخ
            rocket.classList.remove('hidden-icon');
            rocket.classList.add('icon-primary');

            isRocketVisible = true;
            // تعيين المهلة التالية (للصاروخ): 3 ثوانٍ
            iconCycleIntervalId = setTimeout(switchIcons, 3000); 
            console.log("التبديل: من السهم (5s) إلى الصاروخ. المهلة القادمة: 3 ثوانٍ.");
        }
    };
    
    // البدء بالدورة الأولى (ننتظر 3 ثوانٍ قبل التبديل الأول)
    iconCycleIntervalId = setTimeout(switchIcons, 3000); 
    console.log("بدء دورة الأيقونات. الصاروخ مرئي لمدة 3 ثوانٍ أولاً.");
}


// دالة لجلب وعرض خطاب المبيعات
async function fetchAndDisplaySalesPitch(productId) {
    if (!currentUserId || !productId) {
        updateCheckoutButton(null); 
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
            updateCheckoutButton(null); // إخفاء الزر
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            return;
        }
        const pitchData = productSnap.data();
        
        pitchTitleElement.textContent = pitchData.name || 'خطاب مبيعات غير معروف';
        pitchTaglineElement.textContent = pitchData.description || 'لا يوجد عبارة تسويقية.';

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
                            sectionContentHtml += `<div class="viewer-image-grid">`;
                            section.images.forEach(imgSrc => {
                                sectionContentHtml += `<img src="${imgSrc}" alt="صورة إضافية">`;
                            });
                            sectionContentHtml += `</div>`;
                        } else {
                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا توجد صور إضافية لهذا القسم.</p>`;
                        }
                        break;
                    case 'info_card':
                        sectionTitleText = 'نقاط القوة الرئيسية';
                        sectionIcon = 'info';
                        if (section.items && section.items.length > 0) {
                            sectionContentHtml += `<div class="viewer-info-grid">`;
                            section.items.forEach(item => {
                                if (item.key && item.value) {
                                    sectionContentHtml += `
                                        <div class="viewer-info-item">
                                            <span class="material-symbols-outlined">info</span>
                                            <div class="info-text">
                                                <div class="key">${item.key}</div>
                                                <div class="value">${item.value}</div>
                                            </div>
                                        </div>
                                    `;
                                }
                            });
                            sectionContentHtml += `</div>`;
                        } else {
                            sectionContentHtml += `<p class="text-gray-500 dark:text-gray-400">لا توجد معلومات إضافية لهذا القسم.</p>`;
                        }
                        break;
                    default:
                        break;
                }

                const sectionTitleHtml = `<h3 class="dynamic-section-title"><span class="material-symbols-outlined">${sectionIcon}</span> ${sectionTitleText}</h3>`;
                sectionDiv.innerHTML = sectionTitleHtml + `<div class="p-2">${sectionContentHtml}</div>`;
                dynamicSectionsContainer.appendChild(sectionDiv);
            });
        } else {
            const noDynamicSectionsMessage = document.createElement('div');
            noDynamicSectionsMessage.className = 'text-center text-gray-500 my-8';
            noDynamicSectionsMessage.innerHTML = `<p class="p-4">لا توجد تفاصيل ديناميكية إضافية لهذا الخطاب.</p>`;
            dynamicSectionsContainer.appendChild(noDynamicSectionsMessage);
        }
        
        updateCheckoutButton(productId); 
        startIconCycle(); // 👈 تشغيل الدائرة الجديدة
        
        loadingMessage.classList.add('hidden');
        productDetailsContent.classList.remove('hidden');
        applyTheme();
        
    } catch (error) {
        console.error("خطأ في جلب أو عرض خطاب المبيعات:", error);
        updateCheckoutButton(null); // إخفاء الزر في حالة الخطأ
        loadingMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        productDetailsContent.classList.add('hidden');
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

    // تعيين عناصر DOM لصفحة عرض خطاب المبيعات
    productDetailsContent = document.getElementById('productDetailsContent');
    if (productDetailsContent) {
        productDetailsContent.style.maxWidth = '100%';
        productDetailsContent.style.margin = '0 auto';
    }
    loadingMessage = document.getElementById('loadingMessage');
    errorMessage = document.getElementById('errorMessage');
    goToHomePageButton = document.getElementById('goToHomePage');
    pitchTitleElement = document.getElementById('pitchTitle');
    pitchTaglineElement = document.getElementById('pitchTagline');
    dynamicSectionsContainer = document.getElementById('dynamicSectionsContainer');
    checkoutButton = document.getElementById('checkout-button'); 
    
    iconRocket = document.getElementById('icon-rocket'); 
    iconArrow = document.getElementById('icon-arrow');   
    
    // عناصر DOM للقائمة المنسدلة (من Header)
    const menuDropdownButton = document.getElementById('menuDropdownButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuDropdownIcon = document.getElementById('menuDropdownIcon');
    
    // Initial theme application
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
        isDarkMode = true;
    }
    applyTheme();
    
    // Event Listeners for Modals (to close when clicking outside)
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
    // Toggle Dropdown Menu and change icon
    if (menuDropdownButton && menuDropdown && menuDropdownIcon) {
        menuDropdownButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menuDropdown.classList.toggle('show');
            menuDropdownIcon.textContent = isShowing ? 'arrow_drop_up' : 'arrow_drop_down';
        });
        // Close Dropdown Menu when clicking outside
        document.addEventListener('click', (event) => {
            if (menuDropdown && menuDropdownButton && !menuDropdown.contains(event.target) && !menuDropdownButton.contains(event.target)) {
                menuDropdown.classList.remove('show');
                menuDropdownIcon.textContent = 'arrow_drop_down';
            }
        });
    }
    // Handle the "Manage Account" link from header
    const manageAccountLink = document.getElementById('manageAccountLink');
    if (manageAccountLink) {
        manageAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            openModal('إدارة الحساب', 'هنا يمكنك إضافة منطق لتسجيل الدخول أو الخروج أو إدارة الملف الشخصي.', [{ text: 'موافق', className: 'bg-blue-500 text-white', onClick: closeModal }]);
        });
    }
    // Event Listener لزر "العودة إلى الرئيسية" في رسالة الخطأ
    if (goToHomePageButton) {
        goToHomePageButton.addEventListener('click', () => {
            window.location.href = 'Index.html';
        });
    }
    
    // Firebase Auth State Listener
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                currentUserId = user.uid;
                if (userIdDisplay) {
                    userIdDisplay.textContent = `هوية المستخدم: ${currentUserId}`;
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                productId = urlParams.get('id');
                if (productId) {
                    await fetchAndDisplaySalesPitch(productId);
                } else {
                    updateCheckoutButton(null); // إخفاء الزر
                    errorMessage.classList.remove('hidden');
                    loadingMessage.classList.add('hidden');
                    productDetailsContent.classList.add('hidden');
                    errorMessage.querySelector('p').textContent = 'لم يتم تحديد معرّف خطاب المبيعات في الرابط.';
                }
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (authError) {
                    console.error("خطأ في تسجيل الدخول (مجهول):", authError);
                    if (userIdDisplay) {
                        userIdDisplay.textContent = `فشل المصادقة: ${authError.message}`;
                    }
                   updateCheckoutButton(null); // إخفاء الزر
                   errorMessage.classList.remove('hidden');
                    loadingMessage.classList.add('hidden');
                    productDetailsContent.classList.add('hidden');
                    errorMessage.querySelector('p').textContent = `تعذر تسجيل الدخول للمتابعة: ${authError.message}`;
                }
            }
        } catch (initialError) {
            console.error("خطأ عام في تهيئة الصفحة:", initialError);
            updateCheckoutButton(null); // إخفاء الزر
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            productDetailsContent.classList.add('hidden');
            errorMessage.querySelector('p').textContent = `حدث خطأ غير متوقع: ${initialError.message}`;
        }
    });
});
