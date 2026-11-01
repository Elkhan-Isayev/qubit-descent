// Interface translations. Order of LANGS is the order of the switcher; the first is the default.

export const LANGS = [
  { code: 'en', label: 'EN', name: 'English', locale: 'en-US' },
  { code: 'az', label: 'AZ', name: 'Azərbaycanca', locale: 'az-Latn-AZ' },
  { code: 'de', label: 'DE', name: 'Deutsch', locale: 'de-DE' },
  { code: 'ru', label: 'RU', name: 'Русский', locale: 'ru-RU' },
];

const UI = {
  en: {
    pageTitle: 'Qubit Descent: a journey into a quantum computer',
    title: 'Qubit Descent',
    subtitle: 'from the cryostat to a single atom',
    loaderSub: 'Cooling down to 6 millikelvin…',
    webgl2: 'This browser does not support WebGL 2',
    error: 'Error',
    levelOf: (i, n) => `Level ${i} of ${n}`,
    howMade: 'How it is made',
    sources: 'Sources',
    fieldOfView: 'field of view',
    prev: 'Previous level (↑)',
    next: 'Next level (↓)',
    hint: 'Scroll to descend',
    credits: 'Data sources',
    close: 'Close',
    creditsIntro: 'Every number on screen comes from a peer-reviewed paper or an official specification. Chip and qubit geometry is generated with Qiskit Metal; no figures from papers are reproduced.',
    language: 'Language',
    fRoom: 'Room temperature',
    f50k: '50K plate',
    f4k: '4K plate',
    fStill: 'Still',
    fCp: 'Cold plate',
    fMxc: 'Mixing chamber',
    fQubitsWillow: 'Qubits on Google Willow',
    fD7Qubits: 'Qubits in a distance-7 surface code',
    fD7Error: 'Logical error per cycle',
    fT1Osman: 'Mean T1, Xmon qubits (Chalmers)',
    fT1Willow: 'Mean T1, Willow (QEC chip)',
    fJjArea: 'Junction area',
    fJjStack: 'Layer stack',
    fBarrierThick: 'Barrier thickness',
    fBarrierHot: 'Area carrying the tunnelling current',
    fPlacement: 'Placement accuracy, lattice sites',
    fSiLattice: 'Silicon lattice constant',
  },
  az: {
    pageTitle: 'Qubit Descent: kvant kompüterinin içinə səyahət',
    title: 'Qubit Descent',
    subtitle: 'kriostatdan tək bir atoma qədər',
    loaderSub: '6 millikelvinə qədər soyudulur…',
    webgl2: 'Bu brauzer WebGL 2-ni dəstəkləmir',
    error: 'Xəta',
    levelOf: (i, n) => `Səviyyə ${i} / ${n}`,
    howMade: 'Necə hazırlanır',
    sources: 'Mənbələr',
    fieldOfView: 'görüş sahəsi',
    prev: 'Əvvəlki səviyyə (↑)',
    next: 'Növbəti səviyyə (↓)',
    hint: 'Aşağı enmək üçün sürüşdürün',
    credits: 'Məlumat mənbələri',
    close: 'Bağla',
    creditsIntro: 'Ekrandakı hər rəqəm resenziyalı məqalədən və ya rəsmi spesifikasiyadan götürülüb. Çip və kubit həndəsəsi Qiskit Metal ilə yaradılıb; məqalələrdən heç bir şəkil köçürülməyib.',
    language: 'Dil',
    fRoom: 'Otaq temperaturu',
    f50k: '50K lövhəsi',
    f4k: '4K lövhəsi',
    fStill: 'Distillə kamerası (still)',
    fCp: 'Soyuq lövhə',
    fMxc: 'Qarışdırma kamerası',
    fQubitsWillow: 'Google Willow-da kubit sayı',
    fD7Qubits: 'Məsafə-7 səth kodunda kubitlər',
    fD7Error: 'Bir dövrdə məntiqi xəta',
    fT1Osman: 'Orta T1, Xmon kubitləri (Chalmers)',
    fT1Willow: 'Orta T1, Willow (QEC çipi)',
    fJjArea: 'Keçidin sahəsi',
    fJjStack: 'Təbəqələr',
    fBarrierThick: 'Baryerin qalınlığı',
    fBarrierHot: 'Tunel cərəyanını daşıyan sahə',
    fPlacement: 'Yerləşdirmə dəqiqliyi, qəfəs düyünü',
    fSiLattice: 'Silisiumun qəfəs sabiti',
  },
  de: {
    pageTitle: 'Qubit Descent: eine Reise in einen Quantencomputer',
    title: 'Qubit Descent',
    subtitle: 'vom Kryostaten bis zu einem einzelnen Atom',
    loaderSub: 'Abkühlen auf 6 Millikelvin…',
    webgl2: 'Dieser Browser unterstützt kein WebGL 2',
    error: 'Fehler',
    levelOf: (i, n) => `Ebene ${i} von ${n}`,
    howMade: 'So wird es hergestellt',
    sources: 'Quellen',
    fieldOfView: 'Bildausschnitt',
    prev: 'Vorherige Ebene (↑)',
    next: 'Nächste Ebene (↓)',
    hint: 'Scrollen, um abzutauchen',
    credits: 'Datenquellen',
    close: 'Schließen',
    creditsIntro: 'Jede Zahl auf dem Bildschirm stammt aus einer begutachteten Veröffentlichung oder einem offiziellen Datenblatt. Die Chip- und Qubit-Geometrie wird mit Qiskit Metal erzeugt; Abbildungen aus Veröffentlichungen werden nicht übernommen.',
    language: 'Sprache',
    fRoom: 'Raumtemperatur',
    f50k: '50K-Stufe',
    f4k: '4K-Stufe',
    fStill: 'Destille (Still)',
    fCp: 'Kalte Platte',
    fMxc: 'Mischkammer',
    fQubitsWillow: 'Qubits auf Google Willow',
    fD7Qubits: 'Qubits im Oberflächencode mit Distanz 7',
    fD7Error: 'Logischer Fehler pro Zyklus',
    fT1Osman: 'Mittleres T1, Xmon-Qubits (Chalmers)',
    fT1Willow: 'Mittleres T1, Willow (QEC-Chip)',
    fJjArea: 'Kontaktfläche',
    fJjStack: 'Schichtfolge',
    fBarrierThick: 'Barrierendicke',
    fBarrierHot: 'Fläche, die den Tunnelstrom trägt',
    fPlacement: 'Platzierungsgenauigkeit, Gitterplätze',
    fSiLattice: 'Gitterkonstante von Silizium',
  },
  ru: {
    pageTitle: 'Qubit Descent: путешествие внутрь квантового компьютера',
    title: 'Qubit Descent',
    subtitle: 'от криостата до одного атома',
    loaderSub: 'Охлаждаем до 6 милликельвинов…',
    webgl2: 'Этот браузер не поддерживает WebGL 2',
    error: 'Ошибка',
    levelOf: (i, n) => `Уровень ${i} из ${n}`,
    howMade: 'Как это делают',
    sources: 'Источники',
    fieldOfView: 'поле зрения',
    prev: 'Предыдущий уровень (↑)',
    next: 'Следующий уровень (↓)',
    hint: 'Прокрутите, чтобы спуститься',
    credits: 'Источники данных',
    close: 'Закрыть',
    creditsIntro: 'Каждая цифра на экране взята из рецензируемой статьи или официальной спецификации. Геометрия чипа и кубита построена в Qiskit Metal; иллюстрации из статей не копируются.',
    language: 'Язык',
    fRoom: 'Комнатная температура',
    f50k: 'Ступень 50K',
    f4k: 'Ступень 4K',
    fStill: 'Испарительная камера (still)',
    fCp: 'Холодная пластина',
    fMxc: 'Камера смешения',
    fQubitsWillow: 'Кубитов в Google Willow',
    fD7Qubits: 'Кубитов в поверхностном коде дистанции 7',
    fD7Error: 'Логическая ошибка за цикл',
    fT1Osman: 'Среднее T1, Xmon-кубиты (Chalmers)',
    fT1Willow: 'Среднее T1, Willow (чип для QEC)',
    fJjArea: 'Площадь перехода',
    fJjStack: 'Слои',
    fBarrierThick: 'Толщина барьера',
    fBarrierHot: 'Доля площади, по которой идёт туннельный ток',
    fPlacement: 'Точность размещения, узлов решётки',
    fSiLattice: 'Постоянная решётки кремния',
  },
};

// Per level: [name, description, how it is made (or null)].
const LEVEL_TEXT = {
  fridge: {
    en: ['Dilution refrigerator', 'Superconducting qubits only work a few thousandths of a degree above absolute zero. The cryostat cools in stages: every gold-plated plate is colder than the one above it, down to the mixing chamber at the bottom.', null],
    az: ['Həlletmə soyuducusu', 'Superkeçirici kubitlər yalnız mütləq sıfırdan bir neçə mində bir dərəcə yuxarıda işləyir. Kriostat pillə-pillə soyuyur: hər qızıl örtüklü lövhə yuxarıdakından soyuqdur, ən aşağıdakı qarışdırma kamerasına qədər.', null],
    de: ['Mischungskryostat', 'Supraleitende Qubits funktionieren nur wenige Tausendstel Grad über dem absoluten Nullpunkt. Der Kryostat kühlt in Stufen: Jede vergoldete Platte ist kälter als die darüber, bis hinunter zur Mischkammer.', null],
    ru: ['Криостат растворения', 'Сверхпроводящие кубиты работают лишь в тысячных долях градуса от абсолютного нуля. Криостат охлаждает ступенями: каждая позолоченная пластина холоднее предыдущей, вплоть до камеры смешения в самом низу.', null],
  },
  package: {
    en: ['Chip in its sample holder', 'At the bottom of the fridge the chip sits in a metal sample holder. Hair-thin wire bonds connect it to coaxial lines that carry microwave control pulses in and readout signals out.', 'Chips are made many at a time on a wafer, then diced apart and bonded into the holder.'],
    az: ['Nümunə tutucusunda çip', 'Soyuducunun dibində çip metal nümunə tutucusunda yerləşir. Saç kimi nazik naqillər onu koaksial xətlərə birləşdirir: bu xətlərlə mikrodalğa idarəetmə impulsları daxil olur, oxuma siqnalları isə çıxır.', 'Çiplər bir lövhədə (vafli) çoxlu sayda hazırlanır, sonra kəsilib tutucuya bərkidilir.'],
    de: ['Chip im Probenhalter', 'Ganz unten im Kryostaten sitzt der Chip in einem metallenen Probenhalter. Haarfeine Bonddrähte verbinden ihn mit Koaxialleitungen, die Mikrowellenpulse hinein- und Auslesesignale herausführen.', 'Chips entstehen zu vielen auf einem Wafer, werden dann vereinzelt und in den Halter gebondet.'],
    ru: ['Чип в держателе', 'На дне криостата чип сидит в металлическом держателе. Тонкие, как волос, проволочки соединяют его с коаксиальными линиями: по ним приходят СВЧ-импульсы управления и уходят сигналы считывания.', 'Чипы делают сразу много на одной пластине, затем разрезают и приваривают проволочками в держатель.'],
  },
  chip: {
    en: ['Chip layout', 'Qubits, readout resonators and control lines are drawn in a thin superconducting film. Each meandering line is a microwave resonator that listens to one qubit. This layout is a representative Qiskit Metal design, not a specific vendor chip.', 'Optical lithography transfers the pattern onto the film, and etching removes the metal between the lines.'],
    az: ['Çipin topologiyası', 'Kubitlər, oxuma rezonatorları və idarəetmə xətləri nazik superkeçirici təbəqədə çəkilir. Hər ilanvari xətt bir kubiti "dinləyən" mikrodalğa rezonatorudur. Bu topologiya konkret istehsalçının çipi deyil, Qiskit Metal-da hazırlanmış tipik dizayndır.', 'Optik litoqrafiya naxışı təbəqəyə köçürür, aşındırma isə xətlər arasındakı metalı təmizləyir.'],
    de: ['Chip-Layout', 'Qubits, Ausleseresonatoren und Steuerleitungen sind in einen dünnen supraleitenden Film geschrieben. Jede Mäanderleitung ist ein Mikrowellenresonator, der genau einem Qubit zuhört. Das Layout ist ein repräsentatives Qiskit-Metal-Design, kein bestimmter Herstellerchip.', 'Optische Lithografie überträgt das Muster auf den Film, Ätzen entfernt das Metall zwischen den Leitungen.'],
    ru: ['Топология чипа', 'Кубиты, резонаторы считывания и линии управления нарисованы в тонкой сверхпроводящей плёнке. Каждая извилистая линия — СВЧ-резонатор, который «слушает» один кубит. Эта топология — типовой дизайн из Qiskit Metal, а не чип конкретного производителя.', 'Оптическая литография переносит рисунок на плёнку, а травление убирает металл между линиями.'],
  },
  transmon: {
    en: ['Transmon qubit', 'A transmon is a cross-shaped capacitor (an "Xmon") shunted by a tiny Josephson junction. The junction makes the circuit anharmonic, so its two lowest energy levels can serve as 0 and 1.', 'The large pads are patterned with optical lithography; the junction itself is too small and needs electron-beam lithography.'],
    az: ['Transmon kubiti', 'Transmon kiçik Cozefson keçidi ilə şuntlanmış xaç formalı kondensatordur ("Xmon"). Keçid dövrəni qeyri-harmonik edir, buna görə onun ən aşağı iki enerji səviyyəsi 0 və 1 kimi istifadə oluna bilir.', 'Böyük lövhələr optik litoqrafiya ilə çəkilir; keçidin özü isə çox kiçikdir və elektron-şüa litoqrafiyası tələb edir.'],
    de: ['Transmon-Qubit', 'Ein Transmon ist ein kreuzförmiger Kondensator (ein „Xmon“), überbrückt von einem winzigen Josephson-Kontakt. Der Kontakt macht den Schaltkreis anharmonisch, sodass seine zwei niedrigsten Energieniveaus als 0 und 1 dienen können.', 'Die großen Flächen werden optisch belichtet; der Kontakt selbst ist dafür zu klein und braucht Elektronenstrahllithografie.'],
    ru: ['Трансмон', 'Трансмон — это крестообразный конденсатор («Xmon»), зашунтированный крошечным джозефсоновским переходом. Переход делает контур ангармоническим, поэтому два нижних уровня энергии можно использовать как 0 и 1.', 'Крупные площадки рисуют оптической литографией, а сам переход слишком мал: для него нужна электронно-лучевая литография.'],
  },
  junction: {
    en: ['Josephson junction', 'Two aluminium electrodes overlap with an oxide only a few atoms thick between them. Pairs of electrons tunnel through it without resistance: this is the one nonlinear element that turns a circuit into a qubit.', 'Shadow evaporation: aluminium is evaporated at two angles through a suspended resist bridge (Dolan, 1977), with a controlled oxidation in between. Lift-off then removes the resist.'],
    az: ['Cozefson keçidi', 'İki alüminium elektrod üst-üstə düşür, aralarında isə cəmi bir neçə atom qalınlığında oksid var. Elektron cütləri ondan müqavimətsiz tunel keçir: dövrəni kubitə çevirən yeganə qeyri-xətti element budur.', 'Kölgə tozlandırması: alüminium asma rezist körpüsündən iki fərqli bucaq altında tozlandırılır (Dolan, 1977), aralarında idarə olunan oksidləşmə aparılır. Sonra "lift-off" rezisti təmizləyir.'],
    de: ['Josephson-Kontakt', 'Zwei Aluminiumelektroden überlappen sich, dazwischen liegt ein nur wenige Atome dickes Oxid. Elektronenpaare tunneln widerstandslos hindurch: Das ist das einzige nichtlineare Element, das einen Schaltkreis zum Qubit macht.', 'Schattenbedampfung: Aluminium wird unter zwei Winkeln durch eine freitragende Lackbrücke aufgedampft (Dolan, 1977), dazwischen wird kontrolliert oxidiert. Beim Lift-off wird der Lack entfernt.'],
    ru: ['Джозефсоновский переход', 'Два алюминиевых электрода перекрываются, а между ними — оксид толщиной в несколько атомов. Куперовские пары туннелируют через него без сопротивления: это единственный нелинейный элемент, который превращает контур в кубит.', 'Теневое напыление: алюминий напыляют под двумя углами через подвесной мостик из резиста (Dolan, 1977), а между напылениями проводят контролируемое окисление. Затем lift-off удаляет резист.'],
  },
  barrier: {
    en: ['AlOx tunnel barrier', 'The barrier is amorphous aluminium oxide. Its thickness is not uniform, and most of the tunnelling current flows through a small fraction of thin spots, a likely source of noise in qubits.', 'Grown by exposing fresh aluminium to oxygen inside the vacuum chamber. Oxidation time affects the thickness more than oxygen pressure does.'],
    az: ['AlOx tunel baryeri', 'Baryer amorf alüminium oksididir. Onun qalınlığı bərabər deyil və tunel cərəyanının böyük hissəsi kiçik nazik sahələrdən keçir. Bu, kubitlərdə küyün ehtimal olunan mənbəyidir.', 'Vakuum kamerasında təzə alüminiumu oksigenə məruz qoymaqla yetişdirilir. Oksidləşmə müddəti qalınlığa oksigen təzyiqindən daha çox təsir edir.'],
    de: ['AlOx-Tunnelbarriere', 'Die Barriere besteht aus amorphem Aluminiumoxid. Ihre Dicke ist ungleichmäßig, und der größte Teil des Tunnelstroms fließt durch einen kleinen Anteil dünner Stellen, eine wahrscheinliche Rauschquelle in Qubits.', 'Sie entsteht, indem frisches Aluminium in der Vakuumkammer Sauerstoff ausgesetzt wird. Die Oxidationszeit beeinflusst die Dicke stärker als der Sauerstoffdruck.'],
    ru: ['Туннельный барьер AlOx', 'Барьер — аморфный оксид алюминия. Его толщина неоднородна, и большая часть туннельного тока идёт через малую долю тонких мест. Вероятно, это один из источников шума в кубитах.', 'Его выращивают, подавая кислород на свежий алюминий прямо в вакуумной камере. Время окисления влияет на толщину сильнее, чем давление кислорода.'],
  },
  atom: {
    en: ['A single phosphorus atom', 'A different kind of qubit: the spin of one phosphorus atom placed in silicon. In 2012 the Simmons group at UNSW Sydney built a working transistor from exactly one such atom.', 'Hydrogen lithography: an STM tip removes hydrogen atoms from a silicon surface one by one, phosphine binds only at the exposed sites, and silicon is grown over the top.'],
    az: ['Tək bir fosfor atomu', 'Başqa növ kubit: silisiuma yerləşdirilmiş bir fosfor atomunun spini. 2012-ci ildə UNSW Sydney-də Simmons qrupu məhz belə bir atomdan işləyən tranzistor qurdu.', 'Hidrogen litoqrafiyası: STM iynəsi silisium səthindən hidrogen atomlarını bir-bir götürür, fosfin yalnız açılmış yerlərə birləşir, sonra üstündən silisium böyüdülür.'],
    de: ['Ein einzelnes Phosphoratom', 'Eine andere Art von Qubit: der Spin eines einzelnen Phosphoratoms in Silizium. 2012 baute die Gruppe von Simmons an der UNSW Sydney einen funktionierenden Transistor aus genau einem solchen Atom.', 'Wasserstofflithografie: Eine STM-Spitze entfernt Wasserstoffatome einzeln von einer Siliziumoberfläche, Phosphin bindet nur an den freigelegten Stellen, darüber wird Silizium aufgewachsen.'],
    ru: ['Один атом фосфора', 'Другой тип кубита — спин одного атома фосфора в кремнии. В 2012 году группа Simmons в UNSW Sydney построила работающий транзистор ровно из одного такого атома.', 'Водородная литография: игла СТМ по одному снимает атомы водорода с поверхности кремния, фосфин садится только на открытые места, а сверху наращивают кремний.'],
  },
};

export const DICTIONARIES = { UI, LEVEL_TEXT };

const STORAGE_KEY = 'qubit-descent-lang';
const listeners = new Set();
let current;

function initialLang() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl && UI[fromUrl]) return fromUrl;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && UI[saved]) return saved;
  } catch {
    // storage unavailable (private mode etc.) — fall back to the default
  }
  return LANGS[0].code;
}

current = initialLang();

export const getLang = () => current;

export function setLang(code) {
  if (!UI[code] || code === current) return;
  current = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  url.searchParams.set('lang', code);
  window.history.replaceState(null, '', url);
  for (const fn of listeners) fn(code);
}

export const onLangChange = (fn) => listeners.add(fn);

export const t = (key) => UI[current][key] ?? UI.en[key] ?? key;

// { name, text, fab } for a level id in the active language.
export function levelText(id) {
  const [name, text, fab] = LEVEL_TEXT[id]?.[current] ?? LEVEL_TEXT[id]?.en ?? [id, '', null];
  return { name, text, fab };
}

// Decimal comma in az/de/ru. (Explicit separator: not every browser ships ICU data for az.)
export const fmtDecimal = (s) => (current === 'en' ? s : s.replace(/(\d)\.(\d)/g, '$1,$2'));

// Apply translations to static markup: data-i18n (text), data-i18n-html, data-i18n-title.
export function translateDom(root = document) {
  document.documentElement.lang = current;
  document.title = t('pageTitle');
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', t(el.dataset.i18nTitle));
  });
}
