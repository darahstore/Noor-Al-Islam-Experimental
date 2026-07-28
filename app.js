// ==========================================
// 1. نظام التنقل بين الأقسام (Tabs)
// ==========================================
function switchTab(tabId) {
    const tabs = ['quran', 'sebha', 'prayer'];
    tabs.forEach(t => {
        const section = document.getElementById(`tab-${t}`);
        const navBtn = document.getElementById(`nav-${t}`);
        if (t === tabId) {
            section.classList.remove('hidden');
            navBtn.className = "flex flex-col items-center gap-1 text-emerald-500 font-bold text-xs transition scale-105";
        } else {
            section.classList.add('hidden');
            navBtn.className = "flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-500 text-xs transition";
        }
    });
}

// ==========================================
// 2. تفعيل الوضع الليلي والنهاري (Dark/Light Mode)
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        themeToggleBtn.innerText = '☀️';
    } else {
        html.classList.add('dark');
        themeToggleBtn.innerText = '🌙';
    }
});

// ==========================================
// 3. جلب بيانات القراء والسور عبر API (MP3Quran)
// ==========================================
let recitersData = [];

async function fetchReciters() {
    try {
        const response = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
        const data = await response.json();
        recitersData = data.reciters;
        
        const reciterSelect = document.getElementById('reciter-select');
        reciterSelect.innerHTML = '<option value="">اختر القارئ المفضل</option>';
        
        recitersData.forEach(reciter => {
            const option = document.createElement('option');
            option.value = reciter.id;
            option.innerText = `${reciter.name} (${reciter.moshaf[0]?.name || 'حفص'})`;
            reciterSelect.appendChild(option);
        });
    } catch (error) {
        console.error("خطأ في جلب القراء:", error);
        document.getElementById('reciter-select').innerHTML = '<option value="">تعذر الاتصال بالسيرفر</option>';
    }
}

// عند اختيار القارئ، جلب السور المتاحة له
document.getElementById('reciter-select').addEventListener('change', (e) => {
    const reciterId = e.target.value;
    const surahSelect = document.getElementById('surah-select');
    surahSelect.innerHTML = '<option value="">جاري تحميل السور...</option>';
    
    if (!reciterId) {
        surahSelect.innerHTML = '<option value="">اختر القارئ أولاً...</option>';
        return;
    }

    const selectedReciter = recitersData.find(r => r.id == reciterId);
    const moshaf = selectedReciter.moshaf[0]; // السيرفر والرواية الأولى
    const surahList = moshaf.surah_list.split(','); // قائمة أرقام السور المتوفرة

    // أسماء السور الـ 114 الأساسية للترتيب
    const suwarNames = [
        "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
        "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
        "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
        "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
        "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
        "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
        "الصف", "الجُمُعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
        "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
        "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
        "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
        "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
        "المسد", "الإخلاص", "الفلق", "الناس"
    ];

    surahSelect.innerHTML = '<option value="">اختر السورة للاستماع</option>';
    surahList.forEach(surahNum => {
        const index = parseInt(surahNum) - 1;
        const option = document.createElement('option');
        // تكوين رابط التشغيل المباشر بناءً على قاعدة السيرفر ورقم السورة بثلاث خانات (مثل 001, 018)
        const formattedNum = String(surahNum).padStart(3, '0');
        option.value = `${moshaf.server}${formattedNum}.mp3`;
        option.innerText = `سورة ${suwarNames[index]}`;
        surahSelect.appendChild(option);
    });
});

// تشغيل الصوت عند اختيار السورة
document.getElementById('surah-select').addEventListener('change', (e) => {
    const audioUrl = e.target.value;
    const playerContainer = document.getElementById('audio-player-container');
    const audioEl = document.getElementById('quran-audio');
    const titleEl = document.getElementById('now-playing-title');
    
    if (!audioUrl) {
        playerContainer.classList.add('hidden');
        audioEl.pause();
        return;
    }

    const selectedSurahText = e.target.options[e.target.selectedIndex].text;
    titleEl.innerText = `يتم الآن تشغيل: ${selectedSurahText}`;
    audioEl.src = audioUrl;
    playerContainer.classList.remove('hidden');
    audioEl.play().catch(err => console.log("التشغيل يتطلب تفاعل المستخدم أولاً"));
});

// ==========================================
// 4. نظام المسبحة الرقمية
// ==========================================
let counter = 0;
const dhikrs = [
    "سُبْحَانَ اللَّهِ",
    "الْحَمْدُ لِلَّهِ",
    "لَا إِلَهَ إِلَّا اللَّهُ",
    "اللَّهُ أَكْبَرُ",
    "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    "صَلَّى اللَّهُ عَلَى مُحَمَّدٍ"
];
let currentDhikrIndex = 0;

const sebhaBtn = document.getElementById('sebha-btn');
const counterDisplay = document.getElementById('counter-display');
const currentDhikrText = document.getElementById('current-dhikr');

sebhaBtn.addEventListener('click', () => {
    counter++;
    counterDisplay.innerText = counter;
    // اهتزاز خفيف للهواتف إن توفرت الميزة
    if (navigator.vibrate) navigator.vibrate(40);
});

document.getElementById('reset-sebha').addEventListener('click', () => {
    counter = 0;
    counterDisplay.innerText = counter;
});

document.getElementById('change-dhikr').addEventListener('click', () => {
    currentDhikrIndex = (currentDhikrIndex + 1) % dhikrs.length;
    currentDhikrText.innerText = dhikrs[currentDhikrIndex];
    counter = 0;
    counterDisplay.innerText = counter;
});

// ==========================================
// 5. محاكي مواقيت الصلاة (بدون إنترنت عبر خوارزمية مبسطة)
// ==========================================
function loadPrayerTimes() {
    const locationEl = document.getElementById('location-name');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                locationEl.innerText = "📍 موقعك الحالي (محلي)";
                // يمكن ربطها لاحقاً بمكتبة Adhan الشهيرة للحساب الدقيق بالفلك
            },
            (error) => {
                locationEl.innerText = "🌐 التوقيت الافتراضي";
            }
        );
    }
}

// بدء التشغيل التلقائي عند فتح التطبيق
window.addEventListener('DOMContentLoaded', () => {
    fetchReciters();
    loadPrayerTimes();
});
