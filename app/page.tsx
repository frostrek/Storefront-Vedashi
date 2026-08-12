import { Metadata } from 'next';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';
import HomeClientPage from './HomeClient';
import { generateHomePageJsonLd, generateFAQPageJsonLd } from '@/lib/seo';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vedashiherbals.com';

const HOMEPAGE_FAQS = [
    {
        question: 'Что такое Vedashi Herbals?',
        answer: 'Vedashi Herbals — это официальный российский интернет-магазин премиальных аюрведических продуктов. Мы импортируем натуральную косметику, специи, добавки и товары для здоровья напрямую из Индии.'
    },
    {
        question: 'Какие товары можно купить в Vedashi Herbals?',
        answer: 'В нашем каталоге представлены натуральная косметика из Индии, аюрведические добавки (ашваганда, трифала, чаванпраш), индийские специи (куркума, кумин, кориандр), масала чай, топлёное масло гхи и суперпродукты для здоровья.'
    },
    {
        question: 'Безопасна ли аюрведическая косметика Vedashi Herbals?',
        answer: 'Да, все продукты Vedashi Herbals на 100% натуральны и не содержат парабенов, сульфатов и агрессивных химикатов. Мы работаем только с сертифицированными индийскими производителями.'
    },
    {
        question: 'Осуществляете ли вы доставку по всей России?',
        answer: 'Да, Vedashi Herbals осуществляет доставку по всей территории Российской Федерации. Заказы отправляются из Москвы. Мы принимаем оплату в рублях.'
    },
    {
        question: 'Чем аюрведическая косметика отличается от обычной?',
        answer: 'Аюрведическая косметика использует натуральные растительные ингредиенты (масло амлы, сандал, ним, куркума), которые не только улучшают внешний вид, но и оказывают терапевтическое воздействие на кожу и волосы.'
    },
];

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: { absolute: "ВЕДАШИ ХЕРБАЛС — Премиальный велнес и натуральные индийские продукты" },
        description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики, специй и травяных сборов из Индии для здоровья и красоты.",
        alternates: {
            canonical: SITE_URL,
            languages: {
                'ru-RU': SITE_URL,
            },
        },
        openGraph: {
            title: "ВЕДАШИ ХЕРБАЛС — Премиальный велнес и натуральные индийские продукты",
            description: "Откройте для себя коллекцию премиальных аюрведических продуктов, натуральной косметики, специй и травяных сборов из Индии для здоровья и красоты.",
            url: SITE_URL,
        }
    };
}

import { getBestSellers, getNewArrivals, getCategories, API_URL, getHeroSlides, getHeroSettings, getHomepageReels } from '@/lib/api';

export default async function HomePage() {
    let heroSlides = [];
    let heroSettings = null;

    try {
        const [bestRes, newRes, catRes, slidesRes, settingsRes, reelsRes] = await Promise.all([
            getBestSellers({ limit: 10 }),
            getNewArrivals({ limit: 10 }),
            getCategories(true),
            getHeroSlides(),
            getHeroSettings(),
            getHomepageReels()
        ]);

        if (slidesRes.success && slidesRes.data?.length > 0) {
            heroSlides = slidesRes.data;
        }
        // No hardcoded fallback — if API didn't return slides, heroSlides stays [].
        // HeroCarousel will show a loading skeleton and fetch real slides client-side.

        if (settingsRes.success && settingsRes.data) {
            heroSettings = settingsRes.data;
        }

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateHomePageJsonLd()) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQPageJsonLd(HOMEPAGE_FAQS)) }}
                />
                <HomeClientPage 
                initialBestSellers={bestRes.data || []}
                initialNewArrivals={newRes.data || []}
                initialCategories={catRes || []}
                initialHeroSlides={heroSlides}
                initialHeroSettings={heroSettings}
                initialReels={reelsRes || []}
            />
                {/* Server-rendered static content for AI crawlers & LLM readability */}
                <section className="sr-only" aria-label="О компании Ведаши Хербалс">
                    <h2>О компании Vedashi Herbals</h2>
                    <p>Vedashi Herbals (ООО «ВЕДАШИ ХЕРБАЛС», ИНН 9704166498) — это российский интернет-магазин аюрведических продуктов, специализирующийся на импорте натуральной косметики, специй и товаров для здоровья из Индии. Компания была основана в 2024 году и обслуживает клиентов по всей России с доставкой из Москвы.</p>
                    <p>Мы тщательно отбираем каждую баночку крема и каждую специю, чтобы привезти вам настоящую Индию. В нашем ассортименте вы найдете аутентичную натуральную косметику для ухода за кожей и волосами, чистые органические специи, насыщенный масала-чай, а также традиционные аюрведические средства — от ашваганды до настоящего масла гхи. Мы верим, что забота о себе должна быть естественной и безопасной.</p>
                    <p>Все продукты Vedashi Herbals сертифицированы, не содержат парабенов и агрессивных химикатов. Бренд использует только натуральные ингредиенты: масло амлы, сандал, куркуму, ним и другие традиционные аюрведические компоненты.</p>

                    <h2>Часто задаваемые вопросы</h2>

                    <h3>Что такое Vedashi Herbals?</h3>
                    <p>Vedashi Herbals — это официальный российский интернет-магазин премиальных аюрведических продуктов. Мы импортируем натуральную косметику, специи, добавки и товары для здоровья напрямую из Индии. Наша миссия — сделать подлинную аюрведу доступной для российских покупателей.</p>

                    <h3>Какие товары можно купить в Vedashi Herbals?</h3>
                    <p>В нашем каталоге представлены натуральная косметика из Индии (кремы, масла, шампуни без сульфатов), аюрведические добавки (ашваганда, трифала, чаванпраш), индийские специи (куркума, кумин, кориандр, имбирь), масала чай, топлёное масло гхи и суперпродукты для здоровья.</p>

                    <h3>Безопасна ли аюрведическая косметика Vedashi Herbals?</h3>
                    <p>Да, все продукты Vedashi Herbals на 100% натуральны и не содержат парабенов, сульфатов и агрессивных химикатов. Мы работаем только с сертифицированными индийскими производителями, которые следуют строгим стандартам качества.</p>

                    <h3>Осуществляете ли вы доставку по всей России?</h3>
                    <p>Да, Vedashi Herbals осуществляет доставку по всей территории Российской Федерации. Заказы отправляются из Москвы. Мы принимаем оплату в рублях и предлагаем несколько способов доставки.</p>

                    <h3>Чем аюрведическая косметика отличается от обычной?</h3>
                    <p>Аюрведическая косметика использует натуральные растительные ингредиенты (масло амлы, сандал, ним, куркума), которые не только улучшают внешний вид, но и оказывают терапевтическое воздействие на кожу и волосы. В отличие от обычной косметики, аюрведические средства работают комплексно — для здоровья и красоты одновременно.</p>
                </section>
            </>
        );
    } catch (e) {
        console.error("Failed to fetch initial SSR data for homepage", e);
        // If everything fails, render Client Component without initial data, so it fetches on mount
        return <HomeClientPage />;
    }
}
