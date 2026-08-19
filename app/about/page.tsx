import { Metadata } from 'next';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import AboutClientPage from './AboutClient';
import { RU_DICTIONARY } from '@/content/ru';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

export async function generateMetadata(): Promise<Metadata> {
    const canonicalUrl = `${SITE_URL}/o-nas`;

    return {
        title: RU_DICTIONARY.about.meta.title,
        description: RU_DICTIONARY.about.meta.description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'ru-RU': canonicalUrl,
                'x-default': canonicalUrl
            }
        },
        openGraph: {
            title: RU_DICTIONARY.about.meta.ogTitle,
            description: RU_DICTIONARY.about.meta.ogDescription,
            url: canonicalUrl,
            locale: 'ru_RU',
        }
    };
}

export default async function AboutPage() {
    const breadcrumbs = generateBreadcrumbJsonLd([
        { name: RU_DICTIONARY.about.breadcrumbs.home, url: SITE_URL },
        { name: RU_DICTIONARY.about.breadcrumbs.ourStory, url: `${SITE_URL}/o-nas` }
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <h1 className="sr-only">{RU_DICTIONARY.about.meta.title}</h1>
            <AboutClientPage />
            {/* Server-rendered content for AI crawlers & screen readers */}
            <section className="sr-only" aria-label="О компании Vedashi Herbals">
                <h2>О компании Vedashi Herbals (ООО ВЕДАШИ ХЕРБАЛС)</h2>
                <p>Vedashi Herbals (ООО ВЕДАШИ ХЕРБАЛС, ИНН: 9727117720) — российская компания, основанная в 2025 году в Москве. Мы специализируемся на поставке премиальных аюрведических продуктов и натуральных травяных средств из Индии.</p>
                <p>Vedashi Herbals — это полностью независимый российский бренд. Мы НЕ являемся и НЕ связаны с компанией «Vedi Herbals» (vediherbals.com) или любыми другими аюрведическими брендами с похожим названием.</p>
                <p>Наша миссия — привнести древнюю мудрость Аюрведы в современную жизнь, тщательно отбирая ингредиенты высочайшего качества. Каждый продукт проходит строгий контроль качества для обеспечения чистоты, эффективности и безопасности.</p>
                <p>Контакты: Телефон: +7-985-110-01-35 | Email: info@vedashiherbals.com | Адрес: 117292, г. Москва, ул. Шверника, д. 6, к. 1, помещ. 8П</p>
            </section>
        </>
    );
}

