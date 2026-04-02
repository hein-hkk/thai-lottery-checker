"use client";

import type {
  AdminBlogDetail,
  AdminBlogMetadataRequest,
  AdminBlogTranslationUpsertRequest,
  BlogBodyBlock,
  SupportedLocale
} from "@thai-lottery-checker/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  AdminApiError,
  createAdminBlog,
  publishAdminBlog,
  unpublishAdminBlog,
  updateAdminBlogMetadata,
  upsertAdminBlogTranslation
} from "../../admin/api";

type TranslationFormState = {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  paragraphs: string[];
};

const localeOrder: SupportedLocale[] = ["en", "th", "my"];

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

function localeLabel(locale: SupportedLocale): string {
  switch (locale) {
    case "en":
      return "English";
    case "th":
      return "Thai";
    case "my":
      return "Myanmar";
  }
}

function toTranslationState(post: AdminBlogDetail | undefined): Record<SupportedLocale, TranslationFormState> {
  return localeOrder.reduce(
    (accumulator, locale) => {
      const translation = post?.translations.find((item) => item.locale === locale);
      accumulator[locale] = {
        title: translation?.title ?? "",
        excerpt: translation?.excerpt ?? "",
        seoTitle: translation?.seoTitle ?? "",
        seoDescription: translation?.seoDescription ?? "",
        paragraphs: translation && translation.body.length > 0 ? translation.body.map((block) => block.text) : [""]
      };
      return accumulator;
    },
    {} as Record<SupportedLocale, TranslationFormState>
  );
}

function normalizeParagraphs(paragraphs: string[]): BlogBodyBlock[] {
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((text) => ({ type: "paragraph" as const, text }));
}

function buildMetadataPayload(slug: string, bannerImageUrl: string): AdminBlogMetadataRequest {
  return {
    slug,
    bannerImageUrl: bannerImageUrl.trim().length === 0 ? null : bannerImageUrl.trim()
  };
}

function buildTranslationPayload(translation: TranslationFormState): AdminBlogTranslationUpsertRequest {
  return {
    title: translation.title,
    body: normalizeParagraphs(translation.paragraphs),
    excerpt: translation.excerpt.trim().length === 0 ? null : translation.excerpt.trim(),
    seoTitle: translation.seoTitle.trim().length === 0 ? null : translation.seoTitle.trim(),
    seoDescription: translation.seoDescription.trim().length === 0 ? null : translation.seoDescription.trim()
  };
}

function buildReadiness(slug: string, translations: Record<SupportedLocale, TranslationFormState>): { isPublishable: boolean; issues: string[] } {
  const issues: string[] = [];

  if (slug.trim().length === 0) {
    issues.push("Slug is required");
  }

  const hasValidTranslation = localeOrder.some((locale) => {
    const translation = translations[locale];
    return translation.title.trim().length > 0 && normalizeParagraphs(translation.paragraphs).length > 0;
  });

  if (!hasValidTranslation) {
    issues.push("At least one valid translation is required");
    issues.push("A valid translation must include a title and at least one paragraph");
  }

  return {
    isPublishable: issues.length === 0,
    issues
  };
}

export function BlogEditorForm({ initialPost }: { initialPost?: AdminBlogDetail }) {
  const router = useRouter();
  const existingPost = initialPost ?? null;
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(initialPost?.bannerImageUrl ?? "");
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en");
  const [translations, setTranslations] = useState<Record<SupportedLocale, TranslationFormState>>(() => toTranslationState(initialPost));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const readiness = useMemo(() => buildReadiness(slug, translations), [slug, translations]);
  const metadataSnapshot = JSON.stringify(buildMetadataPayload(slug, bannerImageUrl));
  const initialMetadataSnapshot = useMemo(
    () =>
      existingPost
        ? JSON.stringify({
            slug: existingPost.slug,
            bannerImageUrl: existingPost.bannerImageUrl
          })
        : null,
    [existingPost]
  );
  const translationsSnapshot = JSON.stringify(
    localeOrder.map((locale) => ({
      locale,
      ...buildTranslationPayload(translations[locale])
    }))
  );
  const initialTranslationsSnapshot = useMemo(
    () =>
      existingPost
        ? JSON.stringify(
            localeOrder.map((locale) => {
              const translation = existingPost.translations.find((item) => item.locale === locale);

              return {
                locale,
                title: translation?.title ?? "",
                body: translation?.body ?? [],
                excerpt: translation?.excerpt ?? null,
                seoTitle: translation?.seoTitle ?? null,
                seoDescription: translation?.seoDescription ?? null
              };
            })
          )
        : null,
    [existingPost]
  );
  const hasUnsavedChanges =
    existingPost !== null &&
    (initialMetadataSnapshot !== metadataSnapshot || initialTranslationsSnapshot !== translationsSnapshot);

  const activeTranslation = translations[activeLocale];

  function updateActiveTranslation(updater: (current: TranslationFormState) => TranslationFormState) {
    setTranslations((current) => ({
      ...current,
      [activeLocale]: updater(current[activeLocale])
    }));
  }

  async function handleMetadataSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingMetadata(true);

    try {
      const payload = buildMetadataPayload(slug, bannerImageUrl);

      if (!existingPost) {
        const response = await createAdminBlog(payload);
        setSuccessMessage("Draft post created.");
        router.replace(`/admin/blogs/${response.post.id}`);
        router.refresh();
        return;
      }

      await updateAdminBlogMetadata(existingPost.id, payload);
      setSuccessMessage("Metadata saved.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to save blog metadata");
    } finally {
      setIsSavingMetadata(false);
    }
  }

  async function handleTranslationSave() {
    if (!existingPost) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingTranslation(true);

    try {
      await upsertAdminBlogTranslation(existingPost.id, activeLocale, buildTranslationPayload(activeTranslation));
      setSuccessMessage(`${localeLabel(activeLocale)} translation saved.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to save translation");
    } finally {
      setIsSavingTranslation(false);
    }
  }

  async function handlePublish() {
    if (!existingPost) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (hasUnsavedChanges) {
      setErrorMessage("Save changes before publishing.");
      return;
    }

    if (!readiness.isPublishable) {
      setErrorMessage("This post is not ready to publish yet.");
      return;
    }

    setIsPublishing(true);

    try {
      await publishAdminBlog(existingPost.id);
      setSuccessMessage("Post published.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to publish blog");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!existingPost) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (hasUnsavedChanges) {
      setErrorMessage("Save changes before changing publish status.");
      return;
    }

    setIsUnpublishing(true);

    try {
      await unpublishAdminBlog(existingPost.id);
      setSuccessMessage("Post unpublished.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to unpublish blog");
    } finally {
      setIsUnpublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="ui-kicker">{existingPost ? "Draft and publishing workflow" : "New draft"}</p>
          <h2 className="ui-title mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">
            {existingPost ? "Manage blog post" : "Create blog draft"}
          </h2>
          {existingPost ? (
            <p className="ui-copy mt-2">
              Status: {existingPost.status} • Published: {formatTimestamp(existingPost.publishedAt)}
            </p>
          ) : (
            <p className="ui-copy mt-2">Start with the core metadata, then continue into localized translations.</p>
          )}
        </div>
        <Link className="ui-button-secondary" href="/admin/blogs">
          Back to blogs
        </Link>
      </div>

      <form className="ui-panel p-6" onSubmit={handleMetadataSubmit}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="ui-kicker">Metadata</p>
            <h3 className="ui-section-title mt-2">Shared post settings</h3>
          </div>
          <button className="ui-button-primary" disabled={isSavingMetadata || isSavingTranslation || isPublishing || isUnpublishing} type="submit">
            {isSavingMetadata ? (existingPost ? "Saving..." : "Creating...") : existingPost ? "Save metadata" : "Create draft"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="ui-field">
            <span className="ui-field-label">Slug</span>
            <input className="ui-input" onChange={(event) => setSlug(event.target.value)} required value={slug} />
          </label>
          <label className="ui-field">
            <span className="ui-field-label">Banner image URL</span>
            <input
              className="ui-input"
              onChange={(event) => setBannerImageUrl(event.target.value)}
              placeholder="https://example.com/banner.jpg"
              value={bannerImageUrl}
            />
          </label>
        </div>
      </form>

      {existingPost ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
            <article className="ui-panel p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="ui-kicker">Translations</p>
                  <h3 className="ui-section-title mt-2">Localized content</h3>
                </div>
                <button
                  className="ui-button-primary"
                  disabled={isSavingMetadata || isSavingTranslation || isPublishing || isUnpublishing}
                  onClick={() => void handleTranslationSave()}
                  type="button"
                >
                  {isSavingTranslation ? "Saving..." : `Save ${localeLabel(activeLocale)}`}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {localeOrder.map((locale) => {
                  const localeState = translations[locale];
                  const isFilled = localeState.title.trim().length > 0 || normalizeParagraphs(localeState.paragraphs).length > 0;

                  return (
                    <button
                      className={locale === activeLocale ? "ui-button-primary" : "ui-button-secondary"}
                      key={locale}
                      onClick={() => setActiveLocale(locale)}
                      type="button"
                    >
                      {localeLabel(locale)} {isFilled ? "•" : ""}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4">
                <label className="ui-field">
                  <span className="ui-field-label">Title</span>
                  <input
                    className="ui-input"
                    onChange={(event) => updateActiveTranslation((current) => ({ ...current, title: event.target.value }))}
                    value={activeTranslation.title}
                  />
                </label>

                <label className="ui-field">
                  <span className="ui-field-label">Excerpt</span>
                  <textarea
                    className="ui-textarea"
                    onChange={(event) => updateActiveTranslation((current) => ({ ...current, excerpt: event.target.value }))}
                    value={activeTranslation.excerpt}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="ui-field">
                    <span className="ui-field-label">SEO title</span>
                    <input
                      className="ui-input"
                      onChange={(event) => updateActiveTranslation((current) => ({ ...current, seoTitle: event.target.value }))}
                      value={activeTranslation.seoTitle}
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field-label">SEO description</span>
                    <input
                      className="ui-input"
                      onChange={(event) => updateActiveTranslation((current) => ({ ...current, seoDescription: event.target.value }))}
                      value={activeTranslation.seoDescription}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="ui-field-label">Paragraphs</span>
                    <button
                      className="ui-button-secondary"
                      onClick={() =>
                        updateActiveTranslation((current) => ({
                          ...current,
                          paragraphs: [...current.paragraphs, ""]
                        }))
                      }
                      type="button"
                    >
                      Add paragraph
                    </button>
                  </div>

                  {activeTranslation.paragraphs.map((paragraph, index) => (
                    <div className="ui-panel-muted p-4" key={`${activeLocale}-${index}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="ui-kicker">Paragraph {index + 1}</p>
                        <button
                          className="ui-button-secondary"
                          disabled={activeTranslation.paragraphs.length === 1}
                          onClick={() =>
                            updateActiveTranslation((current) => ({
                              ...current,
                              paragraphs: current.paragraphs.filter((_, currentIndex) => currentIndex !== index)
                            }))
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        className="ui-textarea mt-3"
                        onChange={(event) =>
                          updateActiveTranslation((current) => ({
                            ...current,
                            paragraphs: current.paragraphs.map((item, currentIndex) =>
                              currentIndex === index ? event.target.value : item
                            )
                          }))
                        }
                        value={paragraph}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <aside className="space-y-6">
              <article className="ui-panel-muted p-6">
                <p className="ui-kicker">Publish readiness</p>
                <h3 className="ui-section-title mt-2">Checklist</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {readiness.issues.length === 0 ? (
                    <p className="ui-inline-success">Ready to publish.</p>
                  ) : (
                    readiness.issues.map((issue) => (
                      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 text-[var(--text-primary)]" key={issue}>
                        {issue}
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="ui-panel p-6">
                <p className="ui-kicker">Publish controls</p>
                <h3 className="ui-section-title mt-2">Visibility</h3>
                <p className="ui-copy mt-3">
                  {existingPost.status === "published"
                    ? "This post is public right now. Unpublishing will remove it from the public blog immediately."
                    : "Publishing requires at least one valid translation with a title and paragraph body."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {existingPost.status === "draft" ? (
                    <button
                      className="ui-button-primary"
                      disabled={isPublishing || isSavingMetadata || isSavingTranslation || !readiness.isPublishable}
                      onClick={() => void handlePublish()}
                      type="button"
                    >
                      {isPublishing ? "Publishing..." : "Publish post"}
                    </button>
                  ) : (
                    <button
                      className="ui-button-secondary"
                      disabled={isUnpublishing || isSavingMetadata || isSavingTranslation}
                      onClick={() => void handleUnpublish()}
                      type="button"
                    >
                      {isUnpublishing ? "Unpublishing..." : "Unpublish post"}
                    </button>
                  )}
                </div>
              </article>

              <article className="ui-panel-muted p-6">
                <p className="ui-kicker">Status</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Current state</span>
                    <span className={existingPost.status === "published" ? "ui-badge-success" : "ui-badge-warning"}>{existingPost.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Available locales</span>
                    <span>{existingPost.availableLocales.length > 0 ? existingPost.availableLocales.join(", ") : "None"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Updated</span>
                    <span>{formatTimestamp(existingPost.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Published</span>
                    <span>{formatTimestamp(existingPost.publishedAt)}</span>
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </>
      ) : null}

      {errorMessage ? <p className="ui-inline-error">{errorMessage}</p> : null}
      {successMessage ? <p className="ui-inline-success">{successMessage}</p> : null}
    </div>
  );
}
