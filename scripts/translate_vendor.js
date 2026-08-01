const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/registratsiya-postavshchika/page.tsx');

let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
    ["toast.error('You must agree to the Vendor Terms & Conditions');", "toast.error('Вы должны согласиться с Условиями для поставщиков');"],
    ["toast.success('Thank you! Your vendor registration has been submitted. Our team will get in touch soon.');", "toast.success('Спасибо! Ваша заявка отправлена. Наша команда скоро свяжется с вами.');"],
    ["Partner with Vedashi", "Стать партнером Vedashi"],
    ["Take your products global. We handle export, compliance, and marketplace operations, you focus on growth.", "Выведите свои продукты на мировой рынок. Мы берем на себя экспорт, соблюдение требований и работу с маркетплейсами, а вы сосредотачиваетесь на росте."],
    ["Fields marked with", "Поля, отмеченные"],
    ["are mandatory.", "обязательны для заполнения."],
    [">Basic Information<", ">Основная информация<"],
    ["Full Name / Contact Person", "ФИО / Контактное лицо"],
    ["Enter Full Name", "Введите ФИО"],
    ["Company / Brand Name", "Название компании / бренда"],
    ["Enter Company / Brand Name", "Введите название компании / бренда"],
    ["Email Address", "Адрес электронной почты"],
    ["Enter Email Address", "Введите адрес электронной почты"],
    ["Phone Number", "Номер телефона"],
    ["Enter Phone Number", "Введите номер телефона"],
    ["City", "Город"],
    ["Enter City", "Введите город"],
    [">State", ">Штат / Регион"],
    ["Select State", "Выберите штат/регион"],
    [">Business Details<", ">Данные о бизнесе<"],
    ["Business Registration / GST No.", "Регистрационный номер бизнеса / GST"],
    ["Enter Registration or GST Number", "Введите регистрационный номер или GST"],
    ["Type of Business", "Тип бизнеса"],
    ["Select Business Type", "Выберите тип бизнеса"],
    ["Business Address", "Адрес компании"],
    ["Enter Full Business Address", "Введите полный адрес компании"],
    ["Years in Operation", "Лет в бизнесе"],
    ["E.g., 5", "Например, 5"],
    [">Product Information<", ">Информация о продукте<"],
    ["Product Category", "Категория продукта"],
    ["Select Category", "Выберите категорию"],
    ["Number of SKUs", "Количество SKU"],
    ["E.g., 20", "Например, 20"],
    ["Brief Product Description", "Краткое описание продукта"],
    ["Describe your products...", "Опишите ваши продукты..."],
    ["Product Catalog (PDF / ZIP)", "Каталог продуктов (PDF / ZIP)"],
    ["Upload a file", "Загрузить файл"],
    ["or drag and drop", "или перетащите"],
    ["PDF or ZIP up to 10MB", "PDF или ZIP до 10 МБ"],
    [">Certifications<", ">Сертификаты<"],
    ["Certifications Held", "Имеющиеся сертификаты"],
    ["Upload Certificates (PDF / ZIP)", "Загрузить сертификаты (PDF / ZIP)"],
    ["Upload file", "Загрузить файл"],
    ["Combine multiple into one file if necessary", "При необходимости объедините несколько в один файл"],
    [">Export Readiness<", ">Готовность к экспорту<"],
    ["Previous Export Experience", "Опыт экспорта"],
    [">Select<", ">Выберите<"],
    ["Minimum Order Quantity", "Минимальный объем заказа (MOQ)"],
    ["E.g., 100 units / $500", "Например, 100 шт. / $500"],
    ["Countries Previously Exported To", "Страны, в которые экспортировали ранее"],
    ["E.g., USA, UAE, UK", "Например, США, ОАЭ, Великобритания"],
    [">Additional Information<", ">Дополнительная информация<"],
    ["Website URL", "URL веб-сайта"],
    ["Instagram / LinkedIn Handle", "Никнейм в Instagram / LinkedIn"],
    ["How Did You Hear About Vedashi?", "Откуда вы узнали о Vedashi?"],
    ["E.g., Google, LinkedIn, Referral...", "Например, Google, LinkedIn, по рекомендации..."],
    ["Additional Comments", "Дополнительные комментарии"],
    ["Any other details you'd like to share...", "Любые другие детали, которыми вы хотели бы поделиться..."],
    ["I agree to the Vendor Terms & Conditions", "Я согласен с Условиями для поставщиков"],
    ["I consent to Vedashi contacting me regarding partnership opportunities", "Я согласен, чтобы Vedashi связывались со мной по вопросам партнерства"],
    ["Submitting...", "Отправка..."],
    ["Submit Registration", "Отправить заявку"],
    ["(Optional)", "(Необязательно)"]
];

for (const [oldStr, newStr] of replacements) {
    content = content.split(oldStr).join(newStr);
}

content = content.replace(
    "'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',\n  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',\n  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',\n  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',\n  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',\n  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',\n  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',\n  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',",
    "'Андхра-Прадеш', 'Аруначал-Прадеш', 'Ассам', 'Бихар', 'Чхаттисгарх',\n  'Гоа', 'Гуджарат', 'Харьяна', 'Химачал-Прадеш', 'Джаркханд',\n  'Карнатака', 'Керала', 'Мадхья-Прадеш', 'Махараштра', 'Манипур',\n  'Мегхалая', 'Мизорам', 'Нагаленд', 'Одиша', 'Пенджаб',\n  'Раджастхан', 'Сикким', 'Тамилнад', 'Телангана', 'Трипура',\n  'Уттар-Прадеш', 'Уттаракханд', 'Западная Бенгалия',\n  'Андаманские и Никобарские острова', 'Чандигарх', 'Дадра и Нагар-Хавели и Даман и Диу',\n  'Дели', 'Джамму и Кашмир', 'Ладакх', 'Лакшадвип', 'Пудучерри',"
);

content = content.replace(
    "['Manufacturer', 'Distributor', 'D2C Brand', 'Startup']",
    "['Производитель', 'Дистрибьютор', 'D2C Бренд', 'Стартап']"
);

content = content.replace(
    "['Herbal Wellness', 'Natural Beauty', 'Spices', 'Dry Fruits', 'Foods', 'Teas', 'Other']",
    "['Травяные средства', 'Натуральная косметика', 'Специи', 'Сухофрукты', 'Продукты питания', 'Чаи', 'Другое']"
);

content = content.replace(
    "['FSSAI', 'GMP', 'ISO', 'Organic', 'APEDA', 'Ayush', 'Other']",
    "['FSSAI', 'GMP', 'ISO', 'Органический', 'APEDA', 'Ayush', 'Другое']"
);

content = content.replace(
    "['Yes', 'No']",
    "['Да', 'Нет']"
);

content = content.replace(
    "form.exportExperience === 'Yes'",
    "form.exportExperience === 'Да'"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Replaced');
