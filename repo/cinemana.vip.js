// ==MiruExtension==
// @name         Cinemana
// @version      v1.2.0
// @author       YourName
// @lang         en
// @license      MIT
// @icon         https://cinemana.vip/wp-content/uploads/2024/01/favicon.png
// @package      cinemana.vip
// @type         video
// @webSite      https://cinemana.vip
// ==/MiruExtension==

const BASE_URL = "https://cinemana.vip";
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";

// وظيفة تنظيف الكوكيز
function cleanCookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim();
        // هنا يمكن تحديد الكوكيز التي يجب مسحها بناءً على الاسم أو شروط معينة
        if (cookieName.startsWith("undesired_cookie")) {
            document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        }
    });
    console.log("تم تنظيف الكوكيز غير الضرورية.");
}

async function fetchJson(url) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    return res.json();
}

async function fetchHtml(url) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    return res.text();
}

async function getCategories() {
    return [
        { id: 0, name: "أحدث المقالات" },
        { id: 42442, name: "مسلسلات" },
        { id: 74261, name: "أفلام" },
        { id: 74260, name: "أنمي" }
    ];
}

async function fetchPosts(categoryId = 0, page = 1, query = "") {
    let url = `${API_URL}/posts?per_page=20&page=${page}&orderby=date&order=desc&_embed`;
    if (categoryId !== 0) url += `&categories=${categoryId}`;
    if (query) url += `&search=${encodeURIComponent(query)}`;
    const posts = await fetchJson(url);
    return posts.map(post => ({
        title: decodeEntities(post.title.rendered),
        description: cleanText(post.excerpt.rendered),
        thumbnail: extractThumbnail(post),
        url: post.link,
        id: post.id
    }));
}

function decodeEntities(encodedString) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}

function cleanText(html) {
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function extractThumbnail(post) {
    return (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) || "https://via.placeholder.com/300x450?text=Cinemana";
}

function extractThumbnailFromHtml(html) {
    const match = /<meta property="og:image" content="(.*?)"/i.exec(html);
    return match ? match[1] : "https://via.placeholder.com/300x450?text=Cinemana";
}

async function loadPostDetail(url) {
    const html = await fetchHtml(url);

    const title = (/<title>(.*?)<\/title>/i.exec(html) || [])[1]?.trim() || "بدون عنوان";
    const description = (/<meta name="description" content="(.*?)"/i.exec(html) || [])[1]?.trim() || "";
    const thumbnail = extractThumbnailFromHtml(html);

    const videos = [];
    const iframeMatches = [...html.matchAll(/<iframe[^>]+src=["'](.*?)["']/g)];
    iframeMatches.forEach(match => {
        const src = match[1];
        if (src.includes("player") || src.includes("embed") || src.includes("video")) {
            videos.push({
                title: extractServerName(src),
                url: src,
                type: "embed"
            });
        }
    });

    return { title, description, thumbnail, videos };
}

function extractServerName(url) {
    try {
        const domain = (new URL(url)).hostname.replace("www.", "");
        return `مشاهدة عبر: ${domain}`;
    } catch (e) {
        return "مشاهدة";
    }
}

async function testServerSpeed(url) {
    const startTime = Date.now();
    try {
        await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
        const responseTime = Date.now() - startTime;
        return responseTime;
    } catch (error) {
        return Infinity; // Return a very high number if the server fails
    }
}

async function getFastestServer(servers) {
    const speedTests = await Promise.all(
        servers.map(async (server) => {
            const responseTime = await testServerSpeed(server);
            return { server, responseTime };
        })
    );
    // Sort servers by response time, ascending
    speedTests.sort((a, b) => a.responseTime - b.responseTime);
    return speedTests[0].server; // Return the fastest server
}

function isResumableDownload(url) {
    return url.endsWith(".mp4") || url.includes(".m3u8") || url.includes(".mpd");
}

async function downloadVideo(url, title) {
    const isResumable = isResumableDownload(url);
    if (isResumable) {
        console.log(`بدء تحميل الفيديو: ${title}`);
        // هنا يمكنك إضافة كود التحميل باستخدام أداة خارجية
        // أو تحميل الفيديو عبر API خاصة (مثل resuming أو طريقة أخرى)
    } else {
        console.log("الرابط لا يدعم استئناف التحميل");
    }
}

export default {
    id: "cinemana-vip",
    name: "Cinemana VIP",
    version: "3.1.0",
    icon: "https://cinemana.vip/wp-content/uploads/2024/01/favicon.png",
    description: "مشاهدة وتحميل المسلسلات والأفلام والأنمي مجاناً من موقع Cinemana.vip.",
    async popular(page) {
        cleanCookies(); // تنظيف الكوكيز عند تحميل الصفحة
        return await fetchPosts(0, page);
    },
    async latest(page) {
        cleanCookies(); // تنظيف الكوكيز عند تحميل الصفحة
        return await fetchPosts(0, page);
    },
    async search(query) {
        cleanCookies(); // تنظيف الكوكيز عند البحث
        return await fetchPosts(0, 1, query);
    },
    async categories() {
        cleanCookies(); // تنظيف الكوكيز عند الوصول إلى الفئات
        return await getCategories();
    },
    async category(categoryId, page) {
        cleanCookies(); // تنظيف الكوكيز عند فتح الفئة
        return await fetchPosts(categoryId, page);
    },
    async item(url) {
        cleanCookies(); // تنظيف الكوكيز عند عرض التفاصيل
        const detail = await loadPostDetail(url);
        const fastestServer = await getFastestServer(detail.videos.map(video => video.url));
        return {
            title: detail.title,
            description: detail.description,
            thumbnail: detail.thumbnail,
            episodes: detail.videos.map((video, idx) => ({
                title: video.title || `مشاهدة ${idx + 1}`,
                url: video.url === fastestServer ? video.url : fastestServer,
                type: video.type
            }))
        };
    }
};