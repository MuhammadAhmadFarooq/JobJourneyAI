import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any>;
}

const DEFAULT_TITLE = "JobJourneyAI - AI-Powered Job Matching, Resume Tailor & Interview Prep";
const DEFAULT_DESCRIPTION = "Accelerate your career with JobJourneyAI. Intelligent job discovery with live anti-expired shields, AI resume parsing & tailoring, cover letter generator, and role-specific interview coaching.";
const DEFAULT_KEYWORDS = "AI job search, resume tailor, ATS resume builder, cover letter generator, interview prep coach, tech jobs, remote jobs, AI career navigator";
const BASE_URL = "https://jobjourneyai.tech";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = "website",
  ogImage = "/favicon.jpg",
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | JobJourneyAI` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="JobJourneyAI" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* JSON-LD Structured Data Schema */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
