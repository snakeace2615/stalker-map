import fs from 'fs';
import path from 'path';

const dir = path.resolve('src/assets/i18n');

const translations = {
  en: {
    shocMapContentPageTitle: 'Shadow of Chernobyl stashes and loot',
    csMapContentPageTitle: 'Clear Sky stashes and loot',
    copMapContentPageTitle: 'Call of Pripyat stashes and loot',
    shocMapContentMetaDescription:
      'Browse Shadow of Chernobyl stashes, quest items and loot with direct links to markers on the interactive map.',
    csMapContentMetaDescription:
      'Browse Clear Sky stashes, quest items and loot with direct links to markers on the interactive map.',
    copMapContentMetaDescription:
      'Browse Call of Pripyat stashes, quest items and loot with direct links to markers on the interactive map.',
    mapContentIndex: 'Stashes and loot lists',
  },
  ua: {
    shocMapContentPageTitle: 'Схованки та лут Тіней Чорнобиля',
    csMapContentPageTitle: 'Схованки та лут Чистого неба',
    copMapContentPageTitle: 'Схованки та лут Поклику Припʼяті',
    shocMapContentMetaDescription:
      'Список схованок, квестових предметів і луту Тіней Чорнобиля з прямими посиланнями на мітки на інтерактивній карті.',
    csMapContentMetaDescription:
      'Список схованок, квестових предметів і луту Чистого неба з прямими посиланнями на мітки на інтерактивній карті.',
    copMapContentMetaDescription:
      'Список схованок, квестових предметів і луту Поклику Припʼяті з прямими посиланнями на мітки на інтерактивній карті.',
    mapContentIndex: 'Списки схованок і луту',
  },
  ru: {
    shocMapContentPageTitle: 'Тайники и лут Тени Чернобыля',
    csMapContentPageTitle: 'Тайники и лут Чистого Неба',
    copMapContentPageTitle: 'Тайники и лут Зова Припяти',
    shocMapContentMetaDescription:
      'Список тайников, квестовых предметов и лута «Тени Чернобыля» с прямыми ссылками на метки на интерактивной карте.',
    csMapContentMetaDescription:
      'Список тайников, квестовых предметов и лута «Чистого Неба» с прямыми ссылками на метки на интерактивной карте.',
    copMapContentMetaDescription:
      'Список тайников, квестовых предметов и лута «Зова Припяти» с прямыми ссылками на метки на интерактивной карте.',
    mapContentIndex: 'Списки тайников и лута',
  },
  pl: {
    shocMapContentPageTitle: 'Skrytki i łup Cienia Czarnobyla',
    csMapContentPageTitle: 'Skrytki i łup Czystego Nieba',
    copMapContentPageTitle: 'Skrytki i łup Zewu Prypeci',
    shocMapContentMetaDescription:
      'Lista skrytek, przedmiotów zadaniowych i łupu Cienia Czarnobyla z bezpośrednimi linkami do znaczników na interaktywnej mapie.',
    csMapContentMetaDescription:
      'Lista skrytek, przedmiotów zadaniowych i łupu Czystego Nieba z bezpośrednimi linkami do znaczników na interaktywnej mapie.',
    copMapContentMetaDescription:
      'Lista skrytek, przedmiotów zadaniowych i łupu Zewu Prypeci z bezpośrednimi linkami do znaczników na interaktywnej mapie.',
    mapContentIndex: 'Listy skrytek i łupu',
  },
  de: {
    shocMapContentPageTitle: 'Verstecke und Beute von Shadow of Chernobyl',
    csMapContentPageTitle: 'Verstecke und Beute von Clear Sky',
    copMapContentPageTitle: 'Verstecke und Beute von Call of Pripyat',
    shocMapContentMetaDescription:
      'Liste der Verstecke, Questgegenstände und Beute aus Shadow of Chernobyl mit direkten Links zu Markierungen auf der interaktiven Karte.',
    csMapContentMetaDescription:
      'Liste der Verstecke, Questgegenstände und Beute aus Clear Sky mit direkten Links zu Markierungen auf der interaktiven Karte.',
    copMapContentMetaDescription:
      'Liste der Verstecke, Questgegenstände und Beute aus Call of Pripyat mit direkten Links zu Markierungen auf der interaktiven Karte.',
    mapContentIndex: 'Listen mit Verstecken und Beute',
  },
  fr: {
    shocMapContentPageTitle: 'Caches et butin de Shadow of Chernobyl',
    csMapContentPageTitle: 'Caches et butin de Clear Sky',
    copMapContentPageTitle: 'Caches et butin de Call of Pripyat',
    shocMapContentMetaDescription:
      'Liste des caches, objets de quête et butin de Shadow of Chernobyl avec des liens directs vers les marqueurs sur la carte interactive.',
    csMapContentMetaDescription:
      'Liste des caches, objets de quête et butin de Clear Sky avec des liens directs vers les marqueurs sur la carte interactive.',
    copMapContentMetaDescription:
      'Liste des caches, objets de quête et butin de Call of Pripyat avec des liens directs vers les marqueurs sur la carte interactive.',
    mapContentIndex: 'Listes de caches et de butin',
  },
  esp: {
    shocMapContentPageTitle: 'Escondites y botín de Shadow of Chernobyl',
    csMapContentPageTitle: 'Escondites y botín de Clear Sky',
    copMapContentPageTitle: 'Escondites y botín de Call of Pripyat',
    shocMapContentMetaDescription:
      'Lista de escondites, objetos de misión y botín de Shadow of Chernobyl con enlaces directos a marcadores en el mapa interactivo.',
    csMapContentMetaDescription:
      'Lista de escondites, objetos de misión y botín de Clear Sky con enlaces directos a marcadores en el mapa interactivo.',
    copMapContentMetaDescription:
      'Lista de escondites, objetos de misión y botín de Call of Pripyat con enlaces directos a marcadores en el mapa interactivo.',
    mapContentIndex: 'Listas de escondites y botín',
  },
};

const en = translations.en;

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const lang = file.replace('.json', '');
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  Object.assign(data, translations[lang] || en);
  fs.writeFileSync(full, JSON.stringify(data, null, 4) + '\n');
  console.log('updated', file);
}
