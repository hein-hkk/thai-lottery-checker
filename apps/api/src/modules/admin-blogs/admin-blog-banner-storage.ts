import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type {
  AdminBlogBannerUploadContentType,
  AdminBlogBannerUploadInitResponse
} from "@thai-lottery-checker/types";
import { adminBlogBannerMaxFileSizeBytes } from "@thai-lottery-checker/types";
import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import { getApiEnv, type ApiEnv } from "../../config/env.js";

const contentTypeExtensionMap: Record<AdminBlogBannerUploadContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

type BlogBannerStorageConfig = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  endpoint?: string;
  prefix: string;
  presignExpiresSeconds: number;
  forcePathStyle: boolean;
};

export interface CreateBlogBannerUploadInput {
  blogId: string;
  fileName: string;
  contentType: AdminBlogBannerUploadContentType;
  fileSize: number;
}

export interface BlogBannerStorage {
  isConfigured(): boolean;
  createUpload(input: CreateBlogBannerUploadInput): Promise<AdminBlogBannerUploadInitResponse>;
  objectExists(objectKey: string): Promise<boolean>;
  deleteObject(objectKey: string): Promise<void>;
  getPublicUrl(objectKey: string): string;
  getManagedObjectKeyFromUrl(value: string | null): string | null;
  isBlogObjectKey(blogId: string, objectKey: string): boolean;
}

function normalizePrefix(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function normalizePublicBaseUrl(value: string): string {
  return value.replace(/\/+$/g, "");
}

function buildPublicUrl(publicBaseUrl: string, objectKey: string): string {
  return `${normalizePublicBaseUrl(publicBaseUrl)}/${objectKey}`;
}

function resolveConfig(env: ApiEnv): BlogBannerStorageConfig | null {
  if (
    !env.BLOG_BANNER_STORAGE_REGION ||
    !env.BLOG_BANNER_STORAGE_BUCKET ||
    !env.BLOG_BANNER_STORAGE_ACCESS_KEY_ID ||
    !env.BLOG_BANNER_STORAGE_SECRET_ACCESS_KEY ||
    !env.BLOG_BANNER_STORAGE_PUBLIC_BASE_URL
  ) {
    return null;
  }

  return {
    region: env.BLOG_BANNER_STORAGE_REGION,
    bucket: env.BLOG_BANNER_STORAGE_BUCKET,
    accessKeyId: env.BLOG_BANNER_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.BLOG_BANNER_STORAGE_SECRET_ACCESS_KEY,
    publicBaseUrl: normalizePublicBaseUrl(env.BLOG_BANNER_STORAGE_PUBLIC_BASE_URL),
    endpoint: env.BLOG_BANNER_STORAGE_ENDPOINT,
    prefix: normalizePrefix(env.BLOG_BANNER_STORAGE_PREFIX),
    presignExpiresSeconds: env.BLOG_BANNER_STORAGE_PRESIGN_EXPIRES_SECONDS,
    forcePathStyle: env.BLOG_BANNER_STORAGE_FORCE_PATH_STYLE
  };
}

class DisabledBlogBannerStorage implements BlogBannerStorage {
  isConfigured(): boolean {
    return false;
  }

  async createUpload(): Promise<AdminBlogBannerUploadInitResponse> {
    throw new Error("Blog banner storage is unavailable");
  }

  async objectExists(): Promise<boolean> {
    return false;
  }

  async deleteObject(): Promise<void> {
    throw new Error("Blog banner storage is unavailable");
  }

  getPublicUrl(objectKey: string): string {
    return objectKey;
  }

  getManagedObjectKeyFromUrl(): string | null {
    return null;
  }

  isBlogObjectKey(): boolean {
    return false;
  }
}

class S3BlogBannerStorage implements BlogBannerStorage {
  private readonly client: S3Client;

  constructor(private readonly config: BlogBannerStorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  isConfigured(): boolean {
    return true;
  }

  async createUpload(input: CreateBlogBannerUploadInput): Promise<AdminBlogBannerUploadInitResponse> {
    const extension = contentTypeExtensionMap[input.contentType];
    const objectKey = this.buildObjectKey(input.blogId, extension);
    const expiresAt = new Date(Date.now() + this.config.presignExpiresSeconds * 1000);
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.config.bucket,
      Key: objectKey,
      Expires: this.config.presignExpiresSeconds,
      Fields: {
        key: objectKey,
        "Content-Type": input.contentType
      },
      Conditions: [
        ["eq", "$key", objectKey],
        ["eq", "$Content-Type", input.contentType],
        ["content-length-range", 1, adminBlogBannerMaxFileSizeBytes]
      ]
    });

    return {
      uploadUrl: url,
      fields,
      objectKey,
      publicUrl: this.getPublicUrl(objectKey),
      expiresAt: formatIsoTimestamp(expiresAt)
    };
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKey
        })
      );
      return true;
    } catch (error) {
      if (error instanceof Error && "name" in error && error.name === "NotFound") {
        return false;
      }

      throw error;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: objectKey
      })
    );
  }

  getPublicUrl(objectKey: string): string {
    return buildPublicUrl(this.config.publicBaseUrl, objectKey);
  }

  getManagedObjectKeyFromUrl(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const publicBaseUrl = `${this.config.publicBaseUrl}/`;

    if (!value.startsWith(publicBaseUrl)) {
      return null;
    }

    const objectKey = value.slice(publicBaseUrl.length);
    return objectKey.length > 0 ? objectKey : null;
  }

  isBlogObjectKey(blogId: string, objectKey: string): boolean {
    return objectKey.startsWith(`${this.config.prefix}/${blogId}/`);
  }

  private buildObjectKey(blogId: string, extension: string): string {
    return `${this.config.prefix}/${blogId}/${Date.now()}-${randomUUID()}.${extension}`;
  }
}

export function createBlogBannerStorage(env: ApiEnv = getApiEnv()): BlogBannerStorage {
  const config = resolveConfig(env);

  if (!config) {
    return new DisabledBlogBannerStorage();
  }

  return new S3BlogBannerStorage(config);
}
