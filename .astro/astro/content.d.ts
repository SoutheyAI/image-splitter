declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"blog": {
"art-gallery-grid-guide.md": {
	id: "art-gallery-grid-guide.md";
  slug: "art-gallery-grid-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"banner-grid-generator-guide.md": {
	id: "banner-grid-generator-guide.md";
  slug: "banner-grid-generator-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"complete-guide-image-splitter.md": {
	id: "complete-guide-image-splitter.md";
  slug: "complete-guide-image-splitter";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"create-stunning-photo-mosaics-guide.md": {
	id: "create-stunning-photo-mosaics-guide.md";
  slug: "create-stunning-photo-mosaics-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"facebook-banner-splitting-guide.md": {
	id: "facebook-banner-splitting-guide.md";
  slug: "facebook-banner-splitting-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"free-picture-grid-tools-guide.md": {
	id: "free-picture-grid-tools-guide.md";
  slug: "free-picture-grid-tools-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"how-to-split-image-equal-parts.md": {
	id: "how-to-split-image-equal-parts.md";
  slug: "how-to-split-image-equal-parts";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"how-to-split-image-grid-guide.md": {
	id: "how-to-split-image-grid-guide.md";
  slug: "how-to-split-image-grid-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"image-format-converter-guide.md": {
	id: "image-format-converter-guide.md";
  slug: "image-format-converter-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"instagram-grid-image-splitting-guide.md": {
	id: "instagram-grid-image-splitting-guide.md";
  slug: "instagram-grid-image-splitting-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"photo-collage-maker-guide.md": {
	id: "photo-collage-maker-guide.md";
  slug: "photo-collage-maker-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"pinterest-grid-maker-guide.md": {
	id: "pinterest-grid-maker-guide.md";
  slug: "pinterest-grid-maker-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"png-grid-maker-guide.md": {
	id: "png-grid-maker-guide.md";
  slug: "png-grid-maker-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"portfolio-grid-maker-guide.md": {
	id: "portfolio-grid-maker-guide.md";
  slug: "portfolio-grid-maker-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"product-photo-grid-guide.md": {
	id: "product-photo-grid-guide.md";
  slug: "product-photo-grid-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"tiktok-cover-splitter-guide.md": {
	id: "tiktok-cover-splitter-guide.md";
  slug: "tiktok-cover-splitter-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"twitter-header-splitting-guide.md": {
	id: "twitter-header-splitting-guide.md";
  slug: "twitter-header-splitting-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"wedding-photo-grid-guide.md": {
	id: "wedding-photo-grid-guide.md";
  slug: "wedding-photo-grid-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
};
"team": {
"janette-lynch.md": {
	id: "janette-lynch.md";
  slug: "janette-lynch";
  body: string;
  collection: "team";
  data: any
} & { render(): Render[".md"] };
"marcell-ziemann.md": {
	id: "marcell-ziemann.md";
  slug: "marcell-ziemann";
  body: string;
  collection: "team";
  data: any
} & { render(): Render[".md"] };
"robert-palmer.md": {
	id: "robert-palmer.md";
  slug: "robert-palmer";
  body: string;
  collection: "team";
  data: any
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}
