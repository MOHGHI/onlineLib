/*
# Seed catalog: categories, authors, and books with multilingual content

1. Data inserted
- 6 categories (Fiction, Non-Fiction, Children, Science, History, Poetry) with en/uz/ru names.
- 8 authors with bios in en/uz/ru.
- 12 books spanning digital, physical, and both types, with translated titles/descriptions.
  Cover images use Pexels stock photo URLs.

2. Notes
- Uses ON CONFLICT DO NOTHING for idempotency.
- Prices in USD.
- Some books have sale_price for demo.
- Digital books have a digital_file_path placeholder.
*/

-- Categories
INSERT INTO categories (name, slug) VALUES
('{"en":"Fiction","uz":"Badiiy adabiyot","ru":"Художественная литература"}', 'fiction'),
('{"en":"Non-Fiction","uz":"Ilmiy adabiyot","ru":"Научная литература"}', 'non-fiction'),
('{"en":"Children","uz":"Bolalar adabiyoti","ru":"Детская литература"}', 'children'),
('{"en":"Science","uz":"Fan","ru":"Наука"}', 'science'),
('{"en":"History","uz":"Tarix","ru":"История"}', 'history'),
('{"en":"Poetry","uz":"She’riyat","ru":"Поэзия"}', 'poetry')
ON CONFLICT (slug) DO NOTHING;

-- Authors
INSERT INTO authors (name, bio, photo) VALUES
('Chingiz Aytmatov', '{"en":"Kyrgyz author whose novels depict life in Central Asia with mythic depth.","uz":"Qirg‘iziston yozuvchisi, asarlari Markaziy Osiyo hayotini mifik chuqurlik bilan tasvirlaydi.","ru":"Киргизский писатель, чьи романы изображают жизнь в Центральной Азии с мифической глубиной."}', 'https://images.pexels.com/photos/733856/pexels-photo-733856.jpeg?auto=compress&cs=tinysrgb&w=200'),
('O‘tkir Hoshimov', '{"en":"Uzbek novelist known for sharp social commentary and humor.","uz":"O‘zbek yozuvchisi, o‘tkir ijtimoiy qarama-qarshiliklari va hazil-mutoyibasi bilan tanilgan.","ru":"Узбекский писатель, известный острой социальной сатирой и юмором."}', 'https://images.pexels.com/photos, /1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Abdulla Qodiriy', '{"en":"Pioneer of the Uzbek novel, blending tradition with modern narrative.","uz":"O‘zbek romanchilik asoschisi, an’ana va zamonaviy hikoyani uyg‘unlashtirgan.","ru":"Основоположник узбекского романа, сочетавший традицию и современный нарратив."}', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'),
('George Orwell', '{"en":"English novelist and essayist, famous for his critiques of totalitarianism.","uz":"Ingliz yozuvchisi va esseuchi, totalitarizm tanqidi bilan mashhur.","ru":"Английский писатель и эссеист, известный критикой тоталитаризма."}', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Yuval Noah Harari', '{"en":"Israeli historian and author of bestselling works on human history.","uz":"Isroil tarixchisi va insoniyat tarixi bo‘yicha bestsellerlar muallifi.","ru":"Израильский историк, автор бестселлеров об истории человечества."}', 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Antoine de Saint-Exupéry', '{"en":"French writer and aviator, beloved for The Little Prince.","uz":"Fransuz yozuvchisi va uchuvchisi, „Kichik shahzoda“ bilan sevilgan.","ru":"Французский писатель и лётчик, любимый за „Маленького принца“."}', 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Rumi', '{"en":"13th-century Persian poet and Sufi mystic whose verses transcend borders.","uz":"XIII asr fors shoiri va so‘fiy mistigi, baytlari chegaralardan tashqariga o‘tadi.","ru":"Персидский поэт XIII века и суфийский мистик, чьи стихи выходят за границы."}', 'https://images.pexels.com/photos/1025470/pexels-photo-1025470.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Stephen Hawking', '{"en":"Theoretical physicist whose work on black holes reshaped cosmology.","uz":"Nazariyotchi fizik, qora tuynuklar bo‘yicha ishlari kosmologiyani o‘zgartirdi.","ru":"Физик-теоретик, чьи работы по чёрным дырам изменили космологию."}', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=200')
ON CONFLICT (id) DO NOTHING;

-- Books
INSERT INTO books (isbn, title, description, category_id, author_id, price, sale_price, stock_quantity, type, format, page_count, book_language, cover_image, digital_file_path, sample_file_path, is_active)
VALUES
(
  '978-0226816192',
  '{"en":"The Day Lasts More Than a Hundred Years","uz":"Kun o‘n ikki soatdan ortiq cho‘ziladi","ru":"И дольше века длится день"}',
  '{"en":"A monumental novel weaving Kyrgyz folklore with Soviet history, centered on the legend of the mankurt.","uz":"Qirg‘iz folklorini sovet tarixi bilan uyg‘unlashtirgan, manqurt afsonasi atrofida qurilgan ulkan roman.","ru":"Монументальный роман, сплетающий киргизский фольклор с советской историей вокруг легенды о манкурте."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='Chingiz Aytmatov'),
  18.99, 14.99, 50, 'both', 'paperback', 352, 'en',
  'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/aytmatov-day.pdf', 'samples/aytmatov-day-sample.pdf', true
),
(
  '978-9989-01-234-5',
  '{"en":"The Square","uz":"Maydon","ru":"Площадь"}',
  '{"en":"A satirical look at bureaucracy and daily life in Soviet Uzbekistan.","uz":"Sovet O‘zbekistonidagi byurokratiya va kundalik hayotga satirik nazar.","ru":"Сатирический взгляд на бюрократию и повседневную жизнь в советском Узбекистане."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='O‘tkir Hoshimov'),
  12.50, NULL, 35, 'physical', 'paperback', 280, 'uz',
  'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
  NULL, NULL, true
),
(
  '978-9989-01-345-2',
  '{"en":"Days Gone By","uz":"O‘tgan kunlar","ru":"Минувшие дни"}',
  '{"en":"The first Uzbek novel, a sweeping tale of love and change in early 20th-century Turkestan.","uz":"Birinchi o‘zbek romani, XX asr boshlaridagi Turon sevgi va o‘zgarishlar haqida.","ru":"Первый узбекский роман, масштабная повесть о любви и переменах в начале XX века в Туркестане."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='Abdulla Qodiriy'),
  15.00, 11.99, 40, 'both', 'hardcover', 410, 'uz',
  'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/qodiriy-days.pdf', 'samples/qodiriy-days-sample.pdf', true
),
(
  '978-0-452-28423-4',
  '{"en":"Animal Farm","uz":"Hayvonlar fermasi","ru":"Скотный двор"}',
  '{"en":"A biting allegory of totalitarianism through a farm animal rebellion.","uz":"Ferma hayvonlari isyoni orqali totalitarizmning o‘tkir majozi.","ru":"Острая аллегория тоталитаризма через восстание фермерских животных."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='George Orwell'),
  9.99, 7.99, 100, 'both', 'paperback', 152, 'en',
  'https://images.pexels.com/photos/260897/pexels-photo-260897.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/orwell-animal.pdf', 'samples/orwell-animal-sample.pdf', true
),
(
  '978-0-06-231607-4',
  '{"en":"Sapiens: A Brief History of Humankind","uz":"Sapiens: Insoniyatning qisqa tarixi","ru":"Sapiens: Краткая история человечества"}',
  '{"en":"A sweeping narrative of how Homo sapiens came to dominate the planet.","uz":"Homo sapiens sayyoramizga qanday hukmron bo‘lgani haqida keng qamrovli hikoya.","ru":"Масштабное повествование о том, как Homo sapiens стал хозяином планеты."}',
  (SELECT id FROM categories WHERE slug='history'),
  (SELECT id FROM authors WHERE name='Yuval Noah Harari'),
  22.00, NULL, 60, 'both', 'hardcover', 464, 'en',
  'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/harari-sapiens.pdf', 'samples/harari-sapiens-sample.pdf', true
),
(
  '978-0-15-601219-5',
  '{"en":"The Little Prince","uz":"Kichik shahzoda","ru":"Маленький принц"}',
  '{"en":"A poetic tale of a pilot who meets a young prince from a tiny asteroid.","uz":"Kichik asteroiddan kelgan yosh shahzoda bilan uchrashgan uchuvchining poetik hikoyasi.","ru":"Поэтичная сказка о лётчике, встретившем юного принца с крошечного астероида."}',
  (SELECT id FROM categories WHERE slug='children'),
  (SELECT id FROM authors WHERE name='Antoine de Saint-Exupéry'),
  8.99, 6.99, 80, 'both', 'paperback', 96, 'en',
  'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/saint-exupery-little-prince.pdf', 'samples/little-prince-sample.pdf', true
),
(
  '978-0-14-044434-9',
  '{"en":"The Essential Rumi","uz":"Rumiy: Tanlangan she’rlar","ru":"Руми: Избранные стихи"}',
  '{"en":"Soul-stirring translations of the 13th-century Sufi mystic’s poetry.","uz":"XIII asr so‘fiy mistigi she’rlarining ruhga ta’sir qiluvchi tarjimalari.","ru":"Душевные переводы поэзии суфийского мистика XIII века."}',
  (SELECT id FROM categories WHERE slug='poetry'),
  (SELECT id FROM authors WHERE name='Rumi'),
  16.00, NULL, 25, 'digital', 'pdf', 320, 'en',
  'https://images.pexels.com/photos/1025470/pexels-photo-1025470.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/rumi-essential.pdf', 'samples/rumi-sample.pdf', true
),
(
  '978-0-553-38016-3',
  '{"en":"A Brief History of Time","uz":"Vaqtning qisqa tarixi","ru":"Краткая история времени"}',
  '{"en":"A landmark exploration of cosmology, black holes, and the nature of time.","uz":"Kosmologiya, qora tuynuklar va vaqt tabiati haqida tarixiy tadqiqot.","ru":"Знаковое исследование космологии, чёрных дыр и природы времени."}',
  (SELECT id FROM categories WHERE slug='science'),
  (SELECT id FROM authors WHERE name='Stephen Hawking'),
  19.99, 15.99, 45, 'both', 'hardcover', 256, 'en',
  'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/hawking-brief-history.pdf', 'samples/hawking-sample.pdf', true
),
(
  '978-0-452-28424-1',
  '{"en":"1984","uz":"1984","ru":"1984"}',
  '{"en":"A dystopian masterpiece about surveillance, truth, and freedom.","uz":"Nazorat, haqiqat va erkinlik haqida distopik asar.","ru":"Антиутопический шедевр о слежке, правде и свободе."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='George Orwell'),
  10.99, NULL, 90, 'both', 'paperback', 328, 'en',
  'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/orwell-1984.pdf', 'samples/orwell-1984-sample.pdf', true
),
(
  '978-0-06-093010-8',
  '{"en":"Homo Deus: A Brief History of Tomorrow","uz":"Homo Deus: Ertangi kunning qisqa tarixi","ru":"Homo Deus: Краткая история завтра"}',
  '{"en":"A provocative look at humanity’s future through AI, biotech, and data.","uz":"Sun’iy intellekt, biotexnologiya va ma’lumotlar orqali insoniyat kelajagiga qarash.","ru":"Смелый взгляд на будущее человечества через ИИ, биотехнологии и данные."}',
  (SELECT id FROM categories WHERE slug='science'),
  (SELECT id FROM authors WHERE name='Yuval Noah Harari'),
  21.00, 16.99, 30, 'digital', 'pdf', 432, 'en',
  'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/harari-homo-deus.pdf', 'samples/homo-deus-sample.pdf', true
),
(
  '978-0-15-100217-7',
  '{"en":"The White Guard","uz":"Oq gvardiya","ru":"Белая гвардия"}',
  '{"en":"A novel of civil war, family, and loyalty in Kyiv during the turbulent 1918.","uz":"1918-yildagi notinch Kiyevda fuqarolar urushi, oila va sadoqat haqida roman.","ru":"Роман о гражданской войне, семье и верности в Киеве 1918 года."}',
  (SELECT id FROM categories WHERE slug='history'),
  (SELECT id FROM authors WHERE name='Chingiz Aytmatov'),
  14.50, NULL, 5, 'physical', 'hardcover', 240, 'en',
  'https://images.pexels.com/photos/260897/pexels-photo-260897.jpeg?auto=compress&cs=tinysrgb&w=400',
  NULL, NULL, true
),
(
  '978-0-14-310676-0',
  '{"en":"The Railway","uz":"Temir yo‘l","ru":"Железная дорога"}',
  '{"en":"A darkly comic novel set on a train journey through the Central Asian steppe.","uz":"Markaziy Osiyo dashti bo‘ylab poyezd sayohati haqidagi qora mazmunli komik roman.","ru":"Мрачный комический роман о путешествии поезда по степям Центральной Азии."}',
  (SELECT id FROM categories WHERE slug='fiction'),
  (SELECT id FROM authors WHERE name='O‘tkir Hoshimov'),
  13.00, 9.99, 0, 'digital', 'pdf', 200, 'uz',
  'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400',
  'ebooks/hashimov-railway.pdf', 'samples/railway-sample.pdf', true
)
ON CONFLICT (id) DO NOTHING;
