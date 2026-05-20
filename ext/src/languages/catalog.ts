import type { Endpoints, LanguageMeta } from "../api/endpoints";

export class LanguageCatalog {
	private cache: LanguageMeta[] | null = null;
	private fetching: Promise<LanguageMeta[]> | null = null;

	constructor(private readonly endpoints: Endpoints) {}

	async getAll(): Promise<LanguageMeta[]> {
		if (this.cache) return this.cache;
		if (!this.fetching) {
			this.fetching = this.endpoints
				.languages()
				.then((r) => {
					this.cache = r.languages;
					return r.languages;
				})
				.finally(() => {
					this.fetching = null;
				});
		}
		return await this.fetching;
	}

	async get(id: string): Promise<LanguageMeta | undefined> {
		const all = await this.getAll();
		return all.find((l) => l.id === id);
	}

	invalidate(): void {
		this.cache = null;
	}
}
